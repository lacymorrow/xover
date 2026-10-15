// GET /api/key?checkout_id=<uuid>
// Looks up the CrossOver Pro license key for a finished Polar checkout.
// Polar grants the key a few seconds after payment, so the page polls this
// until it returns { status: 'ready' }.

const POLAR = 'https://api.polar.sh/v1';
const PRODUCT_ID = '584b6ea6-d3e3-471b-ab67-9bdcd85afffa';
const BENEFIT_ID = '3ef0fb41-1729-4e7f-a976-43de77a987e5';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function polar(path) {
	const response = await fetch(`${POLAR}${path}`, {
		headers: { Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}` },
	});
	if (response.status === 404) return null;
	if (!response.ok)
		throw new Error(`Polar ${path} returned ${response.status}`);
	return response.json();
}

function send(res, code, body) {
	res.setHeader('Cache-Control', 'no-store');
	res.status(code).json(body);
}

export default async function handler(req, res) {
	const checkoutId = String(req.query.checkout_id || '');
	if (!UUID.test(checkoutId)) {
		return send(res, 400, { status: 'error', reason: 'missing' });
	}

	try {
		const checkout = await polar(`/checkouts/${checkoutId}`);
		if (!checkout || checkout.product_id !== PRODUCT_ID) {
			return send(res, 404, { status: 'error', reason: 'not_found' });
		}
		if (checkout.status === 'confirmed') {
			return send(res, 200, { status: 'pending' });
		}
		if (checkout.status !== 'succeeded') {
			return send(res, 200, { status: 'error', reason: checkout.status });
		}

		const grants = await polar(
			`/benefits/${BENEFIT_ID}/grants?customer_id=${checkout.customer_id}&is_granted=true&limit=100`,
		);
		// Newest grant first, in case the customer bought more than once
		const grant = (grants?.items || [])
			.filter((item) => item.properties?.license_key_id)
			.sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
		if (!grant) {
			return send(res, 200, { status: 'pending' });
		}

		const licenseKey = await polar(
			`/license-keys/${grant.properties.license_key_id}`,
		);
		if (!licenseKey?.key) {
			return send(res, 200, { status: 'pending' });
		}

		return send(res, 200, { status: 'ready', key: licenseKey.key });
	} catch (error) {
		console.error(error.message);
		return send(res, 502, { status: 'error', reason: 'upstream' });
	}
}

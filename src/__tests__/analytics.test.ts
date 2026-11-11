import analytics from '../main/analytics';

const trackEvent = jest.fn();
const aptabase = jest.fn();
let allow: boolean | undefined = true;

jest.mock('@aptabase/electron/main', () => ({
	initialize: (...a: unknown[]) => aptabase(...a),
	trackEvent: (...a: unknown[]) => trackEvent(...a),
}));
jest.mock('electron-log', () => ({ status: jest.fn() }));
jest.mock('../main/store-actions', () => ({ getSetting: () => allow }));

describe('analytics', () => {
	beforeEach(() => {
		trackEvent.mockClear();
		allow = true;
	});

	it('initializes with the CrossOver key and sends app_open', () => {
		analytics.appOpen();
		expect(aptabase).toHaveBeenCalledWith('A-US-3480695765');
		expect(trackEvent).toHaveBeenCalledWith('app_open', undefined);
	});

	it('sends only a feature name and an error class as props', () => {
		analytics.feature('license_activated');
		analytics.error('TypeError');
		expect(trackEvent).toHaveBeenNthCalledWith(1, 'feature_used', {
			name: 'license_activated',
		});
		expect(trackEvent).toHaveBeenNthCalledWith(2, 'error', {
			class: 'TypeError',
		});
	});

	it('stops at once when the switch goes off, and resumes when it comes back', () => {
		analytics.appOpen();
		trackEvent.mockClear();
		allow = false;
		analytics.feature('x');
		analytics.error('Error');
		expect(trackEvent).not.toHaveBeenCalled();
		allow = true;
		analytics.feature('x');
		expect(trackEvent).toHaveBeenCalledTimes(1);
	});
});

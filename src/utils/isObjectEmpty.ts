/* eslint-disable guard-for-in */
/* eslint-disable no-unreachable-loop */
/* eslint-disable no-restricted-syntax */
export function isObjectEmpty(obj: any) {
	for (const x in obj) {
		return false;
	}
	return true;
}

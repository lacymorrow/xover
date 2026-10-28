import { GlobalContext } from '@/renderer/context/global-context';
import { useContext } from 'react';

/**
 * The right half of the status bar: whatever the main process last said
 * ("App activated", "Started").
 *
 * It used to double as a button that opened a dialog of the last few log
 * lines. The status bar stays, the log button is gone (LAC-5868): nobody
 * reading "App activated" is looking for a process log, and a clickable
 * 11px string with no affordance was only ever found by accident.
 */
function AppStatus() {
	const { message } = useContext(GlobalContext);

	if (!message) return null;

	return <>{message}</>;
}

export default AppStatus;

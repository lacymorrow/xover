import { Separator } from '@/components/ui/separator';
import { ipcChannels } from '@/config/ipc-channels';
import {
	PresetAppType,
	PresetSummaryType,
	PresetsViewType,
	RunningAppType,
} from '@/config/presets';
import { PremiumGate, ProLink } from '@/renderer/components/ui/PremiumGate';
import { useGlobalContext } from '@/renderer/context/global-context';
import { useCallback, useEffect, useState } from 'react';

const EMPTY_VIEW: PresetsViewType = {
	presets: [],
	activeId: '',
	isPremium: false,
	autoProfilesSupported: true,
};

const invoke = <T,>(channel: string, ...args: unknown[]): Promise<T> =>
	window.electron.ipcRenderer.invoke(channel, ...args) as Promise<T>;

const buttonClass =
	'inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50';
const primaryClass =
	'inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50';
const inputClass =
	'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

const selectClass = inputClass.replace('flex w-full', 'inline-flex w-56');

const NO_APP = '';

/**
 * "Switch to this when <app> is in front." Lists what is running, keeps the
 * saved app in the list even when it is not running (a game you have not
 * launched yet is the normal case), and says what happens when two presets
 * name the same app.
 */
function AutoProfileRow({
	preset,
	others,
	supported,
	onSet,
}: {
	preset: PresetSummaryType;
	others: PresetSummaryType[];
	supported: boolean;
	onSet: (app: PresetAppType | null) => void;
}) {
	const [running, setRunning] = useState<RunningAppType[] | null>(null);

	const load = useCallback(() => {
		invoke<RunningAppType[]>(ipcChannels.PRESETS_RUNNING_APPS)
			.then(setRunning)
			.catch(() => setRunning([]));
	}, []);

	// One read on mount so "not running" is honest, another when the picker opens.
	useEffect(load, [load]);

	const saved = preset.app;
	const list = running ?? [];
	const savedRunning = !!saved && list.some((a) => a.id === saved.id);
	const sharing = saved ? others.filter((o) => o.app?.id === saved.id) : [];

	const options: PresetAppType[] = [...list];
	if (saved && !savedRunning) options.unshift(saved);

	return (
		<div className="space-y-1">
			<div className="flex flex-wrap items-center gap-2 text-sm">
				<label htmlFor={`app-${preset.id}`} className="text-muted-foreground">
					Switch to this when
				</label>
				<select
					id={`app-${preset.id}`}
					className={selectClass}
					value={saved?.id ?? NO_APP}
					onMouseDown={load}
					disabled={!supported}
					onChange={(event) => {
						const next = options.find((a) => a.id === event.target.value);
						onSet(next ? { id: next.id, name: next.name } : null);
					}}
				>
					<option value={NO_APP}>No app</option>
					{options.map((a) => (
						<option key={a.id} value={a.id}>
							{a.name}
							{saved?.id === a.id && !savedRunning && running
								? ' (not running)'
								: ''}
						</option>
					))}
				</select>
				<span className="text-muted-foreground">is in front</span>
			</div>
			{saved && running && !savedRunning && (
				<p className="text-xs text-muted-foreground">
					{saved.name} is not running. It will switch the next time it comes to
					the front.
				</p>
			)}
			{sharing.length > 0 && (
				<p className="text-xs text-muted-foreground">
					{sharing.map((o) => o.name).join(', ')}{' '}
					{sharing.length === 1 ? 'also uses' : 'also use'} {saved?.name}. The
					one you used last wins.
				</p>
			)}
		</div>
	);
}

function PresetRow({
	preset,
	others,
	active,
	view,
	onChanged,
}: {
	preset: PresetSummaryType;
	others: PresetSummaryType[];
	active: boolean;
	view: PresetsViewType;
	onChanged: () => void;
}) {
	const [renaming, setRenaming] = useState(false);
	const [name, setName] = useState(preset.name);
	const [confirmDelete, setConfirmDelete] = useState(false);

	const rename = async () => {
		await invoke(ipcChannels.PRESET_RENAME, preset.id, name);
		setRenaming(false);
		onChanged();
	};

	let actions;
	if (renaming) {
		actions = (
			<>
				<button type="button" className={primaryClass} onClick={rename}>
					Save name
				</button>
				<button
					type="button"
					className={buttonClass}
					onClick={() => {
						setName(preset.name);
						setRenaming(false);
					}}
				>
					Cancel
				</button>
			</>
		);
	} else if (confirmDelete) {
		actions = (
			<>
				<span className="text-sm text-muted-foreground">
					Delete this preset?
				</span>
				<button
					type="button"
					className={buttonClass}
					onClick={async () => {
						await invoke(ipcChannels.PRESET_DELETE, preset.id);
						onChanged();
					}}
				>
					Delete
				</button>
				<button
					type="button"
					className={buttonClass}
					onClick={() => setConfirmDelete(false)}
				>
					Keep
				</button>
			</>
		);
	} else {
		actions = (
			<>
				<button
					type="button"
					className={active ? buttonClass : primaryClass}
					disabled={active}
					onClick={async () => {
						await invoke(ipcChannels.PRESET_APPLY, preset.id);
						onChanged();
					}}
				>
					{active ? 'Applied' : 'Apply'}
				</button>
				<button
					type="button"
					className={buttonClass}
					onClick={() => setRenaming(true)}
				>
					Rename
				</button>
				<button
					type="button"
					className={buttonClass}
					onClick={() => setConfirmDelete(true)}
				>
					Delete
				</button>
			</>
		);
	}

	return (
		<li className="space-y-3 rounded-lg border p-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="min-w-0 space-y-0.5">
					{renaming ? (
						<input
							aria-label="Preset name"
							className={inputClass}
							value={name}
							maxLength={60}
							onChange={(e) => setName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') rename();
								if (e.key === 'Escape') setRenaming(false);
							}}
						/>
					) : (
						<p className="truncate text-base font-medium">
							{preset.name}
							{active && (
								<span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
									Active
								</span>
							)}
							{preset.imported && (
								<span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
									Imported
								</span>
							)}
						</p>
					)}
					<p className="text-sm text-muted-foreground">
						{preset.windowCount === 1
							? '1 crosshair'
							: `${preset.windowCount} crosshairs`}
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-2">{actions}</div>
			</div>

			{/* Auto profile: Pro. A licensed user gets the picker. Anyone else gets
			    the badge and a link, plus a way to clear an app they already have. */}
			<PremiumGate
				locked={
					<div className="flex flex-wrap items-center gap-3">
						<span className="text-sm text-muted-foreground">
							{preset.app
								? `Switches when ${preset.app.name} is in front, paused without Pro.`
								: 'Switch to this when an app is in front.'}
						</span>
						<ProLink />
						{preset.app && (
							<button
								type="button"
								className="text-sm text-muted-foreground hover:text-foreground hover:underline"
								onClick={async () => {
									await invoke(ipcChannels.PRESET_SET_APP, preset.id, null);
									onChanged();
								}}
							>
								Clear
							</button>
						)}
					</div>
				}
			>
				<AutoProfileRow
					preset={preset}
					others={others}
					supported={view.autoProfilesSupported}
					onSet={async (app) => {
						await invoke(ipcChannels.PRESET_SET_APP, preset.id, app);
						onChanged();
					}}
				/>
			</PremiumGate>
		</li>
	);
}

/**
 * Presets (Pro to create). A preset is the whole setup: every crosshair
 * window, its look, position and display. Apply, cycle, rename and delete are
 * free, so presets imported from v3 keep working without a license.
 * Lacy, 2026-11-16, LAC-7622.
 */
export function SettingsPresets() {
	const { keybinds, app } = useGlobalContext();
	const [view, setView] = useState<PresetsViewType>(EMPTY_VIEW);
	const [name, setName] = useState('');
	const [error, setError] = useState('');

	const refresh = useCallback(() => {
		invoke<PresetsViewType>(ipcChannels.PRESETS_GET)
			.then(setView)
			.catch(console.error);
	}, []);

	useEffect(() => {
		refresh();
		const off = window.electron.ipcRenderer.on(
			ipcChannels.APP_UPDATED,
			refresh,
		);
		return () => off?.();
	}, [refresh]);

	const save = async () => {
		setError('');
		const result = await invoke<{ ok: boolean; reason?: string }>(
			ipcChannels.PRESET_SAVE,
			name,
		);
		if (result.ok) {
			setName('');
		} else if (result.reason === 'full') {
			setError('That is the most presets CrossOver holds. Delete one first.');
		} else if (result.reason === 'pro') {
			setError('Saving new presets needs Pro.');
		}
		refresh();
	};

	const { presets, activeId } = view;
	const cycle = keybinds.cyclePreset;
	const modifierName = app.os === 'mac' ? 'Option' : 'Alt';

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Presets</h3>
				<p className="text-sm text-muted-foreground">
					Save your whole setup: every crosshair window, how it looks, where it
					sits and which display it is on. Applying a preset opens or closes
					windows to match.
				</p>
			</div>
			<Separator />

			<div className="space-y-2">
				<PremiumGate
					locked={
						<div className="flex flex-wrap items-center gap-3">
							<button type="button" className={primaryClass} disabled>
								Save current setup
							</button>
							<ProLink />
						</div>
					}
				>
					<div className="flex gap-2">
						<input
							aria-label="New preset name"
							className={inputClass}
							placeholder="Name (optional)"
							value={name}
							maxLength={60}
							onChange={(e) => setName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') save();
							}}
						/>
						<button type="button" className={primaryClass} onClick={save}>
							Save current setup
						</button>
					</div>
				</PremiumGate>
				{error && (
					<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
				)}
				<p className="text-sm text-muted-foreground">
					{cycle
						? `Press ${cycle.replace('Alt', modifierName)} to switch to the next preset without opening this window.`
						: 'Cycling presets has no shortcut. Set one under Shortcuts.'}
				</p>
			</div>

			{presets.length === 0 ? (
				<div className="rounded-lg border border-dashed p-6 text-center">
					<p className="font-medium">No presets yet</p>
					<p className="mt-1 text-sm text-muted-foreground">
						{view.isPremium
							? 'Set up your crosshairs the way you want them, then save the setup here.'
							: 'Presets you import from CrossOver v3, or save with Pro, appear here.'}
					</p>
				</div>
			) : (
				<ul className="space-y-3">
					{presets.map((preset) => (
						<PresetRow
							key={preset.id}
							preset={preset}
							others={presets.filter((p) => p.id !== preset.id)}
							active={preset.id === activeId}
							view={view}
							onChanged={refresh}
						/>
					))}
				</ul>
			)}

			{!view.autoProfilesSupported && (
				<p className="text-sm text-muted-foreground">
					Switching by app needs an X11 session on Linux. It is off here.
				</p>
			)}
		</div>
	);
}

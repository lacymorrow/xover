import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useGlobalContext } from '@/renderer/context/global-context';
import { ChevronDown, ChevronRight, ImagePlus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

interface GroupedImages {
	[folder: string]: { label: string; value: string; filename: string }[];
}

interface CrosshairGalleryProps {
	/** Which window state key to set when selecting a crosshair. Defaults to 'crosshair'. */
	stateKey?: 'crosshair' | 'crosshairSecondary';
}

export function CrosshairGallery({
	stateKey = 'crosshair',
}: CrosshairGalleryProps) {
	const { crosshairImages, windowState } = useGlobalContext();
	const [search, setSearch] = useState('');
	const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
		new Set(),
	);

	const selectedValue =
		stateKey === 'crosshairSecondary'
			? windowState.crosshairSecondary
			: windowState.crosshair;

	const handleSelect = useCallback(
		(value: string) => {
			window.electron.setWindowState({ [stateKey]: value });
		},
		[stateKey],
	);

	// Group images by folder, deduplicating by value (full path)
	const grouped = useMemo(() => {
		const groups: GroupedImages = {};
		const seen = new Set<string>();
		crosshairImages.forEach((img) => {
			if (!seen.has(img.value)) {
				seen.add(img.value);

				const parts = img.value.replace(/\\/g, '/').split('/');
				const filename = parts.pop() ?? '';
				// Find the folder name (parent of file)
				const crosshairsIdx = parts.findIndex((p) => p === 'crosshairs');
				let folder = 'Other';
				if (crosshairsIdx >= 0 && crosshairsIdx < parts.length - 1) {
					folder = parts
						.slice(crosshairsIdx + 1)
						.join('/')
						.replace(/^\/?/, '');
				}
				if (!folder) folder = 'Other';

				if (!groups[folder]) groups[folder] = [];
				groups[folder].push({ ...img, filename });
			}
		});
		return groups;
	}, [crosshairImages]);

	// Filter by search
	const filteredGroups = useMemo(() => {
		if (!search.trim()) return grouped;
		const q = search.toLowerCase();
		const result: GroupedImages = {};
		Object.entries(grouped).forEach(([folder, images]) => {
			const filtered = images.filter(
				(img) =>
					img.filename.toLowerCase().includes(q) ||
					folder.toLowerCase().includes(q),
			);
			if (filtered.length > 0) result[folder] = filtered;
		});
		return result;
	}, [grouped, search]);

	const toggleGroup = useCallback((folder: string) => {
		setCollapsedGroups((prev) => {
			const next = new Set(prev);
			if (next.has(folder)) next.delete(folder);
			else next.add(folder);
			return next;
		});
	}, []);

	const sortedFolders = useMemo(
		() => Object.keys(filteredGroups).sort(),
		[filteredGroups],
	);

	const handleClickBrowse = useCallback(() => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept =
			'image/png,image/jpeg,image/svg+xml,image/gif,image/webp,image/bmp';
		input.multiple = true;
		input.onchange = () => {
			if (input.files) {
				Array.from(input.files).forEach((file) => {
					const filePath = window.electron.getPathForFile(file);
					if (filePath) {
						window.electron.openFile(filePath);
					}
				});
			}
		};
		input.click();
	}, []);

	return (
		<div className="space-y-3">
			<div className="space-y-1">
				<h3 className="font-medium text-base">Crosshair</h3>
				<p className="text-sm text-muted-foreground">
					Select the crosshair style.
				</p>
			</div>

			<button
				type="button"
				onClick={handleClickBrowse}
				className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed p-3 text-sm text-muted-foreground transition-colors cursor-pointer border-muted-foreground/25 hover:border-muted-foreground/50 hover:text-foreground"
			>
				<ImagePlus className="h-4 w-4" />
				<span>Add custom crosshair</span>
			</button>

			<Input
				placeholder="Search crosshairs..."
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				className="h-8"
			/>

			<ScrollArea className="h-[320px] rounded-md border p-2">
				{sortedFolders.length === 0 && (
					<p className="text-sm text-muted-foreground p-4 text-center">
						No crosshairs found.
					</p>
				)}
				{sortedFolders.map((folder) => {
					const images = filteredGroups[folder];
					const isCollapsed = collapsedGroups.has(folder);

					return (
						<div key={folder} className="mb-2">
							{/* Folder header */}
							<button
								type="button"
								onClick={() => toggleGroup(folder)}
								className="flex w-full items-center gap-1 rounded px-1 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-accent hover:text-accent-foreground"
							>
								{isCollapsed ? (
									<ChevronRight className="h-3 w-3" />
								) : (
									<ChevronDown className="h-3 w-3" />
								)}
								{folder}
								<span className="ml-auto text-[10px] font-normal">
									{images.length}
								</span>
							</button>

							{/* Image grid */}
							{!isCollapsed && (
								<div className="grid grid-cols-5 gap-1.5 p-1">
									{images.map((img) => {
										const isSelected = selectedValue === img.value;
										return (
											<button
												key={img.value}
												type="button"
												onClick={() => handleSelect(img.value)}
												title={img.filename}
												className={cn(
													'group relative flex flex-col items-center rounded-md border p-1.5 transition-colors hover:bg-accent',
													isSelected
														? 'border-primary bg-primary/10 ring-1 ring-primary'
														: 'border-transparent',
												)}
											>
												<div className="flex h-10 w-10 items-center justify-center">
													<img
														src={`file://${img.value}`}
														alt={img.filename}
														className="max-h-full max-w-full object-contain"
														draggable={false}
													/>
												</div>
												<span className="mt-0.5 w-full truncate text-center text-[9px] leading-tight text-muted-foreground group-hover:text-foreground">
													{img.filename.replace(/\.[^.]+$/, '')}
												</span>
											</button>
										);
									})}
								</div>
							)}
						</div>
					);
				})}
			</ScrollArea>
		</div>
	);
}

import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useGlobalContext } from '@/renderer/context/global-context';
import { ChevronDown, ChevronRight, ImagePlus } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';

const IMAGE_EXTENSIONS = [
	'image/png',
	'image/jpeg',
	'image/svg+xml',
	'image/gif',
	'image/webp',
	'image/bmp',
];

interface GroupedImages {
	[folder: string]: { label: string; value: string; filename: string }[];
}

export function CrosshairGallery() {
	const { crosshairImages, windowState } = useGlobalContext();
	const [search, setSearch] = useState('');
	const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
		new Set(),
	);
	const [isDragOver, setIsDragOver] = useState(false);

	const handleSelect = useCallback((value: string) => {
		window.electron.setWindowState({ crosshair: value });
	}, []);

	// Group images by folder
	const grouped = useMemo(() => {
		const groups: GroupedImages = {};
		for (const img of crosshairImages) {
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
		return groups;
	}, [crosshairImages]);

	// Filter by search
	const filteredGroups = useMemo(() => {
		if (!search.trim()) return grouped;
		const q = search.toLowerCase();
		const result: GroupedImages = {};
		for (const [folder, images] of Object.entries(grouped)) {
			const filtered = images.filter(
				(img) =>
					img.filename.toLowerCase().includes(q) ||
					folder.toLowerCase().includes(q),
			);
			if (filtered.length > 0) result[folder] = filtered;
		}
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

	// Drag and drop handlers
	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);
	}, []);

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);

		const files = Array.from(e.dataTransfer.files);
		for (const file of files) {
			if (IMAGE_EXTENSIONS.includes(file.type)) {
				// Electron File objects have a .path property
				const filePath = (file as any).path;
				if (filePath) {
					window.electron.ipcRenderer.send('open-file', filePath);
				}
			}
		}
	}, []);

	const sortedFolders = useMemo(
		() => Object.keys(filteredGroups).sort(),
		[filteredGroups],
	);

	return (
		<div className="space-y-3">
			<div className="space-y-1">
				<label className="font-medium text-base">Crosshair</label>
				<p className="text-sm text-muted-foreground">
					Select the crosshair style.
				</p>
			</div>

			<Input
				placeholder="Search crosshairs..."
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				className="h-8"
			/>

			{/* Drop zone */}
			<div
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				className={cn(
					'flex items-center justify-center gap-2 rounded-lg border-2 border-dashed p-3 text-sm text-muted-foreground transition-colors cursor-pointer',
					isDragOver
						? 'border-primary bg-primary/10 text-primary'
						: 'border-muted-foreground/25 hover:border-muted-foreground/50',
				)}
			>
				<ImagePlus className="h-4 w-4" />
				<span>Drop custom crosshair images here</span>
			</div>

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
										const isSelected =
											windowState.crosshair === img.value;
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

// DATA SHOULD ONLY FLOW DOWNWARDS
// We pass data from the main process to the renderer process using IPC
// We also use IPC to update data

// todo: add os here

import React, { useContext, useEffect, useMemo } from 'react';

interface SettingsContextType {
	isDragging: boolean;
}

export const SettingsContext = React.createContext<SettingsContextType>({
	isDragging: false,
});

export function SettingsContextProvider({
	children,
}: {
	children?: React.ReactNode;
}) {
	const [isDragging, setIsDragging] = React.useState(false);

	useEffect(() => {
		const handleDragEnter = (e: DragEvent) => {
			console.log('drag enter');
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(true);
		};

		const handleDragOver = (e: DragEvent) => {
			console.log('drag over');
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(true);
		};

		const handleDragLeave = (e: DragEvent) => {
			console.log('drag leave');
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(false);
		};

		const handleDrop = (e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();

			for (const f of e.dataTransfer.files) {
				console.log('File(s) you dragged here: ', f.path);
			}
		};

		// document.addEventListener('dragenter', handleDragEnter);
		// document.addEventListener('dragover', handleDragOver);
		// document.addEventListener('dragleave', handleDragLeave);
		// document.addEventListener('drop', handleDrop);

		return () => {
			document.removeEventListener('dragenter', handleDragEnter);
			document.removeEventListener('dragover', handleDragOver);
			document.removeEventListener('dragleave', handleDragLeave);
			document.removeEventListener('drop', handleDrop);
		};
	}, []);

	const value = useMemo(() => {
		return {
			isDragging,
		};
	}, [isDragging]);

	return (
		<SettingsContext.Provider value={value}>
			{children}
		</SettingsContext.Provider>
	);
}

export const useSettingsContext = () => {
	const context = useContext(SettingsContext);

	if (context === undefined)
		throw new Error('useSettingsContext must be used within a SettingsContext');

	return context;
};

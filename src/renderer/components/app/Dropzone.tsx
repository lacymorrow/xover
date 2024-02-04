import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export function MyDropzone() {
	const onDrop = useCallback((acceptedFiles: any) => {
		// Do something with the files
	}, []);
	const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

	return (
		<div {...getRootProps()} draggable>
			<input {...getInputProps()} />
			{isDragActive ? (
				<p>Drop the files here ...</p>
			) : (
				<p>Drag drop some files here, or click to select files</p>
			)}
		</div>
	);
}

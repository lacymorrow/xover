/**
 * v0 by Vercel.
 * @see https://v0.dev/t/2UmqQnFMsUW
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */

import { cn } from '@/lib/utils';
import { ImageIcon } from '@radix-ui/react-icons';

export default function DropIndicator({
	isDragActive,
}: {
	isDragActive: boolean;
}) {
	return (
		<div
			className={cn(
				'p-6 absolute z-10 top-0 bottom-0 left-0 right-0 m-auto bg-white bg-opacity-90 pointer-events-none transition-opacity opacity-0',
				{
					'opacity-100': isDragActive,
				},
			)}
		>
			<div className="border-dashed border border-gray-300 rounded-lg p-6 flex items-center justify-center gap-4 h-full">
				<ImageIcon className="w-6 h-6" />
				<span className="text-sm font-medium text-gray-500">
					Drag and drop your image here to set it as a crosshair
				</span>
			</div>
		</div>
	);
}

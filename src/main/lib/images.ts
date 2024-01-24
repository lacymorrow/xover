import fs from 'fs';
import path from 'path';
import { IMAGE_EXTENSIONS } from '../../config/config';
// recursively scan directory for images, return a promise that resolves to an array of image paths

export const getImages = (directory: string, level: number) => {
	const images: string[] = [];
	const files = fs.readdirSync(directory);
	files.forEach((file) => {
		const filePath = path.join(directory, file);
		const stat = fs.statSync(filePath);
		if (stat.isDirectory()) {
			if (level > 0) {
				images.push(...getImages(filePath, level - 1));
			}
		} else if (stat.isFile()) {
			if (IMAGE_EXTENSIONS.indexOf(path.extname(filePath)) !== -1) {
				images.push(filePath);
			}
		}
	});
	return images;
};

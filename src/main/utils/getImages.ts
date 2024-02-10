import fs from 'fs';
import path from 'path';
import { IMAGE_EXTENSIONS } from '../../config/config';

// recursively scan directory for images, return a promise that resolves to an array of image paths
export const getImages = (
	directory: string,
	level: number,
): Promise<string[]> => {
	return new Promise((resolve, reject) => {
		try {
			const images: string[] = [];
			const img: any = {};
			const files = fs.readdirSync(directory);
			files.forEach((file) => {
				const filePath = path.join(directory, file);
				const stat = fs.statSync(filePath);
				if (stat.isDirectory()) {
					if (level > 0) {
						getImages(filePath, level - 1)
							.then((subImages) => {
								images.push(...subImages);
								if (file === files[files.length - 1]) {
									resolve(images);
								}
							})
							.catch(reject);
					}
				} else if (stat.isFile()) {
					if (IMAGE_EXTENSIONS.indexOf(path.extname(filePath)) !== -1) {
						images.push(filePath);
						img[filePath] = true;
					}
					if (file === files[files.length - 1]) {
						resolve(images);
					}
				}
			});
		} catch (error) {
			reject(error);
		}
	});
};

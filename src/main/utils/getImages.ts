import Logger from 'electron-log';
import fs from 'fs';
import path from 'path';
import { DIRECTORY_SCAN_DEPTH, IMAGE_EXTENSIONS } from '../../config/config';
import { __crosshairs } from '../paths';
import { getCrosshairImages, setCrosshairImages } from '../store-actions';

const isValidImage = (filePath: string) => {
	return IMAGE_EXTENSIONS.indexOf(path.extname(filePath)) !== -1;
};

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
					if (isValidImage(filePath)) {
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

export const scanImages = async () => {
	// Load crosshair images
	await getImages(__crosshairs, DIRECTORY_SCAN_DEPTH)
		.then((images) => {
			const currentImages = getCrosshairImages();

			// Clear the list of images
			setCrosshairImages([]);

			// Add custom images to the list
			currentImages.forEach((image) => {
				if (images.indexOf(image) === -1 && isValidImage(image)) {
					images.push(image);
				}
			});

			// Save the list of images
			setCrosshairImages(images);
		})
		.catch((error) => {
			Logger.error(error);
		});
};

import '@/renderer/lib/assembly';
import '@/renderer/styles/color-picker.scss';
import ColorPicker from '@mapbox/react-colorpickr';
import { useState } from 'react';

export const ColorPickerInput = () => {
	const [color, setColor] = useState({});

	return (
		<>
			<ColorPicker onChange={console.log} eyedropper={true} reset={false} />
		</>
	);
};

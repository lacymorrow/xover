import Chrome from '@uiw/react-color-chrome';
import { GithubPlacement } from '@uiw/react-color-github';
import { useState } from 'react';
import { RgbaColorPicker } from 'react-colorful';

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';

export const ColorPickerInput = () => {
	const [color, setColor] = useState({});
	const [hex, setHex] = useState('#d29c9c53');

	return (
		<>
			<Popover>
				<PopoverTrigger>
					<div className={`bg-[${color}]`}>Open</div>
				</PopoverTrigger>
				<PopoverContent>
					<Chrome
						color={hex}
						placement={GithubPlacement.TopRight}
						onChange={(color) => {
							setHex(color.hexa);
						}}
					/>
					<RgbaColorPicker color={color} onChange={setColor} />
				</PopoverContent>
			</Popover>
		</>
	);
};

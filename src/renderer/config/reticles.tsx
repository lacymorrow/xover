import {
	BookmarkFilledIcon,
	BookmarkIcon,
	CaretUpIcon,
	CircleIcon,
	CommitIcon,
	Cross1Icon,
	CrossCircledIcon,
	Crosshair1Icon,
	Crosshair2Icon,
	DiscIcon,
	DotFilledIcon,
	DotIcon,
	DotsHorizontalIcon,
	EnterFullScreenIcon,
	ExitFullScreenIcon,
	EyeClosedIcon,
	EyeOpenIcon,
	GlobeIcon,
	GridIcon,
	Half1Icon,
	HeartFilledIcon,
	HeartIcon,
	MinusCircledIcon,
	MinusIcon,
	PlusCircledIcon,
	PlusIcon,
	RadiobuttonIcon,
	SewingPinFilledIcon,
	SewingPinIcon,
	SquareIcon,
	StarFilledIcon,
	StarIcon,
	SunIcon,
	TargetIcon,
	ViewHorizontalIcon,
} from '@radix-ui/react-icons';

export const reticles = [
	{
		label: 'Crosshair',
		value: 'crosshair',
		Icon: Crosshair2Icon,
	},
	{
		label: 'Crosshair Circled',
		value: 'crosshairCircled',
		Icon: Crosshair1Icon,
	},
	{
		label: 'Dot',
		value: 'point',
		Icon: DotFilledIcon,
	},
	{
		label: 'Dot Circled',
		value: 'pointCircled',
		Icon: RadiobuttonIcon,
	},
	{
		label: 'Dots',
		value: 'dots',
		Icon: DotsHorizontalIcon,
	},
	{
		label: 'Disc',
		value: 'disc',
		Icon: DotIcon,
	},
	{
		label: 'Disc Circled',
		value: 'discCircled',
		Icon: DiscIcon,
	},
	{
		label: 'Target',
		value: 'target',
		Icon: TargetIcon,
	},
	{
		label: 'Plus',
		value: 'plus',
		Icon: PlusIcon,
	},
	{
		label: 'Plus Circled',
		value: 'plusCircled',
		Icon: PlusCircledIcon,
	},

	{
		label: 'Plus Squared',
		value: 'plusSquared',
		Icon: GridIcon,
	},
	{
		label: 'Cross',
		value: 'cross',
		Icon: Cross1Icon,
	},
	{
		label: 'Cross Circled',
		value: 'crossCircled',
		Icon: CrossCircledIcon,
	},
	{
		label: 'Minus',
		value: 'minus',
		Icon: MinusIcon,
	},
	{
		label: 'Minus Circled',
		value: 'minusCircled',
		Icon: MinusCircledIcon,
	},
	{
		label: 'Split',
		value: 'split',
		Icon: CommitIcon,
	},
	{
		label: 'Circle',
		value: 'circle',
		Icon: CircleIcon,
	},
	{
		label: 'Circle Split',
		value: 'circleSplit',
		Icon: Half1Icon,
	},
	{
		label: 'Square',
		value: 'square',
		Icon: SquareIcon,
	},
	{
		label: 'Square Split ',
		value: 'squareSplit',
		Icon: ViewHorizontalIcon,
	},
	{
		label: 'Stressed Out',
		value: 'stressedOut',
		Icon: EnterFullScreenIcon,
	},
	{
		label: 'Stressed In',
		value: 'stressedIn',
		Icon: ExitFullScreenIcon,
	},
	{
		label: 'Chevron',
		value: 'chevron',
		Icon: CaretUpIcon,
	},
	{
		label: 'Eye',
		value: 'eye',
		Icon: EyeOpenIcon,
	},
	{
		label: 'Eye Closed',
		value: 'eyeClosed',
		Icon: EyeClosedIcon,
	},
	{
		label: 'Globe',
		value: 'globe',
		Icon: GlobeIcon,
	},
	{
		label: 'Sunburst',
		value: 'sunburst',
		Icon: SunIcon,
	},
	{
		label: 'Heart',
		value: 'heart',
		Icon: HeartIcon,
	},
	{
		label: 'Heart Filled',
		value: 'heartFilled',
		Icon: HeartFilledIcon,
	},
	{
		label: 'Star',
		value: 'star',
		Icon: StarIcon,
	},
	{
		label: 'Star Filled',
		value: 'starFilled',
		Icon: StarFilledIcon,
	},
	{
		label: 'Pin',
		value: 'pin',
		Icon: SewingPinIcon,
	},
	{
		label: 'Pin Filled',
		value: 'pinFilled',
		Icon: SewingPinFilledIcon,
	},
	{
		label: 'Bookmark',
		value: 'bookmark',
		Icon: BookmarkIcon,
	},
	{
		label: 'Bookmark Filled',
		value: 'bookmarkFilled',
		Icon: BookmarkFilledIcon,
	},
];

export const reticleItems = reticles.map((reticle) => ({
	label: (
		<div className="flex gap-2 justify-between items-center">
			<reticle.Icon /> {reticle.label}
		</div>
	),
	value: reticle.value,
}));

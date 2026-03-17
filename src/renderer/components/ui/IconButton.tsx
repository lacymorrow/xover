export const IconButton = ({ children, ...props }: any) => (
	<button {...props} className={`icon-button p-4${props.className ? ` ${props.className}` : ''}`}>
		{children}
	</button>
);

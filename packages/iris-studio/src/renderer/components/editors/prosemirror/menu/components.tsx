import { Fragment, useState, type ReactNode, type FC } from 'react';
import {
	useEditorEventCallback,
	useEditorEffect
} from '@nytimes/react-prosemirror';
import {
	Button,
	ToggleButton,
	TooltipTrigger,
	Tooltip,
	type ButtonProps
} from 'react-aria-components';
import type { EditorState, Command } from 'prosemirror-state';
import type { NodeType, MarkType } from 'prosemirror-model';
import type { EditorView } from 'prosemirror-view';
import { toggleMark } from 'prosemirror-commands';
import { markActive } from '../commands';
import { useVisibility } from '$components/VisibilityContext';

export function isNode(state: EditorState, nodeType: NodeType) {
	return state.selection.$from.parent.type === nodeType;
}

function displayKey(key: string) {
	if (key === 'Mod') {
		return os.platform === 'darwin' ? 'Cmd' : 'Ctrl';
	}

	if (key === 'Alt') {
		return os.platform === 'darwin' ? 'Option' : 'Alt';
	}

	return key;
}

interface MenuBarTooltipProps {
	tooltip: string;
	keys?: string[];
	children: ReactNode;
}

export function MenuBarTooltip({
	tooltip,
	keys,
	children
}: MenuBarTooltipProps) {
	return (
		<TooltipTrigger delay={300}>
			{children}
			<Tooltip
				placement="bottom"
				className="react-aria-Tooltip flex flex-col items-center"
			>
				{tooltip}
				{keys && (
					<span className="text-xs">
						{keys.map((k, i) => (
							<Fragment key={i}>
								<kbd className="text-xs">{displayKey(k)}</kbd>
								{i !== keys.length - 1 && ' + '}
							</Fragment>
						))}
					</span>
				)}
			</Tooltip>
		</TooltipTrigger>
	);
}

interface CommandButtonProps extends ButtonProps {
	index?: number;
	Icon: FC<{ className: string }>;
	command: Command;
	tooltip: string;
	keys?: string[];
	alwaysVisible?: boolean;
	isVisible?: (view: EditorView) => boolean;
}

export function CommandButton({
	index,
	Icon,
	command,
	tooltip,
	keys,
	alwaysVisible,
	isVisible,
	...props
}: CommandButtonProps) {
	const [visible, setVisible] = useVisibility(index);
	const onPress = useEditorEventCallback((view) => {
		command(view.state, view.dispatch, view);

		view.focus();
	});

	useEditorEffect((view) => {
		if (setVisible)
			setVisible(
				alwaysVisible ||
					(isVisible ? isVisible(view) : command(view.state, undefined, view))
			);
	});

	return (
		<MenuBarTooltip tooltip={tooltip} keys={keys}>
			<Button
				className={`round-button${visible ? '' : ' hidden'}`}
				onPress={onPress}
				aria-label={tooltip}
				{...props}
			>
				<Icon className="text-iris-500 w-3/5 h-3/5 m-auto" />
			</Button>
		</MenuBarTooltip>
	);
}

interface ToggleMarkButton extends ButtonProps {
	index?: number;
	Icon: FC<{ className: string }>;
	markType: MarkType;
	command?: Command;
	tooltip: string;
	keys?: string[];
	isVisible?: (view: EditorView) => boolean;
}

export function ToggleMarkButton({
	index,
	Icon,
	markType,
	command,
	tooltip,
	keys,
	...props
}: ToggleMarkButton) {
	const [visible, setVisible] = useVisibility(index);
	const [active, setActive] = useState(false);
	const onChange = useEditorEventCallback((view, value) => {
		(command || toggleMark(markType))(view.state, view.dispatch, view);
		setActive(!value);

		view.focus();
	});

	useEditorEffect((view) => {
		if (setVisible) {
			setVisible(
				(command || toggleMark(markType))(view.state, undefined, view)
			);
		}

		setActive(markActive(view.state, markType));
	});

	return (
		<MenuBarTooltip tooltip={tooltip} keys={keys}>
			<ToggleButton
				className={`round-button${visible ? '' : ' hidden'}`}
				isSelected={active}
				onChange={onChange}
				aria-label={tooltip}
				{...props}
			>
				<Icon className="text-iris-500 w-3/5 h-3/5 m-auto" />
			</ToggleButton>
		</MenuBarTooltip>
	);
}

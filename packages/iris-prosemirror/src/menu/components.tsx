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
	type ButtonProps,
	type ToggleButtonProps,
	isMacLike
} from 'iris-components';
import type { EditorState, Command } from 'prosemirror-state';
import type { NodeType, MarkType } from 'prosemirror-model';
import type { EditorView } from 'prosemirror-view';
import { toggleMark } from 'prosemirror-commands';
import { markActive } from 'iris-prosemirror';

export function isNode(state: EditorState, nodeType: NodeType) {
	return state.selection.$from.parent.type === nodeType;
}

function displayKey(key: string) {
	if (key === 'Mod') {
		return isMacLike ? 'Cmd' : 'Ctrl';
	}

	if (key === 'Alt') {
		return isMacLike ? 'Option' : 'Alt';
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
	Icon: FC<{ className?: string }>;
	command: Command;
	tooltip: string;
	keys?: string[];
	alwaysEnabled?: boolean;
	isEnabled?: (view: EditorView) => boolean;
}

export function CommandButton({
	Icon,
	command,
	tooltip,
	keys,
	alwaysEnabled,
	isEnabled,
	...props
}: CommandButtonProps) {
	const [disabled, setDisabled] = useState(false);
	const onPress = useEditorEventCallback((view) => {
		command(view.state, view.dispatch, view);
		view.focus();
	});

	useEditorEffect((view) => {
		setDisabled(
			!(
				alwaysEnabled ||
				(isEnabled ? isEnabled(view) : command(view.state, undefined, view))
			)
		);
	});

	return (
		<MenuBarTooltip tooltip={tooltip} keys={keys}>
			<Button
				className="round-button"
				isDisabled={disabled}
				onPress={onPress}
				aria-label={tooltip}
				{...props}
			>
				<Icon />
			</Button>
		</MenuBarTooltip>
	);
}

interface ToggleMarkButtonProps extends ToggleButtonProps {
	Icon: FC<{ className?: string }>;
	markType: MarkType;
	command?: Command;
	tooltip: string;
	keys?: string[];
	isVisible?: (view: EditorView) => boolean;
}

export function ToggleMarkButton({
	Icon,
	markType,
	command,
	tooltip,
	keys,
	...props
}: ToggleMarkButtonProps) {
	const [disabled, setDisabled] = useState(false);
	const [active, setActive] = useState(false);
	const onChange = useEditorEventCallback((view, value) => {
		(command || toggleMark(markType))(view.state, view.dispatch, view);
		setActive(!value);

		view.focus();
	});

	useEditorEffect((view) => {
		setDisabled(
			!(command || toggleMark(markType))(view.state, undefined, view)
		);

		setActive(markActive(view.state, markType));
	});

	return (
		<MenuBarTooltip tooltip={tooltip} keys={keys}>
			<ToggleButton
				className="round-button"
				isSelected={active}
				isDisabled={disabled}
				onChange={onChange}
				aria-label={tooltip}
				{...props}
			>
				<Icon />
			</ToggleButton>
		</MenuBarTooltip>
	);
}

import { useState } from 'react';
import {
	useEditorEventCallback,
	useEditorEffect,
	useEditorState
} from '@handlewithcare/react-prosemirror';
import {
	ToggleButton,
	MenuTrigger,
	Popover,
	Menu,
	MenuItem
} from 'iris-components';
import type { NodeType, Attrs } from 'prosemirror-model';
import { setBlockType } from 'prosemirror-commands';
import { wrapInList, liftListItem } from 'prosemirror-schema-list';
import {
	isNode,
	ToggleMarkButton,
	CommandButton,
	MenuBarTooltip
} from './components';
import {
	asideComponent,
	linkComponent,
	mathComponent,
	clearFormatting,
	docSchema
} from 'iris-prosemirror';
import CodeLanguageDialog from './CodeLanguageDialog';

import Bold from '~icons/tabler/bold';
import Italic from '~icons/tabler/italic';
import Underline from '~icons/tabler/underline';
import Link from '~icons/tabler/link';
import Code from '~icons/tabler/code';
import ClearFormatting from '~icons/tabler/clear-formatting';
import TextStyle from '~icons/tabler/text-size';
import Math from '~icons/tabler/math';
import MathPreview from '~icons/tabler/math-function';
import OrderedList from '~icons/tabler/list-numbers';
import BulletList from '~icons/tabler/list';
import Outdent from '~icons/tabler/indent-decrease';
import Aside from '~icons/tabler/layout-sidebar-right-collapse-filled';

const {
	getMathPreviewEnabled,
	setMathPreviewEnabled,
	toggleInlineMath,
	insertDisplayMath
} = mathComponent.commands;

const { getAside, insertAside } = asideComponent.commands;

function TextStyleMenu() {
	const [disabled, setDisabled] = useState(false);
	const [normalVisible, setNormalVisible] = useState(false);
	const [headingsVisible, setHeadingsVisible] = useState(false);
	const [codeVisible, setCodeVisible] = useState(false);

	const [active, setActive] = useState(false);

	const [codeDialogOpen, setCodeDialogOpen] = useState(false);
	const [language, setLanguage] = useState('');

	const state = useEditorState();
	const setCode = useEditorEventCallback((view, language) => {
		const { $head } = view.state.selection;

		const tr = view.state.tr;

		if ($head.parent.type === docSchema.nodes.code_block) {
			view.dispatch(
				tr.setNodeAttribute($head.before($head.depth), 'language', language)
			);
		} else {
			view.dispatch(
				tr.setBlockType(
					$head.pos,
					undefined,
					docSchema.nodes.code_block,
					() => ({ language })
				)
			);
		}

		view.focus();
	});

	const setBlock = useEditorEventCallback(
		(view, type: NodeType, attrs?: Attrs) => {
			setBlockType(type, attrs || {})(view.state, view.dispatch, view);
			view.focus();
		}
	);

	useEditorEffect(
		(view) => {
			const normal = setBlockType(docSchema.nodes.paragraph)(
				view.state,
				undefined,
				view
			);
			const headings =
				setBlockType(docSchema.nodes.heading, { level: 0 })(
					view.state,
					undefined,
					view
				) && !getAside(view.state);
			const codeBlock = setBlockType(docSchema.nodes.code_block, {
				language: '???'
			})(view.state, undefined, view);

			setDisabled(!(normal || headings || codeBlock));
			setNormalVisible(normal);
			setHeadingsVisible(headings);
			setCodeVisible(codeBlock);

			setActive(
				isNode(view.state, docSchema.nodes.heading) ||
					isNode(view.state, docSchema.nodes.code_block)
			);
		},
		[state]
	);

	return (
		<>
			<CodeLanguageDialog
				isOpen={codeDialogOpen}
				setIsOpen={setCodeDialogOpen}
				language={language}
				setLanguage={setLanguage}
				onPress={() => setCode(language)}
			/>

			<MenuTrigger>
				<MenuBarTooltip tooltip="Text Style">
					<ToggleButton
						className="round-button"
						aria-label="Text Style"
						isSelected={active}
						isDisabled={disabled}
					>
						<TextStyle />
					</ToggleButton>
				</MenuBarTooltip>
				<Popover>
					<Menu>
						{normalVisible && (
							<MenuItem onAction={() => setBlock(docSchema.nodes.paragraph)}>
								Normal text
							</MenuItem>
						)}
						{headingsVisible && (
							<>
								<MenuItem
									onAction={() =>
										setBlock(docSchema.nodes.heading, { level: 2 })
									}
								>
									Heading 2
								</MenuItem>
								<MenuItem
									onAction={() =>
										setBlock(docSchema.nodes.heading, { level: 3 })
									}
								>
									Heading 3
								</MenuItem>
								<MenuItem
									onAction={() =>
										setBlock(docSchema.nodes.heading, { level: 4 })
									}
								>
									Heading 4
								</MenuItem>
							</>
						)}
						{codeVisible && (
							<MenuItem
								onAction={() => {
									setCodeDialogOpen(true);
								}}
							>
								Code Block
							</MenuItem>
						)}
					</Menu>
				</Popover>
			</MenuTrigger>
		</>
	);
}

function MathPreviewToggle() {
	const [active, setActive] = useState(false);

	const state = useEditorState();
	const onChange = useEditorEventCallback((view, value: boolean) => {
		setMathPreviewEnabled(value)(view.state, view.dispatch);
		setActive(value);

		view.focus();
	});

	useEditorEffect(
		(view) => {
			setActive(getMathPreviewEnabled(view.state));
		},
		[state]
	);

	return (
		<MenuBarTooltip tooltip="Math Preview">
			<ToggleButton
				className="round-button"
				isSelected={active}
				onChange={onChange}
				aria-label="Math Preview"
			>
				<MathPreview />
			</ToggleButton>
		</MenuBarTooltip>
	);
}

function HomeMenu() {
	return (
		<>
			<div className="flex flex-row gap-2">
				<ToggleMarkButton
					Icon={Bold}
					markType={docSchema.marks.bold}
					tooltip="Bold"
					keys={['Mod', 'B']}
				/>
				<ToggleMarkButton
					Icon={Italic}
					markType={docSchema.marks.italic}
					tooltip="Italic"
					keys={['Mod', 'I']}
				/>
				<ToggleMarkButton
					Icon={Underline}
					markType={docSchema.marks.underline}
					tooltip="Underline"
					keys={['Mod', 'U']}
				/>
				<ToggleMarkButton
					Icon={Link}
					markType={docSchema.marks.link}
					command={linkComponent.commands.toggleLink}
					tooltip="Link"
					keys={['Mod', 'K']}
				/>
				<ToggleMarkButton
					Icon={Code}
					markType={docSchema.marks.code}
					tooltip="Inline Code"
					keys={['Mod', '`']}
				/>

				<TextStyleMenu />

				<CommandButton
					Icon={ClearFormatting}
					command={clearFormatting}
					tooltip="Clear Formatting"
				/>
			</div>

			<div className="flex flex-row gap-2">
				<ToggleMarkButton
					Icon={() => (
						<>
							<Math className="inline w-4 h-4" />
							<sup className="font-bold" aria-hidden>
								i
							</sup>
						</>
					)}
					command={toggleInlineMath}
					markType={docSchema.marks.math_inline}
					tooltip="Inline Math"
					keys={['Alt', 'm']}
				/>

				<CommandButton
					Icon={() => (
						<>
							<Math className="inline w-4 h-4" />
							<sup className="font-bold" aria-hidden>
								d
							</sup>
						</>
					)}
					command={insertDisplayMath}
					tooltip="Display Math"
					keys={['Shift', 'Alt', 'm']}
				/>

				<MathPreviewToggle />
			</div>

			<div className="flex flex-row gap-2">
				<CommandButton
					Icon={OrderedList}
					command={wrapInList(docSchema.nodes.ordered_list)}
					tooltip="Number List"
				/>
				<CommandButton
					Icon={BulletList}
					command={wrapInList(docSchema.nodes.bullet_list)}
					tooltip="Bullet List"
				/>
				<CommandButton
					Icon={Outdent}
					command={liftListItem(docSchema.nodes.list_item)}
					tooltip="List Outdent"
				/>
			</div>

			<div className="flex flex-row gap-2">
				<CommandButton Icon={Aside} command={insertAside} tooltip="Aside" />
			</div>
		</>
	);
}

export default HomeMenu;

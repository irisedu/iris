import { useState, useEffect, useRef, useCallback } from 'react';
import {
	Button,
	MenuTrigger,
	Popover,
	Menu,
	MenuItem,
	Separator,
	TextField,
	Input
} from 'react-aria-components';
import { Tree, type TreeApi, type NodeRendererProps } from 'react-arborist';
import useResizeObserver from 'use-resize-observer';
import { Submenu } from 'iris/aria-components';

import { useSelector } from 'react-redux';
import { useAppDispatch, type RootState, type AppDispatch } from '$state/store';
import { setOpenDirectory } from '$state/appSlice';
import {
	openTab,
	changeTab,
	setTabs,
	setTabState,
	type TabData
} from '$state/tabsSlice';

import {
	ROOT_ID,
	DirectoryTree,
	filterFileOp,
	type TreeNode,
	type RenameMap
} from './DirectoryTree';
import DeleteDialog from '$components/DeleteDialog';
import OverwriteDialog from '$components/OverwriteDialog';
import { FILE_PREFIX, pathIcon, makeTabData } from '$components/tabs/FileTab';
import '$components/Sidebar.css';

import Folder from '~icons/tabler/folder-filled';
import ChevronDown from '~icons/tabler/chevron-down';
import ChevronRight from '~icons/tabler/chevron-right';

async function openProject(dispatch: AppDispatch) {
	const selected = await win.openDialog({
		title: 'Open Project',
		properties: ['openDirectory', 'createDirectory'],
		defaultPath: os.homedir
	});

	if (selected) {
		dispatch(setOpenDirectory(selected[0]));
	}
}

function updateTabs(
	renameMap: RenameMap,
	openDirectory: string,
	dispatch: AppDispatch,
	tabs: TabData[],
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	tabState: Record<string, any>,
	currentTab?: string
) {
	const newTabs = [];

	for (const tab of tabs) {
		if (!tab.id.startsWith(FILE_PREFIX)) {
			newTabs.push(tab);
			continue;
		}

		// (1) This tab has been renamed
		// Preserve its state and change its path
		const dest = renameMap[tab.path];
		if (dest) {
			let generation = 0;

			// If destination tab already exists, it will be deleted and
			// replaced with this one. The generation must be incremented for
			// the tab to be updated.
			const destTab = tabs.find((t) => t.id === FILE_PREFIX + dest);
			if (destTab && destTab.generation) generation = destTab.generation + 1;

			newTabs.push(makeTabData(openDirectory, dest, generation));

			dispatch(
				setTabState({
					id: FILE_PREFIX + dest,
					state: tabState[tab.id],
					overwrite: true,
					generation
				})
			);

			continue;
		}

		// (2) The file of this tab has been overwritten
		// Update the tab ONLY IF its origin tab does not exist
		// Otherwise, close the tab
		const entry = Object.entries(renameMap).find(
			([, target]) => target === tab.path
		);
		if (entry) {
			if (tabs.some((t) => t.id === FILE_PREFIX + entry[0])) continue;

			let generation = 0;
			if (tab.generation) generation = tab.generation + 1;

			newTabs.push({ ...tab, generation });

			dispatch(
				setTabState({
					id: tab.id,
					state: null,
					generation
				})
			);

			continue;
		}

		newTabs.push(tab);
	}

	dispatch(setTabs(newTabs));

	if (!currentTab || !currentTab.startsWith(FILE_PREFIX)) return;

	const currentTabFile = currentTab.slice(FILE_PREFIX.length);
	if (renameMap[currentTabFile])
		setTimeout(() =>
			dispatch(changeTab(FILE_PREFIX + renameMap[currentTabFile]))
		);
}

function treeCreate(tree: TreeApi<TreeNode>, type: 'internal' | 'leaf') {
	let parentId = null;

	if (tree.selectedNodes.length) {
		const parent = tree.selectedNodes[0];
		if (parent.isLeaf) {
			parentId = parent.parent?.id === ROOT_ID ? null : parent.parent?.id;
			parent.parent?.open(); // TODO this should not be necessary
		} else {
			parentId = parent.id;
			parent.open(); // TODO
		}
	}

	setTimeout(() => tree.create({ type, parentId })); // TODO
}

function Node({ node, style, dragHandle }: NodeRendererProps<TreeNode>) {
	const dispatch = useAppDispatch();
	const openDirectory = useSelector(
		(state: RootState) => state.app.openDirectory
	);

	const [renameText, setRenameText] = useState('');
	const renameRef = useRef<HTMLInputElement>(null);
	const clickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	return (
		<div style={style} className="cursor-pointer select-none">
			<div
				className={`px-2 border-2 rounded-md flex flex-row gap-2 items-center${node.isSelected ? ' bg-iris-200' : ''}${node.isFocused ? ' border-iris-400' : ' border-transparent'}`}
				ref={dragHandle}
				onClick={(e) => {
					if (e.ctrlKey) {
						if (node.isSelected) node.deselect();
						else node.selectMulti();

						e.stopPropagation();
						return;
					}

					if (e.shiftKey) return;

					if (node.isLeaf && e.detail === 2) {
						if (openDirectory)
							dispatch(openTab(makeTabData(openDirectory, node.id)));
						return;
					}

					if (!node.isSelected) {
						node.select();
						return;
					}

					node.toggle();
				}}
				onContextMenu={() => node.select()}
			>
				{node.data.isFolder ? (
					<Folder className="text-iris-500 w-5 h-5" />
				) : (
					pathIcon(node.id)
				)}

				{node.isEditing ? (
					<div
						onClick={(e) => e.stopPropagation()}
						className="grow max-w-[60%]"
					>
						<TextField
							className="react-aria-TextField my-0"
							aria-label="Rename"
							onFocusChange={(focused) => {
								if (focused) {
									node.select();
									setRenameText(node.data.name);
									setTimeout(() => renameRef.current?.select());
								} else {
									node.reset();
								}
							}}
							onKeyDown={(e) =>
								e.key === 'Enter' &&
								renameText.length &&
								node.submit(renameText)
							}
							onKeyUp={(e) => e.key === 'Escape' && node.reset()}
							value={renameText}
							onChange={(text) =>
								setRenameText(text.replace(/[^A-Za-z0-9-./]/g, ''))
							}
							autoFocus
						>
							<Input
								className="react-aria-Input outline-none border-none"
								ref={renameRef}
							/>
						</TextField>
					</div>
				) : (
					<span
						className="overflow-x-hidden whitespace-nowrap text-ellipsis"
						onClick={(e) => {
							if (e.ctrlKey || e.shiftKey) return;

							if (e.detail > 1) {
								if (clickTimeout.current) {
									clearTimeout(clickTimeout.current);
									clickTimeout.current = null;
								}
								return;
							}

							if (node.isSelected) {
								e.stopPropagation();
								clickTimeout.current = setTimeout(() => {
									node.edit();
									clickTimeout.current = null;
								}, 300);
							}
						}}
					>
						{node.data.name}
					</span>
				)}

				{node.data.children && node.data.children.length > 0 && (
					<>
						<div className="grow" />
						{node.isOpen ? (
							<ChevronDown className="text-iris-500 w-5 h-5" />
						) : (
							<ChevronRight className="text-iris-500 w-5 h-5" />
						)}
					</>
				)}
			</div>
		</div>
	);
}

function Sidebar() {
	const dispatch = useAppDispatch();
	const openDirectory = useSelector(
		(state: RootState) => state.app.openDirectory
	);
	const tabs = useSelector((state: RootState) => state.tabs.tabs);
	const currentTab = useSelector((state: RootState) => state.tabs.currentTab);
	const tabState = useSelector((state: RootState) => state.tabs.tabState);

	const tree = useRef<TreeApi<TreeNode>>(null);
	const {
		ref: resizeRef,
		width: treeWidth,
		height: treeHeight
	} = useResizeObserver();

	const [treeData, setTreeData] = useState(new DirectoryTree(tree));
	const reloadDir = useCallback(() => {
		if (!openDirectory) return;

		new DirectoryTree(tree).readFromDir(openDirectory).then(setTreeData);
	}, [openDirectory]);

	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deletePaths, setDeletePaths] = useState<string[]>([]);
	const deleteCb = useRef<(() => void) | null>(null);
	function promptDelete() {
		if (!tree.current) return;

		const nodes = filterFileOp(tree.current.selectedNodes);
		setDeletePaths(nodes.map((n) => n.data.name));
		deleteCb.current = () => {
			setTreeData(treeData.onDelete(nodes));

			Promise.all(
				nodes.map((n) => {
					return fs.rm(n.id);
				})
			);

			dispatch(
				setTabs(
					tabs.filter((t) => !nodes.some((n) => t.id === FILE_PREFIX + n.id))
				)
			);
		};

		setDeleteOpen(true);
	}

	const [overwriteOpen, setOverwriteOpen] = useState(false);
	const [overwritePaths, setOverwritePaths] = useState<string[]>([]);
	const overwriteCb = useRef<(() => void) | null>(null);

	const [contextOpen, setContextOpen] = useState(false);
	const contextTarget = useRef<HTMLDivElement>(null);

	const createExtension = useRef('');

	useEffect(() => {
		if (!openDirectory) return;

		reloadDir();
	}, [reloadDir, openDirectory]);

	return (
		<div className="font-sans w-full h-full p-2">
			<DeleteDialog
				isOpen={deleteOpen}
				setIsOpen={setDeleteOpen}
				targetFiles={deletePaths}
				callbackRef={deleteCb}
			/>

			<OverwriteDialog
				isOpen={overwriteOpen}
				setIsOpen={setOverwriteOpen}
				targetFiles={overwritePaths}
				callbackRef={overwriteCb}
			/>

			<div ref={contextTarget} className="fixed" />

			<MenuTrigger isOpen={contextOpen} onOpenChange={setContextOpen}>
				<Popover placement="bottom left" triggerRef={contextTarget}>
					<Menu aria-label="File tree menu">
						<Submenu label="Create new">
							<MenuItem
								onAction={() => {
									if (!tree.current) return;
									createExtension.current = '.iris';
									treeCreate(tree.current, 'leaf');
								}}
							>
								Iris document
							</MenuItem>
							<MenuItem
								onAction={() => {
									if (!tree.current) return;
									createExtension.current = '';
									treeCreate(tree.current, 'internal');
								}}
							>
								Folder
							</MenuItem>
							<MenuItem
								onAction={() => {
									if (!tree.current) return;
									createExtension.current = '';
									treeCreate(tree.current, 'leaf');
								}}
							>
								Empty file
							</MenuItem>
						</Submenu>

						{tree.current && tree.current.selectedNodes.length > 0 && (
							<>
								<MenuItem onAction={promptDelete}>Delete selected</MenuItem>

								<MenuItem
									onAction={() => {
										if (!tree.current) return;
										shell.showItemInFolder(tree.current.selectedNodes[0].id);
									}}
								>
									Show in file explorer
								</MenuItem>
							</>
						)}

						<MenuItem
							onAction={() => {
								const target =
									tree.current && tree.current.selectedNodes.length > 0
										? tree.current.selectedNodes[0].id
										: openDirectory;

								if (target) shell.openPath(target);
							}}
						>
							Open in external app
						</MenuItem>

						<MenuItem onAction={() => openDirectory && reloadDir()}>
							Refresh
						</MenuItem>
					</Menu>
				</Popover>
			</MenuTrigger>

			<MenuTrigger>
				<Button className="sidebar__button flex flex-row items-center gap-2">
					<Folder className="text-iris-500 w-5 h-5" />
					<span className="whitespace-nowrap overflow-hidden text-ellipsis">
						{openDirectory
							? openDirectory.split(os.sep).at(-1)
							: '<no open project>'}
					</span>
					<div className="grow" />
					<ChevronDown className="text-iris-500 w-5 h-5" />
				</Button>

				<Popover>
					<Menu>
						<MenuItem onAction={() => openDirectory && reloadDir()}>
							Refresh
						</MenuItem>
						<MenuItem onAction={() => openProject(dispatch)}>
							Open project
						</MenuItem>
					</Menu>
				</Popover>
			</MenuTrigger>

			<Separator className="react-aria-Separator my-2" />

			<div
				className="w-full h-full"
				ref={resizeRef}
				onKeyDown={(e) => {
					if (e.key === 'Delete' && tree.current?.selectedNodes.length) {
						promptDelete();
					} else if (e.key === 'Escape') {
						if (contextOpen) setContextOpen(false);
					}
				}}
				onContextMenu={(e) => {
					if (!openDirectory) return;

					const proxy = contextTarget.current;
					if (!proxy) return;

					proxy.style.left = `${e.pageX}px`;
					proxy.style.top = `${e.pageY}px`;

					setContextOpen(true);
					e.preventDefault();
					e.stopPropagation();
				}}
			>
				<Tree
					data={treeData.data}
					disableEdit={false}
					disableDrop={(args) => treeData.disableDrop(args)}
					onCreate={async (args) => {
						if (!openDirectory) return null;

						const { newTree, newNode } = await treeData.onCreate(
							args,
							openDirectory,
							createExtension.current
						);
						setTreeData(newTree);

						if (newNode.isFolder) {
							await fs.mkdir(newNode.id);
						} else {
							await fs.writeTextFile({ file: newNode.id, data: '' });
						}

						return newNode;
					}}
					onRename={async (args) => {
						const res = await treeData.onRename(args);
						if (!res) return;

						const {
							newTree,
							oldId,
							newId,
							immediateParentId,
							renameMap,
							fileExists
						} = res;

						const doRename = async () => {
							if (!openDirectory) return;

							setTreeData(newTree);
							setTimeout(() => tree.current?.select(newId), 20);

							await fs.mkdir(immediateParentId);
							await fs.rename({ from: oldId, to: newId });

							updateTabs(
								renameMap,
								openDirectory,
								dispatch,
								tabs,
								tabState,
								currentTab
							);
						};

						if (fileExists) {
							overwriteCb.current = doRename;
							setOverwritePaths([newId]);
							setOverwriteOpen(true);
						} else {
							await doRename();
						}
					}}
					onMove={async (args) => {
						if (!openDirectory) return;
						const res = await treeData.onMove(args, openDirectory);

						if (!res) return;

						const { newTree, nodeInfo, renameMap } = res;

						const doMove = async () => {
							setTreeData(newTree);

							await Promise.all(
								nodeInfo.map((info) => {
									return fs.rename({ from: info.id, to: info.newId });
								})
							);

							updateTabs(
								renameMap,
								openDirectory,
								dispatch,
								tabs,
								tabState,
								currentTab
							);
						};

						const overwritePaths = nodeInfo
							.filter((i) => i.exists)
							.map((i) => i.newId);

						if (overwritePaths.length) {
							overwriteCb.current = doMove;
							setOverwritePaths(overwritePaths);
							setOverwriteOpen(true);
						} else {
							await doMove();
						}
					}}
					width={treeWidth}
					height={treeHeight}
					rowHeight={44}
					openByDefault={false}
					ref={tree}
				>
					{Node}
				</Tree>
			</div>
		</div>
	);
}

export default Sidebar;

import type { MutableRefObject } from 'react';
import type { TreeApi, NodeApi } from 'react-arborist';
import type { DirTreeNode } from '../../main/ipc';

/* UTILITY */

export interface TreeNode {
	id: string;
	name: string;
	isFolder: boolean;
	children?: TreeNode[];
}

export type TreeData = TreeNode[];

export type TreeRef = MutableRefObject<TreeApi<TreeNode> | null>;
export type RenameMap = Record<string, string>;

export const ROOT_ID = '__REACT_ARBORIST_INTERNAL_ROOT__';

function sortTree(data: TreeData) {
	data.sort((a, b) => {
		if (a.isFolder && !b.isFolder) return -1;
		if (b.isFolder && !a.isFolder) return 1;

		return a.name.localeCompare(b.name);
	});

	data.forEach((node) => node.children && sortTree(node.children));
}

function modifyTree(data: TreeData, cb: (node: TreeNode) => void) {
	return data.map((node) => {
		const newNode = { ...node };
		if (node.children) newNode.children = modifyTree(node.children, cb);
		cb(newNode);

		return newNode;
	});
}

function filterTree(data: TreeData, predicate: (node: TreeNode) => boolean) {
	return modifyTree(data, (node) => {
		if (node.children) node.children = node.children.filter(predicate);
	}).filter(predicate);
}

function nodeAncestors(node: NodeApi<TreeNode>) {
	const ancestors = [];

	while (node.parent) {
		ancestors.push(node.parent.id);
		node = node.parent;
	}

	return ancestors;
}

export function filterFileOp(nodes: NodeApi<TreeNode>[]) {
	return nodes.filter((n) => {
		const ancestors = nodeAncestors(n);
		return !nodes.some((p) => ancestors.includes(p.id));
	});
}

function renameDescendants(
	children: TreeData,
	from: string,
	to: string,
	renameMap: RenameMap
): TreeData {
	return children.map((c) => {
		const newId = to + c.id.slice(from.length);
		renameMap[c.id] = newId;
		return {
			id: newId,
			name: c.name,
			isFolder: c.isFolder,
			children: c.children && renameDescendants(c.children, from, to, renameMap)
		};
	});
}

/* CLASS */

// All operations return a new tree
export class DirectoryTree {
	#treeRef: TreeRef;
	#data: TreeData;

	/* INIT */

	// data must be mutable
	constructor(treeRef: TreeRef, data?: TreeData) {
		this.#treeRef = treeRef;

		if (data) {
			sortTree(data);
			this.#data = data;
		} else {
			this.#data = [];
		}
	}

	async readFromDir(dir: string) {
		const entries = await fs.readDir(dir);

		function dirToTree(entries: DirTreeNode[]) {
			const out = [];

			for (const entry of entries) {
				const isFolder = entry.children !== undefined;
				const node: TreeNode = {
					id: entry.path,
					name: entry.name,
					isFolder
				};

				if (entry.children) {
					node.children = dirToTree(entry.children);
				}

				out.push(node);
			}

			return out;
		}

		return this.#copy(dirToTree(entries));
	}

	#copy(newData: TreeData) {
		return new DirectoryTree(this.#treeRef, newData);
	}

	/* GET */

	get #tree() {
		return this.#treeRef.current;
	}

	get data() {
		return this.#data;
	}

	/* EVENTS */

	async onCreate(
		{ parentId, type }: { parentId: string | null; type: 'internal' | 'leaf' },
		openDirectory: string,
		extension?: string
	) {
		const isFolder = type === 'internal';
		const baseFileName = isFolder ? 'new-folder' : 'new-file';
		const baseDirectory = parentId || openDirectory;

		// Determine file name
		let fileName = baseFileName + extension;
		let fileNum = 1;
		while (await fs.exists(baseDirectory + os.sep + fileName)) {
			fileName = `${baseFileName}-${fileNum}${extension}`;
			fileNum++;
		}

		// Create node
		const newNode: TreeNode = {
			id: baseDirectory + os.sep + fileName,
			name: fileName,
			isFolder
		};

		if (isFolder) newNode.children = [];

		// Modify tree
		let newTree;

		if (parentId === null) {
			newTree = this.#data.concat([newNode]);
		} else {
			newTree = modifyTree(this.#data, (node) => {
				if (node.id !== parentId) return;
				node.children?.push(newNode);
			});
		}

		return { newTree: this.#copy(newTree), newNode };
	}

	onDelete(nodes: NodeApi<TreeNode>[]) {
		const newTree = filterTree(
			this.#data,
			(n1) => !nodes.some((n2) => n1.id === n2.id)
		);

		if (nodes[0].prev) nodes[0].prev.select();

		return this.#copy(newTree);
	}

	async onRename({ id, name }: { id: string; name: string }) {
		const origNode = this.#tree?.get(id);
		if (!origNode) return;

		const origName = origNode.data.name;
		if (origName === name) return;

		const origParentId = id.slice(0, -origName.length - 1);

		let newSubtree: TreeNode | undefined;
		let prevId = origParentId;
		let prevNode;
		let newId;
		let insertParentId = origParentId; // parent to insert the newSubtree
		let immediateParentId = origParentId; // immediate parent for use with recursive mkdir
		const renameMap: RenameMap = {};

		// Allow renaming with slashes for subdirectories
		const split = name.split(os.sep);
		for (let i = 0; i < split.length; i++) {
			const part = split[i];
			const partId = prevId + os.sep + part;
			prevId = partId;

			const isFolder = i !== split.length - 1 || origNode.data.isFolder;

			if (i === split.length - 2) immediateParentId = partId;
			if (i === split.length - 1) {
				newId = partId;
				renameMap[id] = newId;
			}

			// Part of the subtree might already exist
			if (await fs.exists(partId)) {
				if (isFolder) insertParentId = partId;
				return;
			}

			const newNode: TreeNode = {
				id: partId,
				name: part,
				isFolder,
				children: isFolder ? [] : undefined
			};

			// Update descendants
			if (i === split.length - 1 && origNode.data.children) {
				newNode.children = renameDescendants(
					origNode.data.children,
					id,
					newId!, // Set above
					renameMap
				);
			}

			if (!newSubtree) newSubtree = newNode;
			if (prevNode) prevNode.children!.push(newNode);
			prevNode = newNode;
		}

		const fileExists = await fs.exists(newId!);

		// Remove the original node from the tree
		let newTree = filterTree(this.#data, (c) => c.id !== id);

		if (!fileExists) {
			// Insert the new node
			if (origNode.level === 0 && insertParentId === origParentId) {
				newTree.push(newSubtree!);
			} else {
				newTree = modifyTree(newTree, (node) => {
					if (node.id === insertParentId) node.children?.push(newSubtree!);
				});
			}
		}

		return {
			newTree: this.#copy(newTree),
			oldId: id,
			newId: newId!,
			immediateParentId,
			renameMap,
			fileExists
		};
	}

	disableDrop({
		parentNode,
		dragNodes
	}: {
		parentNode: NodeApi<TreeNode>;
		dragNodes: NodeApi<TreeNode>[];
	}) {
		if (dragNodes.every((n) => n.parent?.id === parentNode.id)) return true;
		return false;
	}

	async onMove(
		{ dragIds, parentId }: { dragIds: string[]; parentId: string | null },
		openDirectory: string
	) {
		if (!this.#tree) return;

		const nodes = filterFileOp(
			dragIds.map((id) => this.#tree!.get(id)!)
		).filter(
			(n) =>
				n.parent?.id !== parentId &&
				!(parentId === null && n.parent?.id === ROOT_ID)
		);

		const renameMap: RenameMap = {};
		const nodeInfo = await Promise.all(
			nodes.map((node) => {
				const id = node.id;
				const newId = (parentId || openDirectory) + os.sep + node.data.name;
				renameMap[id] = newId;

				const newData = { ...node.data, id: newId };
				if (node.data.children)
					newData.children = renameDescendants(
						node.data.children,
						id,
						newId,
						renameMap
					);

				return fs.exists(newId).then((res) => ({
					id,
					newId,
					data: newData,
					exists: res
				}));
			})
		);

		// Remove old
		let newTree = filterTree(
			this.#data,
			(node) => !nodeInfo.some((i) => i.id === node.id)
		);

		// Insert new
		const newChildren = nodeInfo.filter((n) => !n.exists).map((n) => n.data);

		if (parentId === null) {
			newTree = newTree.concat(newChildren);
		} else {
			newTree = modifyTree(newTree, (node) => {
				if (node.id !== parentId) return;
				node.children = node.children?.concat(newChildren);
			});
		}

		return { newTree: this.#copy(newTree), nodeInfo, renameMap };
	}
}

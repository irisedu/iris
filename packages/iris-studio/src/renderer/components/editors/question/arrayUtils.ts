/*
 * Simple immutable list utilities
 * useListData is not very good
 */

import { type DroppableCollectionReorderEvent } from 'iris-components';

type HasId = { id: string };

export function arrayMoveBy<T extends HasId>(
	a: T[],
	id: string,
	ofs: number
): T[] {
	const item = a.find((n) => n.id === id);
	if (!item) return a;

	const i = a.indexOf(item);

	const newVal = a.filter((n) => n.id !== id);
	newVal.splice(i + ofs, 0, item);
	return newVal;
}

export function arrayRemove<T extends HasId>(a: T[], id: string): T[] {
	return a.filter((n) => n.id !== id);
}

export function arrayUpdate<T extends HasId>(
	a: T[],
	id: string,
	newVal: T
): T[] {
	return a.map((n) => (n.id === id ? newVal : n));
}

function arrayReorderInternal<T extends HasId>(
	a: T[],
	ids: Set<string>,
	target: string,
	position: 'before' | 'after' | 'on'
): T[] {
	const filtered = a.filter((n) => !ids.has(n.id));
	const toMove = a.filter((n) => ids.has(n.id));
	const idx = filtered.findIndex((o) => o.id === target);

	if (position === 'before') {
		filtered.splice(idx, 0, ...toMove);
	} else if (position === 'after') {
		filtered.splice(idx + 1, 0, ...toMove);
	}

	return filtered;
}

export function arrayReorder<T extends HasId>(
	a: T[],
	e: DroppableCollectionReorderEvent
): T[] {
	return arrayReorderInternal(
		a,
		e.keys as Set<string>,
		e.target.key as string,
		e.target.dropPosition
	);
}

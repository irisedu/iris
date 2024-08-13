import { useRef, useEffect } from 'react';

import { useSelector } from 'react-redux';
import { useAppDispatch, type RootState } from '$state/store';
import { setTabState } from '$state/tabsSlice';

import type { TabData } from '$state/tabsSlice';

interface FileEditorArgs {
	tabData: TabData;
	getAutosave: () => object | null;
	restoreAutosave: (autosave: object) => void;
	getFile: () => string | null;
	restoreFile: (contents: string) => void;
	doInit?: () => void;
}

export function useFileEditor({
	tabData,
	getAutosave,
	restoreAutosave,
	getFile,
	restoreFile,
	doInit
}: FileEditorArgs) {
	const dispatch = useAppDispatch();
	const state = useSelector(
		(store: RootState) => store.tabs.tabState[tabData.id]
	);

	// Autosave - must not have any dependencies as initialization (below) depends on this
	const autosaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
	function autosave() {
		const state = getAutosave();
		if (!state) return;

		if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);

		dispatch(
			setTabState({
				id: tabData.id,
				state: {
					prevState: state
				},
				generation: tabData.generation
			})
		);
	}

	// Initialization only
	useEffect(() => {
		const currState = state || {};

		if (currState.prevState) {
			restoreAutosave(currState.prevState);
		} else {
			fs.readTextFile(tabData.path).then((contents) => {
				try {
					restoreFile(contents);
					autosave();
				} catch {
					// Nothing
				}
			});
		}

		if (doInit) doInit();

		return autosave;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (!e.ctrlKey || e.repeat) return;

			if (e.key === 's') {
				const contents = getFile();
				if (!contents) return;

				fs.writeTextFile({
					file: tabData.path,
					data: contents
				});

				dispatch(
					setTabState({
						id: tabData.id,
						state: { modified: false },
						generation: tabData.generation
					})
				);

				autosave();
			}
		}

		document.addEventListener('keydown', onKeyDown);

		return () => document.removeEventListener('keydown', onKeyDown);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatch, tabData.id, tabData.path, tabData.generation, getFile]);

	function onEditorChange() {
		const currState = state || {};

		if (!currState.modified) {
			dispatch(
				setTabState({
					id: tabData.id,
					state: { modified: true },
					generation: tabData.generation
				})
			);
		}

		if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);

		autosaveTimeout.current = setTimeout(() => {
			autosave();
		}, 5000);
	}

	return { state, onEditorChange, autosave };
}

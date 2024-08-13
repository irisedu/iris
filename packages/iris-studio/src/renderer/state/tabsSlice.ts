import type { Middleware } from 'redux';
import { createSlice } from '@reduxjs/toolkit';
import type { ReactNode } from 'react';

import { RootState } from './store';
import {
	data as welcomeTabData,
	tab as welcomeTab
} from '$components/tabs/WelcomeTab';
import { tab as diagnosticsTab } from '$components/tabs/DiagnosticsTab';
import { makeTab as makeFileTab } from '$components/tabs/FileTab';

export interface TabData {
	type: string;
	id: string;
	generation?: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
}

export interface TabRender {
	id: string;
	title: string;
	generation?: number;
	icon: ReactNode;
	view: ReactNode;
}

export interface TabsState {
	tabs: TabData[];
	currentTab?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	tabState: Record<string, any>;
}

function getTabByOffset(state: TabsState, offset: number) {
	const idx = state.tabs.findIndex((t) => t.id === state.currentTab);
	const newIdx =
		(((idx + offset) % state.tabs.length) + state.tabs.length) %
		state.tabs.length;
	return state.tabs[newIdx].id;
}

export const tabsSlice = createSlice({
	name: 'tabs',
	initialState: {
		tabs: [welcomeTabData],
		tabState: {}
	} as TabsState,
	reducers: {
		openTab(state, action) {
			const tabData = action.payload;
			if (!state.tabs.some((t) => t.id === tabData.id))
				state.tabs.push(tabData);
		},
		closeTab(state, action) {
			const tabId = action.payload;

			if (tabId === state.currentTab) {
				state.currentTab = getTabByOffset(state, -1);
			}

			state.tabs = state.tabs.filter((t) => t.id !== tabId);
		},
		advanceTab(state, action) {
			const offset = action.payload;
			if (!state.tabs.length) return;

			state.currentTab = getTabByOffset(state, offset);
		},
		changeTab(state, action) {
			state.currentTab = action.payload;
		},
		setTabs(state, action) {
			state.tabs = action.payload;
		},
		setTabState(state, action) {
			const existingState = state.tabState[action.payload.id];
			if (
				existingState &&
				action.payload.generation < existingState.__generation
			)
				return;

			if (action.payload.state) {
				if (action.payload.overwrite) {
					state.tabState[action.payload.id] = {
						...action.payload.state,
						__generation: action.payload.generation || 0
					};
				} else {
					state.tabState[action.payload.id] = {
						...state.tabState[action.payload.id],
						...action.payload.state,
						__generation: action.payload.generation
					};
				}
			} else {
				// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
				delete state.tabState[action.payload.id];
			}
		},
		cleanTabState(state) {
			for (const [id] of Object.entries(state.tabState)) {
				// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
				if (!state.tabs.some((t) => t.id === id)) delete state.tabState[id];
			}
		}
	}
});

export const {
	openTab,
	closeTab,
	advanceTab,
	changeTab,
	setTabs,
	setTabState,
	cleanTabState
} = tabsSlice.actions;

export default tabsSlice.reducer;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const tabMiddleware: Middleware<{}, RootState> =
	({ dispatch }) =>
	(next) =>
	(action) => {
		if (openTab.match(action)) {
			setTimeout(() => dispatch(changeTab(action.payload.id)));
		} else if (closeTab.match(action) || setTabs.match(action)) {
			// Must wait for unmount
			setTimeout(() => dispatch(cleanTabState()));
		}

		return next(action);
	};

export function makeTab(data: TabData): TabRender | undefined {
	if (data.type === 'normal') {
		switch (data.id) {
			case welcomeTab.id:
				return welcomeTab;
			case diagnosticsTab.id:
				return diagnosticsTab;
		}
	} else if (data.type === 'file') {
		return makeFileTab(data);
	}
}

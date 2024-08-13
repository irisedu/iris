import type { RootState } from './store';
import type { Middleware } from 'redux';
import { createSlice } from '@reduxjs/toolkit';
import { setTabs } from './tabsSlice';

interface AppState {
	darkTheme: boolean;
	openDirectory?: string;
	sidebarOpen: boolean;
}

export const appSlice = createSlice({
	name: 'app',
	initialState: {
		darkTheme: false,
		sidebarOpen: true
	} as AppState,
	reducers: {
		setDarkTheme(state, action) {
			state.darkTheme = action.payload;
		},
		setOpenDirectory(state, action) {
			state.openDirectory = action.payload;
		},
		setSidebarOpen(state, action) {
			state.sidebarOpen = action.payload;
		}
	}
});

export const { setDarkTheme, setOpenDirectory, setSidebarOpen } =
	appSlice.actions;

export default appSlice.reducer;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const openDirectoryMiddleware: Middleware<{}, RootState> =
	({ getState, dispatch }) =>
	(next) =>
	(action) => {
		if (setOpenDirectory.match(action)) {
			dispatch(setTabs(getState().tabs.tabs.filter((t) => t.type !== 'file')));
		}

		return next(action);
	};

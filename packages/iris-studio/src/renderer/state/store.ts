import { useDispatch } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { rememberReducer, rememberEnhancer } from 'redux-remember';

import appReducer, { openDirectoryMiddleware } from './appSlice';
import tabsReducer, { tabMiddleware } from './tabsSlice';

const rootReducer = rememberReducer({
	app: appReducer,
	tabs: tabsReducer
});

const store = configureStore({
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat([openDirectoryMiddleware, tabMiddleware]),
	reducer: rootReducer,
	enhancers: (getDefaultEnhancers) =>
		getDefaultEnhancers().concat([
			rememberEnhancer(window.localStorage, ['app', 'tabs'])
		])
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

export default store;

import { useDispatch } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { rememberReducer, rememberEnhancer } from 'redux-remember';

import devReducer from './devSlice';

const rootReducer = rememberReducer({
	dev: devReducer
});

const store = configureStore({
	reducer: rootReducer,
	enhancers: (getDefaultEnhancers) =>
		getDefaultEnhancers().concat([
			rememberEnhancer(window.localStorage, ['dev'])
		])
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

export default store;

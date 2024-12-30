import { useDispatch } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import {
	rememberReducer,
	rememberEnhancer,
	type UnserializeFunction
} from 'redux-remember';

import devSlice from './devSlice';
import prefsSlice from './prefsSlice';
import userSlice from './userSlice';

const slices = {
	dev: devSlice,
	prefs: prefsSlice,
	user: userSlice
};

const reducers = {
	dev: devSlice.reducer,
	prefs: prefsSlice.reducer,
	user: userSlice.reducer
};

const rootReducer = rememberReducer(reducers);

// https://github.com/zewish/redux-remember/issues/13#issuecomment-1880719687
const unserialize: UnserializeFunction = (data, key) => {
	const slice = slices[key as keyof typeof slices];
	if (!slice) {
		throw new Error(`No slice "${key}"`);
	}

	const parsed = JSON.parse(data);
	const initialState = slice.getInitialState();
	const newState: Record<string, unknown> = {};

	for (const key in initialState) {
		const keyT = key as keyof typeof initialState;
		if (
			typeof initialState[keyT] === 'object' &&
			!Array.isArray(initialState[keyT]) &&
			typeof parsed[keyT] === 'object' &&
			!Array.isArray(parsed[keyT])
		) {
			newState[keyT] = Object.assign(
				structuredClone(initialState[keyT]),
				parsed[keyT]
			);
		} else if (parsed[keyT] !== undefined) {
			newState[keyT] = parsed[keyT];
		} else {
			newState[keyT] = initialState[keyT];
		}
	}

	return newState;
};

const store = configureStore({
	reducer: rootReducer,
	enhancers: (getDefaultEnhancers) =>
		getDefaultEnhancers().concat([
			rememberEnhancer(window.localStorage, ['dev', 'prefs'], { unserialize })
		])
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

export default store;

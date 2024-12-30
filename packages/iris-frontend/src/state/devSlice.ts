import { createSlice } from '@reduxjs/toolkit';

interface DevState {
	enabled: boolean;
	host: string;
	state: string;
	refresh: number;
}

const devSlice = createSlice({
	name: 'dev',
	initialState: {
		enabled: false,
		host: '127.0.0.1:58064',
		state: 'disconnected',
		refresh: 0
	} as DevState,
	reducers: {
		setDevEnabled(state, action) {
			state.enabled = action.payload;
		},
		setDevHost(state, action) {
			state.host = action.payload;
		},
		setDevState(state, action) {
			state.state = action.payload;
		},
		devRefresh(state) {
			state.refresh++;
		}
	}
});

export const { setDevEnabled, setDevHost, setDevState, devRefresh } =
	devSlice.actions;

export default devSlice;

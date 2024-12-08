import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import trpc from '../trpc';

interface UserState {
	user?: Awaited<ReturnType<typeof trpc.user.info.query>>;
}

export const fetchUser = createAsyncThunk('user/fetchUser', () => {
	return trpc.user.info.query();
});

const userSlice = createSlice({
	name: 'user',
	initialState: {} as UserState,
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(fetchUser.fulfilled, (state, action) => {
			state.user = action.payload;
		});
	}
});

export default userSlice;

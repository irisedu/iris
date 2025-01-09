import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { UserInfoResult } from 'iris-backend';

interface UserState {
	user?: UserInfoResult;
}

export const fetchUser = createAsyncThunk('user/fetchUser', async () => {
	const res = await fetch('/auth/info');
	return await res.json();
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

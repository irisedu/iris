import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Question } from '@irisedu/schemas';
import type { RootState } from './store';

interface QuestionData {
	data: Question;
	isDev: boolean;
}

interface DataState {
	questions: Record<string, QuestionData>;
}

export const fetchQuestion = createAsyncThunk(
	'data/fetchQuestion',
	async (src: string, thunkAPI) => {
		const state = thunkAPI.getState() as RootState;
		const { enabled: devEnabled, host: devHost } = state.dev;

		return fetch(devEnabled ? `http://${devHost}${src}` : src)
			.then(async (res) => {
				if (devEnabled && res.status !== 200) {
					const fallbackRes = await fetch(src);
					return { res: await fallbackRes.json(), isDev: false };
				}

				return { data: await res.json(), isDev: devEnabled };
			})
			.catch(console.error);
	}
);

const userSlice = createSlice({
	name: 'user',
	initialState: {
		questions: {}
	} as DataState,
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(fetchQuestion.fulfilled, (state, action) => {
			state.questions[action.meta.arg] = action.payload as QuestionData;
		});
	}
});

export default userSlice;

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

interface FeaturesState {
	features: string[];
}

export const fetchFeatures = createAsyncThunk(
	'features/fetchFeatures',
	async () => {
		const res = await fetch('/api/features');
		return await res.json();
	}
);

const featuresSlice = createSlice({
	name: 'features',
	initialState: { features: [] } as FeaturesState,
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(fetchFeatures.fulfilled, (state, action) => {
			state.features = action.payload;
		});
	}
});

export default featuresSlice;

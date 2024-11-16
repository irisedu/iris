import { createSlice } from '@reduxjs/toolkit';

interface PrefsState {
	text: {
		font: string;
		fontSize: number;
		charSpacing: number;
		wordSpacing: number;
		lineSpacing: number;
	};
	hueShift: number;
}

const prefsSlice = createSlice({
	name: 'prefs',
	initialState: {
		text: {
			font: 'Vollkorn',
			fontSize: 125,
			charSpacing: 0,
			wordSpacing: 0.1,
			lineSpacing: 1.5
		},
		hueShift: 0
	} as PrefsState,
	reducers: {
		setFont(state, action) {
			state.text.font = action.payload;
		},
		setFontSize(state, action) {
			state.text.fontSize = action.payload;
		},
		setCharSpacing(state, action) {
			state.text.charSpacing = action.payload;
		},
		setWordSpacing(state, action) {
			state.text.wordSpacing = action.payload;
		},
		setLineSpacing(state, action) {
			state.text.lineSpacing = action.payload;
		},
		setHueShift(state, action) {
			state.hueShift = action.payload;
		}
	}
});

export const {
	setFont,
	setFontSize,
	setCharSpacing,
	setWordSpacing,
	setLineSpacing,
	setHueShift
} = prefsSlice.actions;

export default prefsSlice;

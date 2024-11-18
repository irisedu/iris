import { createSlice } from '@reduxjs/toolkit';
import { lightbox } from './presets/ruler';
import { compact } from './presets/text';

interface PrefsState {
	text: {
		font: string;
		fontSize: number;
		charSpacing: number;
		wordSpacing: number;
		lineSpacing: number;
	};
	hueShift: number;
	ruler: {
		enabled: boolean;

		focusArea: number;
		focusColor: string;

		underlineColor: string;
		overlineColor: string;
		lineThickness: number;

		topShadeColor: string;
		bottomShadeColor: string;
	};
}

const prefsSlice = createSlice({
	name: 'prefs',
	initialState: {
		text: {
			font: 'Vollkorn',
			fontSize: 125,
			...compact
		},
		hueShift: 0,
		ruler: {
			enabled: false,
			...lightbox
		}
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
		setSpacing(state, action) {
			state.text = {
				...action.payload,
				font: state.text.font,
				fontSize: state.text.fontSize
			};
		},
		setHueShift(state, action) {
			state.hueShift = action.payload;
		},
		setRulerEnabled(state, action) {
			state.ruler.enabled = action.payload;
		},
		setRulerSettings(state, action) {
			state.ruler = {
				...action.payload,
				enabled: state.ruler.enabled
			};
		}
	}
});

export const {
	setFont,
	setFontSize,
	setCharSpacing,
	setWordSpacing,
	setLineSpacing,
	setSpacing,
	setHueShift,
	setRulerEnabled,
	setRulerSettings
} = prefsSlice.actions;

export default prefsSlice;

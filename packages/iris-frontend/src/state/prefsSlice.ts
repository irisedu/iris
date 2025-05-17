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
		paragraphSpacing: number;
	};
	theme: string; // auto, light, dark
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
	cookies: 'consent' | 'essential' | 'all';
}

const prefsSlice = createSlice({
	name: 'prefs',
	initialState: {
		text: {
			font: 'Vollkorn',
			fontSize: 125,
			...compact
		},
		theme: 'auto',
		hueShift: 0,
		ruler: {
			enabled: false,
			...lightbox
		},
		cookies: 'consent'
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
		setParagraphSpacing(state, action) {
			state.text.paragraphSpacing = action.payload;
		},
		setSpacing(state, action) {
			state.text = {
				...action.payload,
				font: state.text.font,
				fontSize: state.text.fontSize
			};
		},
		setTheme(state, action) {
			state.theme = action.payload;
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
		},
		setCookies(state, action) {
			state.cookies = action.payload;
		}
	}
});

export const {
	setFont,
	setFontSize,
	setCharSpacing,
	setWordSpacing,
	setLineSpacing,
	setParagraphSpacing,
	setSpacing,
	setTheme,
	setHueShift,
	setRulerEnabled,
	setRulerSettings,
	setCookies
} = prefsSlice.actions;

export default prefsSlice;

import { useEffect, type CSSProperties, type ReactNode } from 'react';

import { useSelector } from 'react-redux';
import { type RootState } from '$state/store';

interface FontSettings {
	smallcaps?: string;
	sans?: string;
	fontSynthesis?: string;
}

const fontSettings: Record<string, FontSettings> = {
	Vollkorn: {
		smallcaps: 'Vollkorn SC',
		sans: 'Atkinson Hyperlegible'
	},
	Lexend: {
		fontSynthesis: 'style'
	},
	'Comic Sans MS, Comic Neue': {
		fontSynthesis: 'style'
	}
};

function StyleProvider({ children }: { children: ReactNode }) {
	const font = useSelector((state: RootState) => state.prefs.text.font);
	const fontSize = useSelector((state: RootState) => state.prefs.text.fontSize);
	const charSpacing = useSelector(
		(state: RootState) => state.prefs.text.charSpacing
	);
	const wordSpacing = useSelector(
		(state: RootState) => state.prefs.text.wordSpacing
	);
	const lineSpacing = useSelector(
		(state: RootState) => state.prefs.text.lineSpacing
	);

	useEffect(() => {
		document.documentElement.style.fontSize = fontSize + '%';
	}, [fontSize]);

	const settings = fontSettings[font];

	const style = {
		'--font-body': font,
		'--font-smallcaps': settings?.smallcaps ?? font,
		'--font-sans': settings?.sans ?? font,
		'font-synthesis': settings?.fontSynthesis ?? 'none',

		'letter-spacing': charSpacing + 'em',
		'word-spacing': wordSpacing < 0 ? 'normal' : wordSpacing + 'em',
		'line-height': lineSpacing + ''
	} as CSSProperties;

	return (
		<div style={style} className="font-body">
			{children}
		</div>
	);
}

export default StyleProvider;

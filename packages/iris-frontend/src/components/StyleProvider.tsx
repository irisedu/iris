import { useEffect, type CSSProperties, type ReactNode } from 'react';
import ReadingRuler from './ReadingRuler';

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

function StyleProvider({
	children,
	className
}: {
	children: ReactNode;
	className: string;
}) {
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

	const hueShift = useSelector((state: RootState) => state.prefs.hueShift);

	useEffect(() => {
		document.documentElement.style.fontSize = fontSize + '%';
	}, [fontSize]);

	useEffect(() => {
		document.documentElement.style.setProperty(
			'--hue-shift',
			hueShift.toString()
		);
	}, [hueShift]);

	const settings = fontSettings[font];

	const style = {
		'--font-body': font,
		'--font-smallcaps': settings?.smallcaps ?? font,
		'--font-sans': settings?.sans ?? font,
		fontSynthesis: settings?.fontSynthesis ?? 'none',

		letterSpacing: charSpacing + 'em',
		wordSpacing: wordSpacing < 0 ? 'normal' : wordSpacing + 'em',
		lineHeight: lineSpacing.toString()
	} as CSSProperties;

	return (
		<div
			style={style}
			className={`font-body${className ? ' ' + className : ''}`}
		>
			<ReadingRuler />
			{children}
		</div>
	);
}

export default StyleProvider;

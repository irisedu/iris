import { useEffect, type CSSProperties, type ReactNode } from 'react';
import ReadingRuler from './ReadingRuler';
import { useMediaQuery } from 'react-responsive';

import { useSelector } from 'react-redux';
import { type RootState } from '$state/store';

import './StyleProvider.css';

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
	className?: string;
}) {
	const textSettings = useSelector((state: RootState) => state.prefs.text);
	const theme = useSelector((state: RootState) => state.prefs.theme);
	const hueShift = useSelector((state: RootState) => state.prefs.hueShift);

	const prefersDark = useMediaQuery({ query: '(prefers-color-scheme: dark)' });

	const {
		font,
		fontSize,
		charSpacing,
		wordSpacing,
		lineSpacing,
		paragraphSpacing
	} = textSettings;

	const settings = fontSettings[font];

	useEffect(() => {
		const style = document.documentElement.style;

		style.fontSize = fontSize + '%';
		style.setProperty('--font-body', font);
		style.setProperty('--font-smallcaps', settings?.smallcaps ?? font);
		style.setProperty('--font-sans', settings?.sans ?? font);
		style.fontSynthesis = settings?.fontSynthesis ?? 'none';
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [textSettings]);

	useEffect(() => {
		const dark = theme === 'auto' ? prefersDark : theme === 'dark';

		if (dark) document.documentElement.classList.add('dark');
		else document.documentElement.classList.remove('dark');
	}, [theme, prefersDark]);

	useEffect(() => {
		const style = document.documentElement.style;
		style.setProperty('--hue-shift', hueShift.toString());
	}, [hueShift]);

	const style = {
		letterSpacing: charSpacing + 'em',
		wordSpacing: wordSpacing < 0 ? 'normal' : wordSpacing + 'em',
		'--line-height': lineSpacing.toString(),
		'--paragraph-spacing': paragraphSpacing + 'em'
	} as CSSProperties;

	return (
		<div
			style={style}
			className={`style-provider font-body${className ? ' ' + className : ''}`}
		>
			<ReadingRuler />
			{children}
		</div>
	);
}

export default StyleProvider;

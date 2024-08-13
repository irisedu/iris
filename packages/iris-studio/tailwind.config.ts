// @ts-expect-error Nightwind does not support TypeScript
import nightwind from 'nightwind';

export default {
	content: ['./src/**/*.tsx'],
	important: true,
	theme: {
		fontFamily: {
			serif: ['Vollkorn'],
			smallcaps: ['Vollkorn\\ SC'],
			sans: ['IBM\\ Plex\\ Sans'],
			mono: ['JetBrains\\ Mono']
		},
		extend: {
			colors: {
				// Same as Tailwind "zinc" + 75 and 150 interpolated
				iris: {
					50: '#fafafa',
					75: '#f7f7f7',
					100: '#f4f4f5',
					150: '#ececec',
					200: '#e4e4e7',
					300: '#d4d4d8',
					400: '#a1a1aa',
					500: '#71717a',
					600: '#52525b',
					700: '#3f3f46',
					800: '#27272a',
					900: '#18181b',
					950: '#09090b'
				}
			},
			listStyleType: {
				circle: 'circle',
				'lower-alpha': 'lower-alpha',
				'lower-roman': 'lower-roman',
				'upper-alpha': 'upper-alpha',
				square: 'square'
			}
		}
	},
	darkMode: 'class',
	plugins: [nightwind],
	safelist: ['font-smallcaps']
};

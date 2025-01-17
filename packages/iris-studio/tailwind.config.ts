// @ts-expect-error Nightwind does not support TypeScript
import nightwind from 'nightwind';
import path from 'path';

export default {
	content: [
		'./src/**/*.tsx',
		path.join(path.dirname(require.resolve('iris-components')), '**/*.tsx'),
		path.join(path.dirname(require.resolve('iris-prosemirror')), '**/*.tsx')
	],
	important: true,
	theme: {
		fontFamily: {
			serif: ['Vollkorn'],
			smallcaps: ['"Vollkorn SC"'],
			sans: ['"Atkinson Hyperlegible"'],
			mono: ['"Source Code Pro"']
		},
		extend: {
			colors: {
				// Same as Tailwind "zinc"
				iris: {
					50: '#fafafa',
					100: '#f4f4f5',
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

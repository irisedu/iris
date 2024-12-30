import path from 'path';

export default {
	content: [
		'./src/**/*.tsx',
		path.join(path.dirname(require.resolve('iris-components')), '**/*.tsx')
	],
	important: true,
	theme: {
		fontFamily: {
			body: ['var(--font-body)'],
			smallcaps: ['var(--font-smallcaps)'],
			sans: ['var(--font-sans)'],
			mono: ['"Source Code Pro"']
		},
		extend: {
			colors: {
				// Based on https://uicolors.app/create
				// hsl(270, 100%, 50%)
				iris: {
					50: 'hsl(calc(270 + var(--hue-shift)), var(--color-sat), 98%)',
					75: 'hsl(calc(270 + var(--hue-shift)), var(--color-sat), 97%)',
					100: 'hsl(calc(270 + var(--hue-shift)), var(--color-sat), 95%)',
					150: 'hsl(calc(270 + var(--hue-shift)), var(--color-sat), 93%)',
					200: 'hsl(calc(270 + var(--hue-shift)), var(--color-sat), 90%)',
					300: 'hsl(calc(270 + var(--hue-shift)), var(--color-sat), 85%)',
					400: 'hsl(calc(270 + var(--hue-shift)), var(--color-sat), 75%)',
					500: 'hsl(calc(270 + var(--hue-shift)), var(--color-sat), 65%)',
					600: 'hsl(calc(270 + var(--hue-shift)), var(--color-sat), 55%)',
					700: 'hsl(calc(270 + var(--hue-shift)), var(--color-sat), 50%)',
					800: 'hsl(calc(270 + var(--hue-shift)), var(--color-sat), 45%)',
					900: 'hsl(calc(270 + var(--hue-shift)), var(--color-sat), 35%)',
					950: 'hsl(calc(270 + var(--hue-shift)), var(--color-sat), 25%)'
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
	plugins: []
};

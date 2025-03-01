// @ts-expect-error Nightwind does not support TypeScript
import nightwind from 'nightwind';
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
		screens: {
			sm: '40em',
			md: '48em',
			lg: '64em',
			xl: '80em',
			'2xl': '96em'
		},
		lineHeight: {
			tight: 'calc(var(--line-height) * 0.9)',
			snug: 'calc(var(--line-height) * 0.95)',
			normal: 'calc(var(--line-height) * 1)',
			relaxed: 'calc(var(--line-height) * 1.05)',
			loose: 'calc(var(--line-height) * 1.1)'
		},
		extend: {
			colors: {
				// Based on https://uicolors.app/create
				// hsl(270, 100%, 50%)
				iris: {
					50: 'hsl(calc(270 + var(--hue-shift)), var(--color-sat), 98%)',
					100: 'hsl(calc(270 + var(--hue-shift)), var(--color-sat), 95%)',
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
		},
		nightwind: {
			colors: {
				iris: {
					50: 'hsl(calc(270 + var(--hue-shift)), 40%, 5%)',
					100: 'hsl(calc(270 + var(--hue-shift)), 40%, 15%)',
					200: 'hsl(calc(270 + var(--hue-shift)), 40%, 25%)',
					300: 'hsl(calc(270 + var(--hue-shift)), 40%, 35%)',
					400: 'hsl(calc(270 + var(--hue-shift)), 40%, 45%)',
					500: 'hsl(calc(270 + var(--hue-shift)), 40%, 55%)',
					600: 'hsl(calc(270 + var(--hue-shift)), 40%, 65%)',
					700: 'hsl(calc(270 + var(--hue-shift)), 40%, 70%)',
					800: 'hsl(calc(270 + var(--hue-shift)), 40%, 75%)',
					900: 'hsl(calc(270 + var(--hue-shift)), 40%, 85%)',
					950: 'hsl(calc(270 + var(--hue-shift)), 40%, 95%)'
				}
			}
		}
	},
	darkMode: 'class',
	plugins: [nightwind]
};

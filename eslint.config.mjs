import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';

import { fixupConfigRules } from '@eslint/compat';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all
});

export default [
	js.configs.recommended,
	...tseslint.configs.strict,
	prettier,
	react.configs.flat.recommended,
	react.configs.flat['jsx-runtime'],
	...fixupConfigRules(compat.extends('plugin:react-hooks/recommended')),
	{
		files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx']
	},
	{
		ignores: [
			'**/dist/',
			'**/out/',
			'**/.eslintrc.cjs',
			'packages/iris-backend/obj/',
			'packages/iris-backend/spa/',
			'packages/iris-backend/src/db/migrations/'
		]
	},
	{
		plugins: {
			'react-refresh': reactRefresh
		},

		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module'
		},

		settings: {
			react: {
				version: '18.2'
			}
		},

		rules: {
			'react/jsx-no-target-blank': 'off',
			'react/prop-types': 'off',
			'react-refresh/only-export-components': 'off',
			'import/no-absolute-path': 'off',
			'@typescript-eslint/no-non-null-assertion': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_'
				}
			]
		}
	},
	{
		files: [
			'packages/iris-frontend/src/**',
			'packages/iris-components/src/**',
			'packages/iris-prosemirror/src/**'
		],

		languageOptions: {
			globals: {
				...globals.browser
			}
		}
	},
	{
		files: ['packages/iris-frontend/src/**'],
		languageOptions: {
			globals: {
				__APP_VERSION__: true
			}
		}
	},
	{
		files: ['packages/iris-studio/src/renderer/**'],

		languageOptions: {
			globals: {
				...globals.browser,
				process: true,
				win: true,
				os: true,
				app: true,
				fs: true,
				shell: true,
				patchouli: true
			}
		}
	},
	{
		files: ['packages/patchouli/**'],

		languageOptions: {
			globals: {
				...globals.node
			}
		}
	},
	{
		files: ['tools/**'],

		languageOptions: {
			globals: {
				...globals.node
			}
		}
	}
];

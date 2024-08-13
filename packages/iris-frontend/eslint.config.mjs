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
		ignores: ['**/dist/*']
	},
	{
		plugins: {
			'react-refresh': reactRefresh
		},

		languageOptions: {
			globals: {
				...globals.browser
			},

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
			'import/no-absolute-path': 'off'
		}
	}
];

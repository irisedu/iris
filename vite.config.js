import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import Icons from 'unplugin-icons/vite';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		Icons({
			compiler: 'jsx',
			jsx: 'react'
		})
	],
	resolve: {
		alias: [
			{
				find: '$assets',
				replacement: path.join(import.meta.dirname, 'src/assets')
			},
			{
				find: '$hooks',
				replacement: path.join(import.meta.dirname, 'src/hooks')
			},
			{
				find: '$components',
				replacement: path.join(import.meta.dirname, 'src/components')
			}
		]
	}
});

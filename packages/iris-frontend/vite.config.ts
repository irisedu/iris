import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import Icons from 'unplugin-icons/vite';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		Icons({
			compiler: 'jsx',
			jsx: 'react'
		}),
		svgr({
			svgrOptions: {
				dimensions: false
			}
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
			},
			{
				find: '$state',
				replacement: path.join(import.meta.dirname, 'src/state')
			}
		]
	},
	server: {
		proxy: {
			'^\\/(page\\/[^.]+\\..*)|(series\\/?)|(auth\\/.*)|(api\\/.*)$': {
				target: 'http://localhost:58063',
				changeOrigin: true
			}
		}
	},
	define: {
		__APP_VERSION__: JSON.stringify(process.env.npm_package_version)
	}
});

import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import type { UserConfig } from 'vite';

const pathResolve = (dir: string) => {
	return resolve(__dirname, '.', dir);
};

const alias: Record<string, string> = {
	'/@': pathResolve('/src/'),
};

const viteConfig: UserConfig = {
	plugins: [vue()],
	root: process.cwd(),
	resolve: { alias },
	base: './',
  
	server: {
		port: 8082,
		open: false,
		proxy: {
			'/gas/v1': {
				target: 'https://dev.api.rongyaomedia.com/api',
				ws: true,
				changeOrigin: true,
			},
		},
	},
	build: {
		outDir: 'dist',
		minify: 'esbuild',
		sourcemap: false,
	},
};

export default viteConfig;

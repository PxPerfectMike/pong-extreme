import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			precompress: false,
			strict: true
		}),
		alias: {
			$engine: 'src/lib/engine',
			$game: 'src/lib/game',
			$scenes: 'src/lib/scenes',
			$stores: 'src/lib/stores',
			$party: 'src/lib/party'
		}
	}
};

export default config;

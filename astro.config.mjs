import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
    output: 'server',
    adapter: cloudflare(),
    // Questa opzione aiuta a gestire i file nella cartella public
    build: {
        assets: 'assets'
    }
});
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
    output: 'server', // Cambiamo da 'static' a 'server'
    adapter: cloudflare()
});
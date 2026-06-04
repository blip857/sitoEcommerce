import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
    output: 'server',
    adapter: cloudflare({
        // Rimuoviamo kvNamespaces qui se lo stiamo già dichiarando in wrangler.json
        // per evitare che l'adattatore cerchi di crearne uno nuovo.
    }),
});
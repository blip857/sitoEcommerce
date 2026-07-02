import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
    output: 'static',
    // Aggiungiamo questa riga per assicurarci che la cartella public sia gestita correttamente
    publicDir: 'public',
    vite: {
        plugins: [tailwind()],
    },
});
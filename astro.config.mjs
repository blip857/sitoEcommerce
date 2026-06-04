import { defineConfig } from 'astro/config';

export default defineConfig({
    output: 'static',
    // Aggiungiamo questa riga per assicurarci che la cartella public sia gestita correttamente
    publicDir: 'public',
});
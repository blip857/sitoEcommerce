import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders'; // Nuovo loader richiesto da Astro v6

const prodotti = defineCollection({
    // Diciamo ad Astro dove andare a cercare i file Markdown dei prodotti
    loader: glob({ pattern: "**/*.md", base: "./src/content/prodotti" }),
    schema: z.object({
        nome: z.string(),
        prezzo: z.number(),
        immagine: z.string(),
    }),
});

export const collections = { prodotti };
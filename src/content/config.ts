import { defineCollection, z } from 'astro:content';

const prodotti = defineCollection({
    type: 'content',
    schema: z.object({
        nome: z.string(),
        prezzo: z.number(),
        immagine: z.string(),
    }),
});

export const collections = { prodotti };
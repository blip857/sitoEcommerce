/**
 * @file vestiario.config.ts
 * @description Single Source of Truth (SSoT) registry for the Vestiario collection products.
 *              Contains immutable definitions for products, categories, prices, and color variants.
 * @version 1.0.0
 */

export interface ColorVariant {
  readonly id: string;
  readonly name: string;
  readonly hex: string;
  readonly image: string;
}

export interface Product {
  readonly id: string;
  readonly title: string;
  readonly category: 't-shirt' | 'felpa';
  readonly price: number;
  readonly currency: string;
  readonly defaultImage: string;
  readonly variants: readonly ColorVariant[];
}

/**
 * VESTIARIO_PRODUCTS_REGISTRY — SSoT for all Vestiario clothing items.
 * Protected against runtime mutations using Object.freeze and as const.
 */
export const VESTIARIO_PRODUCTS_REGISTRY: ReadonlyArray<Product> = Object.freeze([
  // --- T-SHIRTS (3 products) ---
  {
    id: "ts-01",
    title: "T-Shirt Classic Logo Black",
    category: "t-shirt",
    price: 35.00,
    currency: "€",
    defaultImage: "/assets/25fwprts503_01.jpg",
    variants: [
      { id: "v-ts-01-bk", name: "Black", hex: "#111111", image: "/assets/25fwprts503_01.jpg" },
      { id: "v-ts-01-wt", name: "White", hex: "#F5F5F5", image: "/assets/25fwprts503_01.jpg" },
      { id: "v-ts-01-gy", name: "Heather Grey", hex: "#888888", image: "/assets/25fwprts503_01.jpg" }
    ]
  },
  {
    id: "ts-02",
    title: "T-Shirt Oversized Heavy Cotton",
    category: "t-shirt",
    price: 42.00,
    currency: "€",
    defaultImage: "/assets/25fwprts503_01.jpg",
    variants: [
      { id: "v-ts-02-nv", name: "Deep Navy", hex: "#1B263B", image: "/assets/25fwprts503_01.jpg" },
      { id: "v-ts-02-ol", name: "Olive Green", hex: "#4A5D4E", image: "/assets/25fwprts503_01.jpg" },
      { id: "v-ts-02-bk", name: "Black", hex: "#111111", image: "/assets/25fwprts503_01.jpg" }
    ]
  },
  {
    id: "ts-03",
    title: "T-Shirt Minimal Graphic Edition",
    category: "t-shirt",
    price: 39.00,
    currency: "€",
    defaultImage: "/assets/25fwprts503_01.jpg",
    variants: [
      { id: "v-ts-03-wt", name: "White", hex: "#FFFFFF", image: "/assets/25fwprts503_01.jpg" },
      { id: "v-ts-03-sd", name: "Sand", hex: "#D7C4B7", image: "/assets/25fwprts503_01.jpg" }
    ]
  },

  // --- FELPE / HOODIES (3 products) ---
  {
    id: "fl-01",
    title: "Hoodie Heavyweight Fleece Zip",
    category: "felpa",
    price: 79.00,
    currency: "€",
    defaultImage: "/assets/25fwprts503_01.jpg",
    variants: [
      { id: "v-fl-01-bk", name: "Black", hex: "#111111", image: "/assets/25fwprts503_01.jpg" },
      { id: "v-fl-01-gy", name: "Charcoal Grey", hex: "#333333", image: "/assets/25fwprts503_01.jpg" }
    ]
  },
  {
    id: "fl-02",
    title: "Hoodie Classic Pullover Logo",
    category: "felpa",
    price: 75.00,
    currency: "€",
    defaultImage: "/assets/25fwprts503_01.jpg",
    variants: [
      { id: "v-fl-02-nv", name: "Navy", hex: "#1B263B", image: "/assets/25fwprts503_01.jpg" },
      { id: "v-fl-02-br", name: "Bordeaux", hex: "#581845", image: "/assets/25fwprts503_01.jpg" },
      { id: "v-fl-02-bk", name: "Black", hex: "#111111", image: "/assets/25fwprts503_01.jpg" }
    ]
  },
  {
    id: "fl-03",
    title: "Crewneck Sweatshirt Essential",
    category: "felpa",
    price: 69.00,
    currency: "€",
    defaultImage: "/assets/25fwprts503_01.jpg",
    variants: [
      { id: "v-fl-03-gy", name: "Melange Grey", hex: "#AAAAAA", image: "/assets/25fwprts503_01.jpg" },
      { id: "v-fl-03-bk", name: "Black", hex: "#111111", image: "/assets/25fwprts503_01.jpg" }
    ]
  }
] as const);

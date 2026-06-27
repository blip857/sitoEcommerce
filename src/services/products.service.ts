/**
 * @file products.service.ts
 * @description Facade service layer for retrieving and normalizing product data from SSoT registries.
 *              Decouples components from raw configuration data sources.
 * @version 1.0.0
 */

import { VESTIARIO_PRODUCTS_REGISTRY, type Product } from '../config/vestiario.config';

export interface FormattedProduct extends Product {
  readonly formattedPrice: string;
  readonly variantCount: number;
}

/**
 * ProductsFacadeService — Exposes normalized product data operations.
 */
export class ProductsFacadeService {
  /**
   * Retrieves all items from the Vestiario registry with normalized attributes.
   */
  public static getAllVestiarioProducts(): FormattedProduct[] {
    return VESTIARIO_PRODUCTS_REGISTRY.map((product) => this.normalizeProduct(product));
  }

  /**
   * Retrieves products filtered by category ('t-shirt' | 'felpa').
   */
  public static getVestiarioProductsByCategory(category: 't-shirt' | 'felpa'): FormattedProduct[] {
    return VESTIARIO_PRODUCTS_REGISTRY
      .filter((product) => product.category === category)
      .map((product) => this.normalizeProduct(product));
  }

  /**
   * Finds a single product by its unique identifier.
   */
  public static getProductById(id: string): FormattedProduct | undefined {
    const product = VESTIARIO_PRODUCTS_REGISTRY.find((p) => p.id === id);
    if (!product) return undefined;
    return this.normalizeProduct(product);
  }

  /**
   * Normalizes raw product data into a FormattedProduct instance.
   */
  private static normalizeProduct(product: Product): FormattedProduct {
    return {
      ...product,
      formattedPrice: `${product.currency}${product.price.toFixed(2)}`,
      variantCount: product.variants.length
    };
  }
}

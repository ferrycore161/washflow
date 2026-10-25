import { useMemo } from 'react';
import bundled from '../data/catalog.json';
import type { Product } from '../domain/types';
import { useStore } from './useStore';

export const BUNDLED_PRODUCTS = bundled.products as unknown as Product[];
export const BUNDLED_VERSION = bundled.version;

/** Встроенный каталог, перекрытый импортированными/синхронизированными карточками по id. */
export function mergeProducts(base: Product[], extra: Product[]): Product[] {
  const map = new Map(base.map((p) => [p.id, p]));
  for (const p of extra) map.set(p.id, p);
  return [...map.values()];
}

export function useProducts(): Product[] {
  const extra = useStore((s) => s.extraProducts);
  return useMemo(() => mergeProducts(BUNDLED_PRODUCTS, extra), [extra]);
}

export function useProductMap(): Map<string, Product> {
  const products = useProducts();
  return useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
}

export function getProduct(id: string): Product | undefined {
  return (
    useStore.getState().extraProducts.find((p) => p.id === id) ?? BUNDLED_PRODUCTS.find((p) => p.id === id)
  );
}

import shopJson from '../data/shop.json';
import type { ShopData } from '../domain/shopSchema';

export const SHOP = shopJson as unknown as ShopData;

export function offersFor(productId: string) {
  return SHOP.offers.filter((o) => o.productId === productId);
}

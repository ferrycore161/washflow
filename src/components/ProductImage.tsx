import { useState } from 'react';
import type { Product } from '../domain/types';
import { ProductBottle } from './art/Bottle';

/**
 * Фото товара с официального сайта (кэшируется service worker'ом после первого показа).
 * Без сети или при ошибке загрузки — фирменная иллюстрация флакона.
 */
export function ProductImage({ product, size = 104, src }: { product: Product; size?: number; src?: string }) {
  const url = src ?? product.imageUrl;
  const [failed, setFailed] = useState(false);
  if (!url || failed) return <ProductBottle product={product} size={size} />;
  return (
    <span className="product-photo" style={{ width: size * 0.9, height: size }}>
      <img src={url} alt={`${product.brand} ${product.name}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
    </span>
  );
}

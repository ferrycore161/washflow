import { useId } from 'react';
import type { Product, ProductCategory } from '../../domain/types';

export const CATEGORY_COLOR: Record<ProductCategory, string> = {
  prewash: '#47a9ff',
  active_foam: '#5fd0ff',
  contact_shampoo: '#ff5c93',
  universal_shampoo: '#ffa24d',
  protection: '#3ee6b4',
  wheel_cleaner: '#a98bff',
  insect_remover: '#ffc24d',
  tar_remover: '#ff8a4d',
  iron_remover: '#c77dff',
  glass_cleaner: '#7fd6ff',
  drying_aid: '#9fb3ff',
  other: '#9fb0b6',
};

/** Цвет карточки: по ключевым словам названия, иначе по категории. */
export function productColor(p: Pick<Product, 'name' | 'category'>): string {
  const n = p.name.toLowerCase();
  if (/cherry|pink|розов|red|черри/.test(n)) return '#ff4f7e';
  if (/green|грин|lime/.test(n)) return '#8be04e';
  if (/blue|синий|delicate|aqua/.test(n)) return '#47a9ff';
  if (/quartz|кварц|ceramic|керам/.test(n)) return '#2ee6c8';
  if (/yellow|желт|lemon|gold/.test(n)) return '#ffd04d';
  if (/violet|purple|фиолет/.test(n)) return '#a98bff';
  return CATEGORY_COLOR[p.category];
}

interface Props {
  color: string;
  brand?: string;
  name?: string;
  size?: number;
  glow?: boolean;
  shape?: 'round' | 'tall' | 'trigger';
}

export function Bottle({ color, brand, name, size = 96, glow = true, shape = 'round' }: Props) {
  const id = useId().replace(/:/g, '');
  const short = (name ?? '').length > 13 ? (name ?? '').slice(0, 12) + '…' : name;
  const w = shape === 'tall' ? 56 : 64;
  const x = (100 - w) / 2;
  return (
    <svg width={size * 0.66} height={size} viewBox="0 0 100 150" aria-hidden="true" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`body${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#0c1114" />
          <stop offset="0.18" stopColor="#1d262b" />
          <stop offset="0.5" stopColor="#0e1316" />
          <stop offset="0.85" stopColor="#161e22" />
          <stop offset="1" stopColor="#080b0d" />
        </linearGradient>
        <linearGradient id={`liq${id}`} x1="0" x2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.55" />
          <stop offset="0.3" stopColor={color} />
          <stop offset="0.7" stopColor={color} stopOpacity="0.85" />
          <stop offset="1" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
        <radialGradient id={`glow${id}`}>
          <stop offset="0" stopColor={color} stopOpacity="0.55" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`clip${id}`}>
          <rect x={x} y="40" width={w} height="104" rx="13" />
        </clipPath>
      </defs>
      {glow && <ellipse cx="50" cy="140" rx="52" ry="16" fill={`url(#glow${id})`} />}
      {/* крышка */}
      <rect x="36" y="6" width="28" height="22" rx="4" fill="#0b0f12" stroke="#2a353b" strokeWidth="1" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={38.5 + i * 4.2} y="8" width="1.4" height="18" fill="#1d272c" />
      ))}
      <rect x="40" y="27" width="20" height="9" rx="2" fill="#141b1f" />
      {/* плечи и корпус */}
      <path d={`M40 33 h20 C${x + w - 4} 33 ${x + w} 38 ${x + w} 52 H${x} C${x} 38 ${x + 4} 33 40 33Z`} fill="#141b1f" />
      <rect x={x} y="40" width={w} height="104" rx="13" fill={`url(#body${id})`} stroke="rgba(255,255,255,0.08)" />
      <g clipPath={`url(#clip${id})`}>
        <rect x={x} y="40" width={w} height="16" fill={`url(#liq${id})`} opacity="0.95" />
        <rect x={x} y="126" width={w} height="20" fill={`url(#liq${id})`} opacity="0.9" />
        {/* этикетка */}
        <rect x={x} y="58" width={w} height="66" fill="#0a0e10" />
        <rect x={x + 4} y="42" width="5" height="100" rx="2.5" fill="#fff" opacity="0.14" />
        <rect x={x + w - 10} y="42" width="2" height="100" rx="1" fill="#fff" opacity="0.07" />
      </g>
      {brand && (
        <text x="50" y="74" textAnchor="middle" fill="#cfd8dc" fontSize="6.4" fontWeight="700" fontFamily="Manrope Variable, sans-serif">
          {brand.length > 16 ? brand.slice(0, 15) + '…' : brand}
        </text>
      )}
      {short && (
        <text x="50" y="92" textAnchor="middle" fill="#fff" fontSize={short.length > 10 ? 7.6 : 9} fontWeight="800" fontFamily="Manrope Variable, sans-serif">
          {short}
        </text>
      )}
      <rect x="38" y="100" width="24" height="1.6" rx="0.8" fill={color} opacity="0.9" />
      <rect x="34" y="106" width="32" height="1.2" rx="0.6" fill="#5b6a70" opacity="0.6" />
      <rect x="38" y="110" width="24" height="1.2" rx="0.6" fill="#5b6a70" opacity="0.6" />
    </svg>
  );
}

export function ProductBottle({ product, size }: { product: Product; size?: number }) {
  return (
    <Bottle
      color={productColor(product)}
      brand={product.brand}
      name={product.name}
      size={size}
      shape={product.category === 'protection' ? 'tall' : 'round'}
    />
  );
}

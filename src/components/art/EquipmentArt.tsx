import { useId } from 'react';
import type { EquipmentType } from '../../domain/types';

export const EQUIPMENT_COLOR: Record<EquipmentType, string> = {
  sprayer: '#d7f24a',
  foam_generator: '#33e3d4',
  foam_lance: '#47a9ff',
  bucket: '#33e3d4',
  trigger: '#ff9f4d',
  bottle_trigger: '#2ee6c8',
  hpw_injector: '#ffd24d',
  other: '#9fb0b6',
};

export function EquipmentArt({ type, size = 110, color }: { type: EquipmentType; size?: number; color?: string }) {
  const id = useId().replace(/:/g, '');
  const c = color ?? EQUIPMENT_COLOR[type];
  const glow = (
    <>
      <defs>
        <radialGradient id={`g${id}`}>
          <stop offset="0" stopColor={c} stopOpacity="0.45" />
          <stop offset="1" stopColor={c} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`t${id}`} x1="0" x2="1">
          <stop offset="0" stopColor={c} stopOpacity="0.75" />
          <stop offset="0.35" stopColor={c} />
          <stop offset="1" stopColor={c} stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id={`w${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#c9d3d6" />
          <stop offset="0.35" stopColor="#f4f8f9" />
          <stop offset="1" stopColor="#aab6ba" />
        </linearGradient>
        <linearGradient id={`k${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#0a0e10" />
          <stop offset="0.4" stopColor="#262f34" />
          <stop offset="1" stopColor="#0a0e10" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="108" rx="48" ry="12" fill={`url(#g${id})`} />
    </>
  );

  let body: JSX.Element;
  switch (type) {
    case 'sprayer':
      body = (
        <>
          {/* бак */}
          <path d="M38 56 C38 46 46 42 60 42 C74 42 82 46 82 56 L84 98 C84 104 79 108 72 108 H48 C41 108 36 104 36 98 Z" fill={`url(#t${id})`} />
          <path d="M44 52 C44 48 48 46 50 46 L48 102 C44 102 42 99 42 96 Z" fill="#fff" opacity="0.22" />
          <rect x="44" y="70" width="32" height="24" rx="4" fill="#11171a" opacity="0.85" />
          <text x="60" y="85" textAnchor="middle" fontSize="7" fontWeight="800" fill={c} fontFamily="Manrope Variable, sans-serif">2 L</text>
          {/* горловина и помпа */}
          <rect x="50" y="34" width="20" height="10" rx="3" fill="#13191c" />
          <rect x="56" y="12" width="8" height="24" rx="2" fill={`url(#k${id})`} />
          <rect x="48" y="8" width="24" height="7" rx="3.5" fill={c} />
          {/* рукоятка и курок */}
          <path d="M70 36 h16 c6 0 10 4 10 10 v6 h-8 v-4 c0-3-2-4-4-4 H70z" fill={`url(#k${id})`} />
          <path d="M86 52 c3 6 4 12 2 18 l-5 -1 c1-5 0-10-3-14z" fill="#151c20" />
          {/* удочка */}
          <path d="M50 38 L14 30" stroke="#1a2226" strokeWidth="4" strokeLinecap="round" />
          <path d="M14 30 L6 28" stroke={c} strokeWidth="4" strokeLinecap="round" />
        </>
      );
      break;
    case 'foam_generator':
      body = (
        <>
          <path d="M40 58 C40 50 46 47 60 47 C74 47 80 50 80 58 L82 98 C82 104 77 108 70 108 H50 C43 108 38 104 38 98 Z" fill={`url(#w${id})`} opacity="0.92" />
          <path d="M46 54 L44 100" stroke="#fff" strokeWidth="5" opacity="0.5" strokeLinecap="round" />
          <rect x="40" y="88" width="40" height="18" rx="6" fill={c} opacity="0.18" />
          <rect x="50" y="38" width="20" height="11" rx="3" fill="#12181b" />
          <rect x="44" y="26" width="34" height="14" rx="5" fill={`url(#k${id})`} />
          <rect x="54" y="10" width="10" height="18" rx="3" fill="#12181b" />
          <rect x="50" y="6" width="18" height="6" rx="3" fill="#1d262b" />
          <path d="M44 30 H24 c-3 0-4 2-4 4 v4 h24z" fill="#161d21" />
          <rect x="12" y="30" width="12" height="9" rx="3" fill={c} />
          <path d="M78 30 h8 c4 0 6 3 6 7 l-2 26 h-8 l1-22 h-5z" fill={`url(#k${id})`} />
        </>
      );
      break;
    case 'foam_lance':
      body = (
        <>
          <path d="M44 62 C44 56 50 54 60 54 C70 54 76 56 76 62 L78 100 C78 105 74 108 68 108 H52 C46 108 42 105 42 100 Z" fill={`url(#w${id})`} opacity="0.75" />
          <rect x="43" y="80" width="34" height="26" rx="5" fill={c} opacity="0.35" />
          <rect x="52" y="44" width="16" height="12" rx="3" fill="#12181b" />
          <rect x="24" y="30" width="62" height="16" rx="6" fill={`url(#k${id})`} />
          <rect x="84" y="33" width="20" height="10" rx="3" fill="#c49a3a" />
          <rect x="8" y="33" width="18" height="10" rx="3" fill="#2a3439" />
          <circle cx="56" cy="38" r="5" fill={c} />
          <rect x="54" y="18" width="5" height="14" rx="2" fill="#1d262b" />
        </>
      );
      break;
    case 'bucket':
      body = (
        <>
          <path d="M26 40 h68 l-7 62 c-1 5-5 8-10 8 H43 c-5 0-9-3-10-8 z" fill={`url(#k${id})`} />
          <ellipse cx="60" cy="40" rx="34" ry="8" fill="#1a2226" stroke="#2f3a40" />
          <ellipse cx="60" cy="41" rx="29" ry="5.5" fill={c} opacity="0.25" />
          <path d="M28 46 h64" stroke="#34424a" strokeWidth="2" />
          <path d="M26 42 C26 14 94 14 94 42" fill="none" stroke="#3a464c" strokeWidth="2.5" />
          <text x="60" y="78" textAnchor="middle" fontSize="9" fontWeight="800" fill="#e8f0f2" fontFamily="Unbounded, sans-serif" letterSpacing="0.5">
            WASH<tspan fill={c}>FLOW</tspan>
          </text>
          <path d="M33 50 L40 102" stroke="#fff" strokeWidth="3" opacity="0.08" />
        </>
      );
      break;
    case 'trigger':
      body = (
        <>
          <path d="M44 50 h28 l4 10 v40 c0 5-4 8-9 8 H49 c-5 0-9-3-9-8 V60z" fill={`url(#t${id})`} opacity="0.9" />
          <rect x="46" y="66" width="26" height="26" rx="4" fill="#11171a" opacity="0.85" />
          <rect x="50" y="40" width="18" height="12" rx="3" fill="#12181b" />
          <path d="M44 22 h36 l4 8 h-8 v10 H48 c-6 0-10-4-10-9 z" fill={`url(#k${id})`} />
          <path d="M60 40 c-4 6-6 10-10 12" stroke="#171e22" strokeWidth="5" strokeLinecap="round" />
          <rect x="84" y="26" width="8" height="5" rx="2" fill={c} />
        </>
      );
      break;
    case 'bottle_trigger':
      body = (
        <>
          {/* оригинальный флакон с дисперсионным триггером */}
          <rect x="42" y="52" width="36" height="56" rx="8" fill={`url(#k${id})`} stroke="rgba(255,255,255,0.08)" />
          <rect x="42" y="56" width="36" height="9" fill={c} opacity="0.85" />
          <rect x="42" y="96" width="36" height="10" rx="4" fill={c} opacity="0.7" />
          <rect x="46" y="68" width="28" height="24" rx="3" fill="#0a0e10" />
          <rect x="52" y="74" width="16" height="2" rx="1" fill="#cfd8dc" />
          <rect x="49" y="80" width="22" height="3" rx="1.5" fill="#fff" />
          <rect x="54" y="86" width="12" height="1.5" rx="0.75" fill={c} />
          <rect x="45" y="56" width="4" height="48" rx="2" fill="#fff" opacity="0.12" />
          <rect x="52" y="42" width="16" height="11" rx="2" fill="#1d262b" />
          <path d="M46 22 h30 l6 7 h-6 v12 H50 c-5 0-8-4-8-9 z" fill="#f2f6f7" />
          <path d="M60 41 c-3 5-5 9-9 11" stroke="#d7dee0" strokeWidth="5" strokeLinecap="round" />
          <rect x="82" y="26" width="7" height="4" rx="2" fill={c} />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={95 + i * 5} cy={27 + (i - 1) * 3} r={1.6 - i * 0.3} fill={c} opacity={0.8 - i * 0.2} />
          ))}
        </>
      );
      break;
    case 'hpw_injector':
      body = (
        <>
          <rect x="34" y="40" width="52" height="64" rx="12" fill={`url(#k${id})`} />
          <rect x="40" y="56" width="40" height="40" rx="8" fill={c} opacity="0.3" />
          <rect x="50" y="30" width="20" height="12" rx="4" fill="#1d262b" />
        </>
      );
      break;
    default:
      body = (
        <>
          {/* варежка */}
          <path d="M34 106 V58 c0-18 10-32 26-32 s26 14 26 32 v48z" fill="#1f5f77" />
          {Array.from({ length: 30 }).map((_, i) => (
            <circle key={i} cx={38 + (i % 6) * 9 + ((i / 6) % 2) * 4} cy={44 + Math.floor(i / 6) * 12} r="5.5" fill={i % 2 ? '#2a7d9b' : '#246b85'} />
          ))}
          <rect x="32" y="98" width="56" height="12" rx="4" fill="#0f2a33" />
        </>
      );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      {glow}
      {body}
    </svg>
  );
}

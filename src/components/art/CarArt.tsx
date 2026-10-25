import { useId } from 'react';

/** Стилизованный седан в профиль: тёмный глянец с бирюзовым контровым светом. */
export function CarArt({ width = 300, color = '#14191c', wet = false }: { width?: number; color?: string; wet?: boolean }) {
  const id = useId().replace(/:/g, '');
  const body =
    'M14 96 C12 84 20 76 36 74 L84 68 C104 52 128 40 158 38 L200 38 C226 39 246 50 266 66 L292 72 C306 75 312 82 312 92 L312 100 C312 103 310 105 307 105 L274 105 A24 24 0 0 0 226 105 L100 105 A24 24 0 0 0 52 105 L20 105 C16 105 14 102 14 96 Z';
  return (
    <svg width={width} height={(width * 135) / 326} viewBox="0 0 326 135" aria-hidden="true">
      <defs>
        <linearGradient id={`paint${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a4a51" />
          <stop offset="0.28" stopColor={color} />
          <stop offset="0.55" stopColor="#0a0e10" />
          <stop offset="0.62" stopColor="#2a363c" />
          <stop offset="1" stopColor="#07090b" />
        </linearGradient>
        <linearGradient id={`glass${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3d5862" />
          <stop offset="0.5" stopColor="#0d171b" />
          <stop offset="1" stopColor="#1c2c32" />
        </linearGradient>
        <linearGradient id={`rim${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#33e3d4" stopOpacity="0" />
          <stop offset="0.5" stopColor="#33e3d4" stopOpacity="0.9" />
          <stop offset="1" stopColor="#33e3d4" stopOpacity="0.1" />
        </linearGradient>
        <radialGradient id={`floor${id}`}>
          <stop offset="0" stopColor="#33e3d4" stopOpacity="0.28" />
          <stop offset="1" stopColor="#33e3d4" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`wheel${id}`}>
          <stop offset="0" stopColor="#4a565b" />
          <stop offset="0.55" stopColor="#1b2226" />
          <stop offset="0.62" stopColor="#050607" />
        </radialGradient>
      </defs>
      <ellipse cx="163" cy="124" rx="160" ry="10" fill={`url(#floor${id})`} />
      <ellipse cx="163" cy="122" rx="140" ry="4" fill="#000" opacity="0.6" />
      <path d={body} fill={`url(#paint${id})`} />
      {/* стёкла */}
      <path d="M102 68 C118 54 136 46 160 44 L174 44 L172 68 Z" fill={`url(#glass${id})`} />
      <path d="M180 44 L198 44 C220 45 236 54 252 68 L178 68 Z" fill={`url(#glass${id})`} />
      <path d="M120 60 C132 52 142 48 156 47" stroke="#fff" strokeOpacity="0.18" strokeWidth="2" fill="none" />
      {/* линии кузова */}
      <path d="M40 84 C120 80 220 80 300 84" stroke="#fff" strokeOpacity="0.07" strokeWidth="1.2" fill="none" />
      <path d="M176 70 L176 100" stroke="#000" strokeOpacity="0.5" />
      <path d="M110 70 L110 100" stroke="#000" strokeOpacity="0.35" />
      <rect x="190" y="76" width="12" height="2.5" rx="1.2" fill="#9aa8ad" opacity="0.5" />
      <rect x="124" y="76" width="12" height="2.5" rx="1.2" fill="#9aa8ad" opacity="0.5" />
      {/* контровой свет */}
      <path d="M36 74 L84 68 C104 52 128 40 158 38 L200 38 C226 39 246 50 266 66 L292 72" stroke={`url(#rim${id})`} strokeWidth="1.6" fill="none" />
      {/* фары */}
      <path d="M288 76 L306 80 C307 84 304 86 300 86 L286 82 Z" fill="#e9fbff" />
      <path d="M288 76 L306 80" stroke="#33e3d4" strokeWidth="1.5" />
      <path d="M16 82 L30 80 L30 86 L17 88 Z" fill="#ff3b5c" opacity="0.9" />
      {/* колёса */}
      {[76, 250].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="105" r="21" fill={`url(#wheel${id})`} />
          <circle cx={cx} cy="105" r="13" fill="#11171a" stroke="#56646a" strokeWidth="1.5" />
          {[0, 72, 144, 216, 288].map((a) => (
            <path
              key={a}
              d={`M${cx} 105 L${cx + 12 * Math.cos((a * Math.PI) / 180)} ${105 + 12 * Math.sin((a * Math.PI) / 180)}`}
              stroke="#7f8d92"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ))}
          <circle cx={cx} cy="105" r="3" fill="#33e3d4" opacity="0.8" />
        </g>
      ))}
      {wet &&
        Array.from({ length: 26 }).map((_, i) => (
          <circle
            key={i}
            cx={60 + ((i * 37) % 230)}
            cy={48 + ((i * 23) % 44)}
            r={0.8 + (i % 3) * 0.5}
            fill="#dff"
            opacity={0.35 + (i % 4) * 0.12}
          />
        ))}
    </svg>
  );
}

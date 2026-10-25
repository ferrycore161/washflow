/**
 * Генерация иконок PWA из assets/icon-source.png (квадрат, фон до краёв, без прозрачности).
 *   npm run icons
 * Символ должен помещаться в центральные ~75% — тогда тот же файл годится и как maskable.
 */
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const src = 'data:image/png;base64,' + readFileSync('assets/icon-source.png').toString('base64');
const sizes: [string, number][] = [
  ['icon-1024.png', 1024],
  ['icon-512.png', 512],
  ['icon-maskable-512.png', 512],
  ['icon-192.png', 192],
  ['apple-touch-icon.png', 180],
  ['favicon-48.png', 48],
  ['favicon-32.png', 32],
];
const browser = await chromium.launch();
for (const [name, size] of sizes) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<body style="margin:0"><img src="${src}" style="width:${size}px;height:${size}px;object-fit:cover;display:block"></body>`);
  await page.locator('img').evaluate((img: HTMLImageElement) => img.decode());
  await page.screenshot({ path: `public/icons/${name}` });
  await page.close();
  console.log('✓', name);
}
await browser.close();

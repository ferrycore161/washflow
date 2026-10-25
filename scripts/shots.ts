/**
 * Скриншоты экранов в мобильном вьюпорте (iPhone 14: 390×844 @2x).
 *   npx tsx scripts/shots.ts http://localhost:5173 ./shots
 */
import { chromium, devices } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5173';
const out = process.argv[3] ?? 'shots';
const only = process.argv[4];
mkdirSync(out, { recursive: true });

const routes: [string, string, ((p: import('@playwright/test').Page) => Promise<void>)?][] = [
  ['01-home', '/#/'],
  ['02-wash-setup', '/#/wash'],
  ['03-equipment', '/#/equipment'],
  ['04-chemistry', '/#/chemistry'],
  ['05-catalog', '/#/catalog'],
  [
    '06-run-prepare',
    '/#/wash',
    async (p) => {
      await p.getByTestId('begin-scenario').click();
      await p.getByTestId('next-step').click();
    },
  ],
  ['07-product', '/#/product/shine-systems-delicatewash'],
  ['08-equipment-form', '/#/equipment/new'],
  ['09-profile', '/#/profile'],
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 14'], locale: 'ru-RU' });
const page = await ctx.newPage();
await page.goto(base + '/#/welcome');
await page.getByTestId('welcome-demo').click();
for (const [name, path, act] of routes) {
  if (only && !name.includes(only)) continue;
  await page.goto(base + path);
  await page.waitForTimeout(400);
  if (act) await act(page);
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(out, `${name}.png`), fullPage: true });
  console.log('✓', name);
}
await browser.close();

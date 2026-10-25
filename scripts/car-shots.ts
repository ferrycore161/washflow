/** Скриншоты автомобилей в интерфейсе (iPhone 14): главная, выбор, ключевые модели, смена цвета. */
import { chromium, devices } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5173';
const out = process.argv[3] ?? 'shots';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 14'], locale: 'ru-RU' });
const p = await ctx.newPage();
await p.goto(base + '/#/welcome');
await p.getByTestId('welcome-demo').click();
await p.waitForTimeout(1200);
await p.screenshot({ path: join(out, 'home.png') });

const openModel = async (q: string) => {
  await p.goto(base + '/#/car');
  await p.getByTestId('car-search').fill(q);
  await p.locator('.car-result').first().click();
  await p.waitForTimeout(1200);
};
await p.goto(base + '/#/car');
await p.waitForTimeout(1200);
await p.screenshot({ path: join(out, 'car-screen.png') });
for (const [q, f] of [
  ['mazda 6', 'k-mazda6.png'],
  ['seltos', 'k-seltos.png'],
  ['camry', 'k-camry.png'],
  ['kia rio', 'k-rio.png'],
  ['vesta', 'k-vesta.png'],
  ['polo', 'k-polo-fallback.png'],
]) {
  await openModel(q);
  await p.locator('.car-stage').screenshot({ path: join(out, f) });
}

// смена цвета у Mazda 6 и сохранение
await openModel('mazda 6');
await p.getByRole('radio', { name: 'Красный' }).click();
await p.waitForTimeout(1200);
await p.locator('.car-stage').screenshot({ path: join(out, 'k-mazda6-red.png') });
await p.getByRole('radio', { name: 'Белый' }).click();
await p.waitForTimeout(1200);
await p.locator('.car-stage').screenshot({ path: join(out, 'k-mazda6-white.png') });
await p.getByTestId('car-save').click();
await p.waitForTimeout(1500);
await p.screenshot({ path: join(out, 'home-white.png') });
await browser.close();
console.log('ok');

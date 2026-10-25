/**
 * Автоматический аудит мобильной вёрстки.
 *   npx tsx scripts/ui-audit.ts http://localhost:5173 <outdir> [--shots]
 * Для каждого экрана и ширины (375 / 390 / 430) проверяет:
 *  - горизонтальное переполнение документа;
 *  - элементы, выходящие за края экрана (кроме намеренно прокручиваемых лент .chips/.h-scroll);
 *  - текст, перекрытый изображениями (img/svg) других блоков;
 *  - элементы, перекрытые фиксированной нижней навигацией в конце прокрутки.
 * Код выхода 1, если найдены проблемы.
 */
import { chromium, devices, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5173';
const out = process.argv[3] ?? 'audit';
const shots = process.argv.includes('--shots');
mkdirSync(out, { recursive: true });

const SIZES = [
  { name: '375', width: 375, height: 667 }, // iPhone SE / mini
  { name: '390', width: 390, height: 844 }, // iPhone 14/15
  { name: '430', width: 430, height: 932 }, // iPhone Pro Max / Plus
];

type Act = (p: Page) => Promise<void>;
const ROUTES: [string, string, Act?][] = [
  ['home', '/#/'],
  ['chemistry', '/#/chemistry'],
  ['chemistry-menu', '/#/chemistry', async (p) => { await p.getByRole('button', { name: /^Действия:/ }).first().click(); }],
  ['catalog', '/#/catalog'],
  ['catalog-add', '/#/catalog', async (p) => { await p.getByTestId('catalog-add').first().click(); }],
  ['catalog-brands', '/#/catalog', async (p) => { await p.getByRole('button', { name: /Все бренды/ }).click(); }],
  ['product', '/#/product/shine-systems-delicatewash'],
  ['product-new', '/#/product/new'],
  ['equipment', '/#/equipment'],
  ['equipment-menu', '/#/equipment', async (p) => { await p.getByRole('button', { name: /^Действия:/ }).first().click(); }],
  ['equipment-new', '/#/equipment/new'],
  ['equipment-bottle', '/#/equipment/new?type=bottle_trigger'],
  ['shop', '/#/shop'],
  ['shop-open', '/#/shop?need=iron,wheels,drying'],
  ['car', '/#/car'],
  ['car-search', '/#/car', async (p) => { await p.getByTestId('car-search').fill('toyota'); }],
  ['wash', '/#/wash'],
  ['wash-iron', '/#/wash', async (p) => { await p.getByRole('radio', { name: /С Iron/ }).click(); }],
  ['run-prepare', '/#/wash', async (p) => { await p.getByTestId('begin-scenario').click(); await p.getByTestId('next-step').click(); }],
  ['run-dwell', '/#/wash', async (p) => {
    await p.getByTestId('begin-scenario').click();
    for (let i = 0; i < 12 && (await p.getByTestId('timer-start').count()) === 0; i++) await p.getByTestId('next-step').click();
  }],
  ['run-bottle', '/#/wash', async (p) => {
    await p.getByRole('radio', { name: /С защитой/ }).click();
    await p.getByTestId('begin-scenario').click();
    for (let i = 0; i < 30 && (await p.getByTestId('dose-consumption').count()) === 0; i++) await p.getByTestId('next-step').click();
  }],
  ['run-steps-sheet', '/#/wash', async (p) => { await p.getByTestId('begin-scenario').click(); await p.getByRole('button', { name: 'Все этапы' }).click(); }],
  ['done', '/#/wash', async (p) => { await p.getByTestId('begin-scenario').click(); await p.getByRole('button', { name: 'Все этапы' }).click(); await p.getByRole('button', { name: /Завершить мойку сейчас/ }).click(); }],
  ['profile', '/#/profile'],
  ['profile-confirm', '/#/profile', async (p) => { await p.getByTestId('load-demo').click(); }],
];

async function audit(p: Page) {
  return p.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const issues: string[] = [];
    const desc = (el: Element) => {
      const t = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
      return `${el.tagName.toLowerCase()}.${(el.getAttribute('class') ?? '').split(' ').slice(0, 2).join('.')}${t ? ` «${t}»` : ''}`;
    };
    if (document.documentElement.scrollWidth > vw + 1) issues.push(`горизонтальное переполнение документа: ${document.documentElement.scrollWidth} > ${vw}`);

    const inScroller = (el: Element) => !!el.closest('.chips, .h-scroll, .car-popular-scroll');
    // намеренно обрезают содержимое только эти блоки (фото/декор внутри карточек);
    // корневые контейнеры (.app, .screen) — не в счёт: их overflow:hidden маскирует ошибки вёрстки
    const CLIPPERS = '.car-card, .car-stage, .chem-card, .need, .product-photo, .shop-art, .mix, .tabbar, .sheet, .car-pop, .car-result-art';
    const clipped = (el: Element) => {
      const c = el.parentElement?.closest(CLIPPERS);
      if (!c) return false;
      const r = c.getBoundingClientRect();
      return r.right <= vw + 1 && r.left >= -1;
    };
    const all = [...document.querySelectorAll('body *')];
    for (const el of all) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || cs.position === 'fixed') continue;
      if (inScroller(el) || clipped(el)) continue;
      if (r.right > vw + 1 || r.left < -1) issues.push(`за краем экрана (${Math.round(r.left)}…${Math.round(r.right)}): ${desc(el)}`);
    }

    // текст, перекрытый изображением другого блока
    const textEls = all.filter((el) => {
      if (!(el instanceof HTMLElement)) return false;
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim().length > 1);
      // текст фиксированной навигации поверх прокручиваемого контента — норма для полупрозрачной панели
      return own && el.offsetParent !== null && !el.closest('.tabbar');
    });
    const imgs = all.filter((el) => (el.tagName === 'IMG' || el.tagName === 'svg') && el.getBoundingClientRect().width > 60);
    for (const t of textEls) {
      const tr = t.getBoundingClientRect();
      for (const im of imgs) {
        if (im.contains(t) || t.contains(im)) continue;
        if (im.closest('.sheet-backdrop') !== t.closest('.sheet-backdrop')) continue;
        const ir = im.getBoundingClientRect();
        const x = Math.min(tr.right, ir.right) - Math.max(tr.left, ir.left);
        const y = Math.min(tr.bottom, ir.bottom) - Math.max(tr.top, ir.top);
        // намеренно: декоративная машина за заголовком сценария и кольцо таймера вокруг цифр
        if (x > 8 && y > 6 && !im.closest('.wash-hero-art') && !im.closest('.timer'))
          issues.push(`изображение накладывается на текст: ${desc(t)} ← ${desc(im)}`);
      }
    }

    // в конце прокрутки ничего интерактивного не должно оставаться под нижней навигацией
    const tab = document.querySelector('.tabbar-inner');
    if (tab) {
      window.scrollTo(0, document.documentElement.scrollHeight);
      const tr = tab.getBoundingClientRect();
      for (const el of document.querySelectorAll('.screen button, .screen a, .screen input')) {
        const r = el.getBoundingClientRect();
        if (!r.height || el.closest('.tabbar')) continue;
        if (r.bottom > tr.top + 4 && r.top < vh && r.bottom <= vh + 1) issues.push(`под навигацией в конце страницы: ${desc(el)}`);
      }
    }
    return [...new Set(issues)];
  });
}

const browser = await chromium.launch();
let total = 0;
for (const size of SIZES) {
  const ctx = await browser.newContext({
    ...devices['iPhone 14'],
    viewport: { width: size.width, height: size.height },
    screen: { width: size.width, height: size.height },
    locale: 'ru-RU',
  });
  await ctx.addInitScript('window.__name = (f) => f');
  const p = await ctx.newPage();
  await p.goto(base + '/#/welcome');
  await p.getByTestId('welcome-demo').click();
  await p.waitForTimeout(500);
  for (const [name, path, act] of ROUTES) {
    await p.goto(base + '/#/');
    await p.goto(base + path);
    await p.waitForTimeout(450);
    try {
      if (act) await act(p);
    } catch (e) {
      console.log(`  ! ${size.name} ${name}: не удалось выполнить действие (${(e as Error).message.split('\n')[0]})`);
    }
    await p.waitForTimeout(650);
    const issues = await audit(p);
    if (shots) await p.screenshot({ path: join(out, `${size.name}-${name}.png`), fullPage: !name.includes('menu') && !name.includes('sheet') && !name.includes('confirm') && !name.includes('add') && !name.includes('brands') });
    if (issues.length) {
      total += issues.length;
      console.log(`✗ ${size.name} ${name}`);
      for (const i of issues.slice(0, 12)) console.log('    ' + i);
      if (issues.length > 12) console.log(`    … ещё ${issues.length - 12}`);
    } else console.log(`✓ ${size.name} ${name}`);
  }
  await ctx.close();
}
await browser.close();
console.log(total ? `Найдено проблем: ${total}` : 'Проблем не найдено');
process.exit(total ? 1 : 0);

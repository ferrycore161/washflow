import { expect, test, type Page } from '@playwright/test';

async function loadDemo(page: Page) {
  await page.goto('/#/welcome');
  await page.getByTestId('welcome-demo').click();
  await expect(page.getByText('Mazda 6')).toBeVisible();
}

test('первый запуск: приветствие и демо-профиль', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/#\/welcome/);
  await loadDemo(page);
  await expect(page.getByText('Marolex Industry Ergo')).toBeVisible();
  await expect(page.getByText('CherryBomb').first()).toBeVisible();
  // текст с макетов в приложение не попадает
  await expect(page.getByText(/Валентина/)).toHaveCount(0);
});

test('добавление оборудования сохраняется после перезагрузки', async ({ page }) => {
  await page.goto('/#/welcome');
  await page.getByTestId('welcome-start').click();
  await expect(page).toHaveURL(/#\/equipment\/new/);
  await page.getByRole('radio', { name: 'Ведро' }).click();
  await page.getByRole('textbox', { name: 'Название' }).fill('Ведро с сепаратором');
  await page.getByTestId('save-equipment').click();
  await page.goto('/#/equipment');
  await expect(page.getByText('Ведро с сепаратором')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Ведро с сепаратором')).toBeVisible();
});

test('каталог: поиск по бренду и добавление в мою химию', async ({ page }) => {
  await loadDemo(page);
  await page.goto('/#/catalog');
  const items = page.getByTestId('catalog-item');
  const total = await items.count();
  test.skip(total === 0, 'встроенный каталог пуст');
  await page.getByTestId('catalog-search').fill('koch');
  const found = await items.count();
  if (found > 0) {
    await expect(items.first()).toContainText(/Koch/i);
  }
  await page.getByTestId('catalog-search').fill('');
  const before = await page.goto('/#/chemistry').then(() => page.getByTestId('owned-chem').count());
  await page.goto('/#/catalog');
  await page.getByTestId('catalog-add').first().click();
  await page.getByTestId('confirm-add-chem').click();
  await page.goto('/#/chemistry');
  await expect(page.getByTestId('owned-chem')).toHaveCount(before + 1);
});

test('мойка: сценарий, шаги вперёд/назад, завершение и списание расхода', async ({ page }) => {
  await loadDemo(page);
  await page.getByTestId('start-wash').click();
  await expect(page.getByTestId('scenario-title')).toBeVisible();
  await page.getByTestId('begin-scenario').click();
  const counter = page.getByTestId('step-counter');
  await expect(counter).toContainText('Этап 1 из');
  const total = Number((await counter.textContent())!.match(/из (\d+)/)![1]);

  await page.getByTestId('next-step').click();
  await expect(counter).toContainText('Этап 2 из');
  await page.getByTestId('prev-step').click();
  await expect(counter).toContainText('Этап 1 из');

  // прогресс переживает перезагрузку
  await page.getByTestId('next-step').click();
  await page.reload();
  await expect(counter).toContainText('Этап 2 из');

  for (let i = 2; i <= total; i++) {
    // если на шаге есть дозировка — это целые миллилитры
    const chem = page.getByTestId('dose-chem');
    if (await chem.count()) await expect(chem).toHaveText(/^\d[\d\s]* мл$/);
    await page.getByTestId('next-step').click();
  }
  await expect(page).toHaveURL(/#\/wash\/done/);
  await page.getByTestId('finish-wash').click();
  await expect(page.getByText('Машина чистая!')).toBeVisible();
});

test('обязательные шаги смыва нельзя пропустить', async ({ page }) => {
  await loadDemo(page);
  await page.goto('/#/wash');
  await page.getByTestId('begin-scenario').click();
  const counter = page.getByTestId('step-counter');
  const total = Number((await counter.textContent())!.match(/из (\d+)/)![1]);
  let sawMandatory = false;
  for (let i = 1; i < total; i++) {
    const title = await page.getByTestId('step-title').textContent();
    if (title?.includes('Смой водой')) {
      await expect(page.getByTestId('skip-step')).toBeDisabled();
      sawMandatory = true;
    }
    await page.getByTestId('next-step').click();
  }
  expect(sawMandatory).toBe(true);
});

test('офлайн: после первой загрузки приложение открывается без сети', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Мойка без калькулятора')).toBeVisible();
  await page.getByTestId('welcome-demo').click();
  await expect(page.getByText('Mazda 6')).toBeVisible();
  await context.setOffline(false);
});

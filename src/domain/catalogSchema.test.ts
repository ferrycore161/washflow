import { extractConsumption, parseCatalogImport } from './catalogSchema';

const make = () => ({
  brand: 'Test',
  products: [
    {
      id: 'test-a',
      name: 'A',
      category: 'prewash',
      status: 'verified',
      applications: [
        {
          method: 'sprayer',
          dilution: { kind: 'ratio', from: 50, to: 100 } as Record<string, unknown>,
          dilutionText: '1:50–1:100',
          sourceUrl: 'https://example.test' as string | undefined,
          checkedAt: '2026-10-25',
        },
      ],
    },
  ],
});

describe('схема каталога', () => {
  it('принимает корректный файл и ставит значения по умолчанию', () => {
    const r = parseCatalogImport(make());
    expect(r.errors).toEqual([]);
    expect(r.products[0].applications[0].dilution).toMatchObject({ ratioBasis: 'water' });
  });
  it('отклоняет verified без методики', () => {
    const f = make();
    f.products[0].applications = [];
    expect(parseCatalogImport(f).errors.length).toBeGreaterThan(0);
  });
  it('отклоняет unverified с дозировками (нельзя выдавать непроверенное за рецепт)', () => {
    const f = make();
    f.products[0].status = 'unverified';
    expect(parseCatalogImport(f).errors.length).toBeGreaterThan(0);
  });
  it('отклоняет методику без источника', () => {
    const f = make();
    delete f.products[0].applications[0].sourceUrl;
    expect(parseCatalogImport(f).errors.length).toBeGreaterThan(0);
  });
  it('отклоняет проценты больше 100', () => {
    const f = make();
    f.products[0].applications[0].dilution = { kind: 'percent', from: 150, to: 150 };
    expect(parseCatalogImport(f).errors.length).toBeGreaterThan(0);
  });
});

describe('extractConsumption', () => {
  it('извлекает расход на машину из текста источника', () => {
    expect(extractConsumption(['Нанести 50–100 мл состава на автомобиль'])).toEqual({ from: 50, to: 100 });
    expect(extractConsumption(['Расход 30 мл'])).toEqual({ from: 30, to: 30 });
    expect(extractConsumption(['Смыть водой'])).toBeUndefined();
  });
});

import { analyzeNeeds, compatibility, shopLinks } from './shopping';
import { ALL, IRON, P1, P2, PROT, QUARTZ_READY, bottleTrigger, bucket, own, sprayer } from './fixtures';

describe('анализ покупок', () => {
  it('отмечает закрытые этапы и рекомендует недостающие', () => {
    const needs = analyzeNeeds({ products: ALL, owned: [own(P1.id)], equipment: [sprayer], offers: [] });
    const byId = Object.fromEntries(needs.map((n) => [n.def.id, n]));
    expect(byId.phase1.covered).toBe(true);
    expect(byId.phase2.covered).toBe(false);
    expect(byId.phase2.recommendations.map((p) => p.id)).toContain(P2.id);
    expect(byId.iron.recommendations.map((p) => p.id)).toEqual([IRON.id]);
    // уже купленное не рекомендуется повторно
    expect(byId.phase1.recommendations.map((p) => p.id)).not.toContain(P1.id);
  });

  it('пустая упаковка не считается закрытым этапом', () => {
    const needs = analyzeNeeds({ products: ALL, owned: [{ ...own(P1.id), remainingMl: 0 }], equipment: [], offers: [] });
    expect(needs.find((n) => n.def.id === 'phase1')!.covered).toBe(false);
  });

  it('непроверенные карточки не рекомендуются', () => {
    const needs = analyzeNeeds({ products: ALL, owned: [], equipment: [], offers: [] });
    expect(needs.flatMap((n) => n.recommendations).some((p) => p.status !== 'verified')).toBe(false);
  });

  it('совместимые с оборудованием — первыми', () => {
    const needs = analyzeNeeds({ products: ALL, owned: [], equipment: [sprayer], offers: [] });
    const prot = needs.find((n) => n.def.id === 'protection')!;
    expect(compatibility(prot.recommendations[0], [sprayer]).equipment.length).toBeGreaterThan(0);
  });
});

describe('совместимость', () => {
  it('распылитель на флакон подходит только готовым составам', () => {
    const free = { ...bottleTrigger, productId: undefined };
    expect(compatibility(QUARTZ_READY, [free]).equipment).toHaveLength(1);
    expect(compatibility(PROT, [free]).equipment).toHaveLength(0);
    expect(compatibility(P2, [bucket]).missingMethods).toEqual(['sprayer']);
  });
});

describe('ссылки на магазины', () => {
  it('прямые проверенные ссылки первыми, остальное — поиск по названию', () => {
    const links = shopLinks('Shine Systems FastQuartz', [
      { store: 'ozon', url: 'https://www.ozon.ru/product/x-1/', title: '', checkedAt: '2026-10-25' },
    ], 'https://shinesystems.ru/product/abc');
    expect(links[0]).toMatchObject({ store: 'ozon', direct: true });
    expect(links.find((l) => l.store === 'official')?.direct).toBe(true);
    const wb = links.find((l) => l.store === 'wildberries')!;
    expect(wb.direct).toBe(false);
    expect(wb.url).toContain(encodeURIComponent('Shine Systems FastQuartz'));
    expect(links.filter((l) => l.store === 'ozon')).toHaveLength(1);
  });
});

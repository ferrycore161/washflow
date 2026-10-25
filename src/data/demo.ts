import { BUNDLED_PRODUCTS } from '../store/catalog';
import { useStore, uid } from '../store/useStore';
import type { Product } from '../domain/types';

/**
 * Демонстрационный профиль для проверки: Mazda 6, Marolex 2 л,
 * Shine Systems DelicateWash / CherryBomb / FastQuartz.
 * Дозировки берутся только из каталога. Если у карточки нет подтверждённой
 * методики, создаётся демо-заглушка БЕЗ дозировок — рецепт не выводится.
 */
export const DEMO_PRODUCTS: { id: string; name: string; category: Product['category']; subtitle: string; pkg: number }[] = [
  { id: 'shine-systems-delicatewash', name: 'DelicateWash', category: 'prewash', subtitle: 'Шампунь для бесконтактной мойки', pkg: 750 },
  { id: 'shine-systems-cherrybomb', name: 'CherryBomb', category: 'contact_shampoo', subtitle: 'Шампунь для ручной мойки', pkg: 750 },
  { id: 'shine-systems-fastquartz', name: 'FastQuartz', category: 'protection', subtitle: 'Кварцевое покрытие', pkg: 750 },
];

export function loadDemoProfile() {
  const s = useStore.getState();
  s.resetAll();
  const st = useStore.getState();
  st.setCar({ make: 'Mazda', model: '6', body: 'sedan', years: '2012–2018 (GJ)', engine: '2.5 л', color: 'Чёрный' });
  st.upsertEquipment({
    id: uid(),
    type: 'sprayer',
    name: 'Marolex Industry Ergo',
    volumeMl: 2000,
    fillMl: 1500,
    isDefault: true,
    createdAt: Date.now(),
  });
  const placeholders: Product[] = [];
  for (const d of DEMO_PRODUCTS) {
    const real = BUNDLED_PRODUCTS.find((p) => p.id === d.id);
    if (!real) {
      placeholders.push({
        id: d.id,
        brand: 'Shine Systems',
        name: d.name,
        subtitle: d.subtitle,
        aliases: [],
        category: d.category,
        phase: d.category === 'prewash' ? 1 : d.category === 'contact_shampoo' ? 2 : null,
        ph: null,
        packages: [d.pkg],
        applications: [],
        warnings: [],
        status: 'demo',
      });
    }
    const pkg = real?.packages.includes(d.pkg) ? d.pkg : real?.packages[0] ?? d.pkg;
    st.addOwned(d.id, pkg, pkg);
  }
  if (placeholders.length) st.upsertProducts(placeholders);
  st.setOnboarded(true);
}

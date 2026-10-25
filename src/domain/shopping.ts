import { EQUIPMENT_META, METHOD_LABEL } from './equipment';
import type { AccessoryKind, Offer, ShopData, Store } from './shopSchema';
import type { ApplicationMethod, Equipment, OwnedChemical, Product, ProductCategory } from './types';

/** Назначение покупки = этап мойки, который она закрывает. */
export type NeedId = 'phase1' | 'phase2' | 'wheels' | 'iron' | 'protection' | 'drying';

export interface NeedDef {
  id: NeedId;
  title: string;
  stage: string;
  why: string;
  categories: ProductCategory[];
  accessoryKinds: AccessoryKind[];
  /** Без этого этапа полноценная мойка невозможна. */
  essential: boolean;
}

export const NEEDS: NeedDef[] = [
  {
    id: 'phase1',
    title: 'Первая фаза',
    stage: 'Бесконтактная предмойка',
    why: 'Размягчает и снимает основную грязь и песок до касания варежкой — главный способ не поцарапать лак.',
    categories: ['prewash', 'active_foam'],
    accessoryKinds: [],
    essential: true,
  },
  {
    id: 'phase2',
    title: 'Вторая фаза',
    stage: 'Ручная мойка',
    why: 'Шампунь для варежки удаляет тонкую дорожную плёнку, которую бесконтактная химия не снимает.',
    categories: ['contact_shampoo', 'universal_shampoo'],
    accessoryKinds: ['wash_mitt', 'grit_guard'],
    essential: true,
  },
  {
    id: 'wheels',
    title: 'Очистка дисков',
    stage: 'Диски и шины',
    why: 'Тормозная пыль и дорожный налёт на дисках требуют отдельного состава; диски моют до кузова и отдельной щёткой.',
    categories: ['wheel_cleaner'],
    accessoryKinds: ['wheel_brush'],
    essential: false,
  },
  {
    id: 'iron',
    title: 'Металлические вкрапления',
    stage: 'Iron — после мойки, перед защитой',
    why: 'Iron растворяет въевшиеся частицы металла (тормозная и промышленная пыль), которые не смывает шампунь. Наносится на чистую поверхность перед защитой.',
    categories: ['iron_remover'],
    accessoryKinds: [],
    essential: false,
  },
  {
    id: 'protection',
    title: 'Защита кузова',
    stage: 'Защитный слой на чистый кузов',
    why: 'Тонкий защитный слой: вода скатывается, грязь меньше прилипает, следующая мойка проще.',
    categories: ['protection'],
    accessoryKinds: ['trigger_sprayer', 'applicator'],
    essential: false,
  },
  {
    id: 'drying',
    title: 'Сушка и принадлежности',
    stage: 'Финиш',
    why: 'Мягкая микрофибра собирает воду без разводов и царапин; оборудование делает дозировку точной.',
    categories: ['drying_aid'],
    accessoryKinds: ['drying_towel', 'sprayer', 'bucket', 'foam_lance'],
    essential: false,
  },
];

export interface Compatibility {
  /** Оборудование пользователя, с которым средство можно применить по методике. */
  equipment: Equipment[];
  /** Способы нанесения из методики, для которых нет оборудования. */
  missingMethods: ApplicationMethod[];
}

export function compatibility(p: Product, equipment: Equipment[]): Compatibility {
  const found = new Map<string, Equipment>();
  const missing: ApplicationMethod[] = [];
  for (const a of p.applications) {
    const eqs = equipment.filter((e) => {
      if (e.type === 'bottle_trigger')
        return a.dilution.kind === 'ready' && (a.method === 'trigger' || a.method === 'sprayer') && (!e.productId || e.productId === p.id);
      return EQUIPMENT_META[e.type].method === a.method;
    });
    if (eqs.length) eqs.forEach((e) => found.set(e.id, e));
    else missing.push(a.method);
  }
  return { equipment: [...found.values()], missingMethods: [...new Set(missing)] };
}

export interface NeedStatus {
  def: NeedDef;
  owned: { owned: OwnedChemical; product: Product }[];
  covered: boolean;
  recommendations: Product[];
}

/** Рекомендации: только карточки с подтверждённой методикой, сначала подходящие к оборудованию пользователя. */
export function analyzeNeeds(input: {
  products: Product[];
  owned: OwnedChemical[];
  equipment: Equipment[];
  offers: ShopData['offers'];
}): NeedStatus[] {
  const ownedItems = input.owned
    .map((o) => ({ owned: o, product: input.products.find((p) => p.id === o.productId) }))
    .filter((x): x is { owned: OwnedChemical; product: Product } => !!x.product);
  const ownedIds = new Set(ownedItems.map((x) => x.product.id));
  const brands = new Set(ownedItems.map((x) => x.product.brand));
  const withOffers = new Set(input.offers.map((o) => o.productId));

  return NEEDS.map((def) => {
    const mine = ownedItems.filter((x) => def.categories.includes(x.product.category) && x.owned.remainingMl > 0);
    const candidates = input.products.filter(
      (p) =>
        def.categories.includes(p.category) &&
        p.status === 'verified' &&
        !p.custom &&
        !ownedIds.has(p.id) &&
        // универсальный шампунь закрывает 2 фазу, только если есть методика для ведра
        !(def.id === 'phase2' && p.category === 'universal_shampoo' && !p.applications.some((a) => a.method === 'bucket')) &&
        !(def.id === 'phase1' && p.phase === 2) &&
        !(def.id === 'phase2' && p.phase === 1),
    );
    const score = (p: Product) => {
      const c = compatibility(p, input.equipment);
      return (
        (c.equipment.length ? 100 : 0) +
        (brands.has(p.brand) ? 20 : 0) +
        (withOffers.has(p.id) ? 10 : 0) +
        (p.imageUrl ? 2 : 0) +
        Math.min(p.applications.length, 4)
      );
    };
    const recommendations = candidates.sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name));
    return { def, owned: mine, covered: mine.length > 0, recommendations };
  });
}

export const STORE_LABEL: Record<Store, string> = {
  official: 'Официальный сайт',
  time2detailing: 'time2detailing',
  ozon: 'Ozon',
  wildberries: 'Wildberries',
  yandex_market: 'Яндекс Маркет',
};

export interface ShopLink {
  store: Store;
  url: string;
  /** Прямая проверенная ссылка на товар или поиск по названию. */
  direct: boolean;
  label: string;
}

/** Честные ссылки: проверенные карточки товара + поиск по точному названию на маркетплейсах. */
export function shopLinks(query: string, offers: Offer[], officialUrl?: string): ShopLink[] {
  const links: ShopLink[] = offers.map((o) => ({ store: o.store, url: o.url, direct: true, label: STORE_LABEL[o.store] }));
  if (officialUrl && !links.some((l) => l.store === 'official')) {
    links.push({ store: 'official', url: officialUrl, direct: true, label: STORE_LABEL.official });
  }
  const q = encodeURIComponent(query);
  const search: [Store, string][] = [
    ['ozon', `https://www.ozon.ru/search/?text=${q}`],
    ['wildberries', `https://www.wildberries.ru/catalog/0/search.aspx?search=${q}`],
    ['yandex_market', `https://market.yandex.ru/search?text=${q}`],
  ];
  for (const [store, url] of search) {
    if (!links.some((l) => l.store === store)) links.push({ store, url, direct: false, label: STORE_LABEL[store] });
  }
  // прямые ссылки — первыми
  return links.sort((a, b) => Number(b.direct) - Number(a.direct));
}

export function missingMethodsText(methods: ApplicationMethod[]): string {
  return methods.map((m) => METHOD_LABEL[m].toLowerCase()).join(' или ');
}

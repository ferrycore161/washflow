import { computeRecipe, formatMl } from './dilution';
import { BODY_SOLUTION_NEED, EQUIPMENT_META, METHOD_LABEL } from './equipment';
import type {
  Application,
  ApplicationMethod,
  CarProfile,
  DirtLevel,
  Equipment,
  OwnedChemical,
  Product,
  ProductCategory,
  Scenario,
  ScenarioStep,
  WashSettings,
} from './types';

export interface ScenarioInput {
  settings: WashSettings;
  car: CarProfile | null;
  equipment: Equipment[];
  owned: OwnedChemical[];
  getProduct: (id: string) => Product | undefined;
}

export type Role = 'phase1' | 'phase2' | 'protection' | 'wheels' | 'insects' | 'iron';

/** В каком порядке предпочитаем способы нанесения для каждой роли. */
const METHOD_PRIORITY: Record<Role, ApplicationMethod[]> = {
  phase1: ['foam_lance', 'foam_generator', 'sprayer', 'hpw_injector'],
  phase2: ['bucket', 'foam_generator', 'foam_lance', 'sprayer'],
  protection: ['sprayer', 'foam_generator', 'foam_lance', 'trigger'],
  wheels: ['trigger', 'sprayer', 'foam_generator'],
  insects: ['trigger', 'sprayer', 'foam_generator'],
  iron: ['trigger', 'sprayer', 'foam_generator', 'foam_lance'],
};

const ROLE_CATEGORIES: Record<Role, ProductCategory[]> = {
  phase1: ['prewash', 'active_foam', 'universal_shampoo'],
  phase2: ['contact_shampoo', 'universal_shampoo'],
  protection: ['protection'],
  // Iron с разрешением производителя для дисков подходит и для этапа дисков (если нет отдельного очистителя)
  wheels: ['wheel_cleaner', 'iron_remover'],
  insects: ['insect_remover'],
  iron: ['iron_remover'],
};

interface Pick {
  car?: CarProfile | null;
  role: Role;
  product: Product;
  owned: OwnedChemical;
  app?: Application;
  equipment?: Equipment;
  /** Почему нет рецепта. */
  missingReason?: string;
}

function pickProduct(role: Role, items: { product: Product; owned: OwnedChemical }[], exclude: Set<string>) {
  const cats = ROLE_CATEGORIES[role];
  const candidates = items
    .filter((i) => !exclude.has(i.product.id) && cats.includes(i.product.category))
    // phase2 из универсального шампуня — только если у него есть методика для ведра
    .filter((i) =>
      role === 'phase2' && i.product.category === 'universal_shampoo'
        ? i.product.applications.some((a) => a.method === 'bucket')
        : true,
    )
    .filter((i) => (role === 'phase1' && i.product.phase === 2 ? false : true))
    .filter((i) => (role === 'phase2' && i.product.phase === 1 ? false : true))
    .filter((i) =>
      role === 'wheels' && i.product.category === 'iron_remover' ? !!i.product.targets?.includes('wheels') : true,
    );
  candidates.sort((a, b) => {
    // точная категория роли важнее; проверенные карточки важнее непроверенных; больше остаток — лучше
    const ca = cats.indexOf(a.product.category);
    const cb = cats.indexOf(b.product.category);
    if (ca !== cb) return ca - cb;
    const va = a.product.applications.length > 0 ? 0 : 1;
    const vb = b.product.applications.length > 0 ? 0 : 1;
    if (va !== vb) return va - vb;
    return b.owned.remainingMl - a.owned.remainingMl;
  });
  return candidates[0];
}

function chooseEquipment(equipment: Equipment[], method: ApplicationMethod, used: Map<string, string>) {
  // распылитель на флакон не является ёмкостью для раствора
  const list = equipment.filter((e) => e.type !== 'bottle_trigger' && EQUIPMENT_META[e.type].method === method);
  list.sort((a, b) => {
    // свободная ёмкость лучше занятой другой химией
    const ua = used.has(a.id) ? 1 : 0;
    const ub = used.has(b.id) ? 1 : 0;
    if (ua !== ub) return ua - ub;
    if (!!a.isDefault !== !!b.isDefault) return a.isDefault ? -1 : 1;
    return b.fillMl - a.fillMl;
  });
  return list[0];
}

function resolveApplication(role: Role, product: Product, equipment: Equipment[], used: Map<string, string>) {
  if (product.applications.length === 0) {
    return { missingReason: 'Для этого средства в каталоге нет подтверждённой методики разведения.' };
  }
  // Готовый состав, который производитель наносит распылением: распылитель прямо на флакон
  // (без переливания и без разбавления) — в приоритете.
  const sprayReady = product.applications.find(
    (a) => a.dilution.kind === 'ready' && (a.method === 'trigger' || a.method === 'sprayer'),
  );
  if (sprayReady) {
    const bottle = equipment
      .filter((e) => e.type === 'bottle_trigger' && (!e.productId || e.productId === product.id))
      .sort((a, b) => (a.productId === product.id ? 0 : 1) - (b.productId === product.id ? 0 : 1))[0];
    if (bottle) return { app: sprayReady, equipment: bottle };
  }
  for (const method of METHOD_PRIORITY[role]) {
    const app = product.applications.find((a) => a.method === method);
    if (!app) continue;
    const eq = chooseEquipment(equipment, method, used);
    if (eq) return { app, equipment: eq };
  }
  const available = [...new Set(product.applications.map((a) => METHOD_LABEL[a.method]))].join(', ');
  return {
    missingReason: `Производитель даёт методику только для: ${available}. Такого оборудования нет в вашем списке.`,
  };
}

/** Объём раствора, который готовим. */
export function solutionVolume(
  role: Role,
  method: ApplicationMethod,
  eq: Equipment,
  car: CarProfile | null,
  app?: Application,
): number | null {
  const body = car?.body ?? 'sedan';
  const need = BODY_SOLUTION_NEED[body];
  // Средство без разведения в распылителе/триггере: объём — только по расходу производителя.
  if (app?.dilution.kind === 'ready' && method !== 'foam_lance' && method !== 'hpw_injector') {
    const c = app.consumptionMl;
    if (!c) return null;
    const small = body === 'hatchback' || body === 'sedan';
    const big = body === 'suv' || body === 'minivan';
    const v = small ? (body === 'hatchback' ? c.from : (c.from + c.to) / 2) : big ? c.to : (c.from + 3 * c.to) / 4;
    return Math.min(eq.fillMl, Math.round(v / 5) * 5);
  }
  switch (method) {
    case 'bucket':
    case 'foam_lance':
    case 'hpw_injector':
      return eq.fillMl;
    case 'trigger':
      return Math.min(eq.fillMl, role === 'wheels' ? 500 : 500);
    default: {
      const factor = role === 'protection' ? 0.7 : role === 'wheels' || role === 'insects' ? 0.5 : 1;
      return Math.min(eq.fillMl, Math.round((need * factor) / 100) * 100);
    }
  }
}

let seq = 0;
const sid = (p: string) => `${p}-${++seq}`;

function dwellText(app?: Application) {
  if (!app?.dwellSec) return null;
  const { from, to } = app.dwellSec;
  const f = (s: number) => (s % 60 === 0 ? `${s / 60}` : `${Math.round((s / 60) * 10) / 10}`.replace('.', ','));
  if (from === to) return `${f(from)} мин`;
  return `${f(from)}–${f(to)} мин`;
}

function applyText(pick: Pick): string {
  const surface =
    pick.app?.surface === 'dry' ? 'на сухой кузов' : pick.app?.surface === 'wet' ? 'на влажный кузов' : 'на кузов';
  switch (pick.role) {
    case 'wheels':
      return 'Нанеси на диски и шины, начиная с самого грязного колеса.';
    case 'insects':
      return 'Нанеси на бампер, решётку, зеркала и стекло — туда, где следы насекомых.';
    case 'phase1':
      return `Нанеси ${surface} снизу вверх ровным слоем, не пропуская пороги и арки.`;
    case 'phase2':
      return pick.app?.method === 'bucket'
        ? 'Пройди кузов варежкой сверху вниз без сильного нажатия. Чаще полощи варежку.'
        : `Нанеси ${surface} снизу вверх, затем пройди варежкой сверху вниз.`;
    case 'protection':
      return `Нанеси ${surface} сверху вниз тонким равномерным слоем.`;
    case 'iron': {
      const t = pick.product.targets;
      const where =
        t?.includes('body') && t.includes('wheels')
          ? 'на кузов и диски'
          : t?.includes('wheels') && !t.includes('body')
            ? 'на диски'
            : 'на кузов';
      return `Нанеси ${where} равномерно, начиная с низа кузова и порогов — там больше всего металлических частиц.`;
    }
  }
}

const STAGE: Record<Role, string> = {
  wheels: 'Диски',
  insects: 'Предочистка',
  phase1: 'Первая фаза',
  phase2: 'Вторая фаза',
  protection: 'Защита',
  iron: 'Iron',
};

/** Расход готового состава из флакона: точка внутри диапазона производителя по кузову. */
function consumptionFor(app: Application, car: CarProfile | null | undefined): number | null {
  const c = app.consumptionMl;
  if (!c) return null;
  const body = car?.body ?? 'sedan';
  const v =
    body === 'hatchback'
      ? c.from
      : body === 'sedan'
        ? (c.from + c.to) / 2
        : body === 'suv' || body === 'minivan'
          ? c.to
          : (c.from + 3 * c.to) / 4;
  return Math.round(v / 5) * 5;
}

const isBottle = (pick: Pick) => pick.equipment?.type === 'bottle_trigger';

function prepareStep(pick: Pick, car: CarProfile | null, reuse: boolean, dirt: DirtLevel): ScenarioStep {
  const p = pick.product;
  if (!pick.app || !pick.equipment) {
    return {
      id: sid('prep'),
      kind: 'prepare',
      title: 'Подготовь состав',
      text: 'Подготовь средство строго по инструкции на этикетке.',
      stage: 'Подготовка',
      productId: p.id,
      tips: [],
      warnings: [pick.missingReason ?? 'Нет подтверждённой методики.'],
      skippable: true,
      noVerifiedRecipe: true,
    };
  }
  const total = solutionVolume(pick.role, pick.app.method, pick.equipment, car, pick.app);
  if (total === null) {
    // готовое средство без указанного расхода: не выдумываем объём
    return {
      id: sid('prep'),
      kind: 'prepare',
      title: 'Подготовь средство',
      text: `Налей средство в ${pick.equipment.name} без разведения — столько, сколько нужно на кузов.`,
      stage: 'Подготовка',
      productId: p.id,
      equipmentId: pick.equipment.id,
      method: pick.app.method,
      tips: [reuse ? 'Тщательно промой ёмкость чистой водой — в ней была другая химия.' : 'Средство готово к применению — не разбавляй его.'],
      warnings: [],
      skippable: false,
      sourceUrl: pick.app.sourceUrl,
      checkedAt: pick.app.checkedAt,
    };
  }
  const r = computeRecipe(pick.app.dilution, total, dirt);
  const warnings: string[] = [];
  if (r.chemMl > pick.owned.remainingMl) {
    warnings.push(`Остатка может не хватить: осталось ${formatMl(pick.owned.remainingMl)}, нужно ${formatMl(r.chemMl)}.`);
  }
  if (r.outOfRange) warnings.push('Слишком малый объём для точного отмера — лучше приготовить больше раствора.');
  const tips: string[] = [];
  if (reuse) tips.push('Тщательно промой ёмкость чистой водой — в ней была другая химия.');
  if (pick.app.dilution.kind === 'ready') {
    tips.push('Средство готово к применению — не разбавляй его.');
  } else {
    tips.push('Сначала налей воду, затем химию — так меньше пены при заливке.');
  }
  if (pick.app.method === 'sprayer' || pick.app.method === 'foam_generator') {
    tips.push('Не заливай ёмкость доверху: помпе нужен воздух.');
  }
  if (pick.app.method === 'foam_lance') {
    tips.push('Это концентрация в бачке пенной насадки; итоговую подачу регулирует насадка.');
  }
  return {
    id: sid('prep'),
    kind: 'prepare',
    title: 'Подготовь состав',
    text:
      pick.app.dilution.kind === 'ready'
        ? `Налей средство в ${EQUIPMENT_META[pick.equipment.type].label.toLowerCase()}.`
        : `Налей воду и химию в ${pick.equipment.name}. Закрой и аккуратно перемешай.`,
    stage: 'Подготовка',
    productId: p.id,
    equipmentId: pick.equipment.id,
    method: pick.app.method,
    recipe: {
      chemMl: r.chemMl,
      waterMl: r.waterMl,
      totalMl: r.totalMl,
      basisText: /\d\s*г(?![а-яё])/i.test(pick.app.dilutionText)
        ? `${r.basisText}. Производитель указывает массу (г): пересчёт 1 г ≈ 1 мл, погрешность для концентратов — несколько процентов`
        : r.basisText,
    },
    tips,
    warnings,
    skippable: false,
    sourceUrl: pick.app.sourceUrl,
    checkedAt: pick.app.checkedAt,
  };
}

function applySteps(pick: Pick): ScenarioStep[] {
  const steps: ScenarioStep[] = [];
  const p = pick.product;
  const app = pick.app;
  const stage = STAGE[pick.role];
  const restrictions = [...(app?.restrictions ?? []), ...p.warnings];
  const dt = dwellText(app);

  if (pick.role === 'iron' && app?.surface === 'dry') {
    steps.push({
      id: sid('info'),
      kind: 'info',
      title: 'Подготовь поверхность',
      text: 'Средство наносится на сухую поверхность: собери воду микрофиброй с участков, которые будешь обрабатывать.',
      stage,
      tips: [],
      warnings: [],
      skippable: false,
    });
  }

  let bottleRecipe: ScenarioStep['recipe'];
  const bottleTips: string[] = [];
  if (app && isBottle(pick)) {
    const ml = consumptionFor(app, pick.car);
    if (ml && app.consumptionMl) {
      bottleRecipe = {
        mode: 'consumption',
        rangeMl: app.consumptionMl,
        chemMl: ml,
        waterMl: 0,
        totalMl: ml,
        basisText: `Без разбавления. Расход по инструкции производителя: ${app.consumptionMl.from}–${app.consumptionMl.to} мл на автомобиль`,
      };
    }
    bottleTips.push(`Накрути распылитель прямо на флакон ${p.name} — переливать и разбавлять не нужно.`);
    if (!pick.equipment?.productId) bottleTips.push('Если распылитель стоял на другом флаконе — промой трубку чистой водой.');
    if (ml && ml > pick.owned.remainingMl)
      bottleTips.push(`Во флаконе осталось ${formatMl(pick.owned.remainingMl)} — может не хватить на весь кузов.`);
  }

  steps.push({
    id: sid('apply'),
    kind: pick.role === 'phase2' && app?.method === 'bucket' ? 'contact' : 'apply',
    title: pick.role === 'phase2' && app?.method === 'bucket' ? 'Помой кузов' : 'Нанеси состав',
    text: app ? applyText(pick) : 'Нанеси средство так, как указано на этикетке.',
    stage,
    productId: p.id,
    equipmentId: pick.equipment?.id,
    method: app?.method,
    recipe: bottleRecipe,
    tips: [...bottleTips, ...(app?.steps.slice(0, 3) ?? [])],
    warnings: restrictions,
    skippable: false,
    sourceUrl: app?.sourceUrl,
    checkedAt: app?.checkedAt,
    noVerifiedRecipe: !app,
  });

  if (app?.dwellSec && app.dwellSec.to > 0) {
    steps.push({
      id: sid('dwell'),
      kind: 'dwell',
      title: 'Дай составу поработать',
      text: `Выдержка ${dt}. Не давай составу высохнуть — в жару смой раньше.`,
      stage,
      productId: p.id,
      timerSec: app.dwellSec.from || app.dwellSec.to,
      timerRange: app.dwellSec,
      tips: [],
      warnings: [],
      skippable: true,
      sourceUrl: app.sourceUrl,
      checkedAt: app.checkedAt,
    });
  } else if ((pick.role === 'phase1' || pick.role === 'iron') && app) {
    steps.push({
      id: sid('dwell'),
      kind: 'dwell',
      title: 'Дай составу поработать',
      text: 'Производитель не указал время выдержки. Не давай составу высохнуть, смывай, пока он влажный.',
      stage,
      productId: p.id,
      tips: [],
      warnings: [],
      skippable: true,
    });
  }

  const needsRinse =
    pick.role !== 'protection' ||
    (app ? app.steps.some((s) => /смы|ополос|промой/i.test(s)) : false);
  if (needsRinse) {
    steps.push({
      id: sid('rinse'),
      kind: 'rinse',
      title: pick.role === 'wheels' ? 'Смой с дисков' : 'Смой водой',
      text:
        pick.role === 'wheels'
          ? 'Смой состав с дисков и арок водой под давлением.'
          : 'Режим «Вода». Смывай сверху вниз, тщательно промой пороги, арки и стыки.',
      stage,
      tips: ['Держи пистолет на расстоянии 30–40 см от кузова.'],
      warnings: [],
      // смыв химии пропускать нельзя
      skippable: false,
    });
  }
  return steps;
}

const MINUTES: Record<ScenarioStep['kind'], number> = {
  info: 1,
  prepare: 2,
  apply: 3,
  dwell: 2,
  rinse: 3,
  contact: 10,
  dry: 10,
};

export function buildScenario(input: ScenarioInput): Scenario {
  seq = 0;
  const { settings, car, equipment } = input;
  const items = input.owned
    .map((owned) => ({ owned, product: input.getProduct(owned.productId) }))
    .filter((i): i is { owned: OwnedChemical; product: Product } => !!i.product);

  const notices: string[] = [];
  const picks: Pick[] = [];
  const usedProducts = new Set<string>();
  const usedEquipment = new Map<string, string>();

  const roles: Role[] = [];
  if (settings.includeWheels) roles.push('wheels');
  if (settings.includeInsects) roles.push('insects');
  roles.push('phase1');
  if (settings.kind !== 'quick') roles.push('phase2');
  if (settings.kind === 'iron') roles.push('iron');
  // после удаления вкраплений защиту наносят на чистый кузов — берём её, если она есть
  if (settings.kind === 'protect' || settings.kind === 'iron') roles.push('protection');

  for (const role of roles) {
    const item = pickProduct(role, items, usedProducts);
    if (!item) continue;
    usedProducts.add(item.product.id);
    const res = resolveApplication(role, item.product, equipment, usedEquipment);
    const pick: Pick = { car, role, product: item.product, owned: item.owned, ...res };
    picks.push(pick);
    if (pick.equipment && pick.equipment.type !== 'bottle_trigger') usedEquipment.set(pick.equipment.id, item.product.id);
  }

  // Быстрая мойка без средства первой фазы — используем ручной шампунь
  if (settings.kind === 'quick' && !picks.some((p) => p.role === 'phase1')) {
    const item = pickProduct('phase2', items, usedProducts);
    if (item) {
      const res = resolveApplication('phase2', item.product, equipment, usedEquipment);
      picks.push({ car, role: 'phase2', product: item.product, owned: item.owned, ...res });
    }
  }

  if (!picks.some((p) => p.role === 'phase1' || p.role === 'phase2')) {
    notices.push('Добавьте в «Мою химию» шампунь для бесконтактной или ручной мойки.');
  }
  if (settings.kind === 'protect' && !picks.some((p) => p.role === 'protection')) {
    notices.push('Для защиты добавьте в «Мою химию» средство категории «Защита».');
  }
  const missingRoles: Role[] = [];
  if (!picks.some((p) => p.role === 'phase1')) missingRoles.push('phase1');
  if (settings.kind !== 'quick' && !picks.some((p) => p.role === 'phase2')) missingRoles.push('phase2');
  if (settings.kind === 'protect' && !picks.some((p) => p.role === 'protection')) missingRoles.push('protection');
  if (settings.kind === 'iron' && !picks.some((p) => p.role === 'iron')) {
    missingRoles.push('iron');
    notices.push('Нет средства для удаления металлических вкраплений (Iron) — этап пропущен. Подходящие составы есть в разделе «Покупки».');
  }
  if (settings.includeWheels && !picks.some((p) => p.role === 'wheels')) {
    missingRoles.push('wheels');
    notices.push('Очистителя дисков нет в «Моей химии» — этап дисков пропущен.');
  }
  for (const p of picks) {
    if (p.missingReason) notices.push(`${p.product.brand} ${p.product.name}: ${p.missingReason}`);
  }

  // Порядок использования ёмкостей: первая химия в ёмкости готовится заранее,
  // повторное использование той же ёмкости — прямо перед этапом, с промывкой.
  const order: Role[] = ['wheels', 'insects', 'phase1', 'phase2', 'iron', 'protection'];
  picks.sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role));

  const firstUse = new Set<string>();
  const upfront: ScenarioStep[] = [];
  const deferred = new Map<Pick, ScenarioStep>();
  for (const pick of picks) {
    // распылитель на флакон: готовить нечего, расход — в шаге нанесения
    if (isBottle(pick)) continue;
    const eqId = pick.equipment?.id;
    if (!eqId || !firstUse.has(eqId)) {
      if (eqId) firstUse.add(eqId);
      upfront.push(prepareStep(pick, car, false, settings.dirt));
    } else {
      deferred.set(pick, prepareStep(pick, car, true, settings.dirt));
    }
  }

  const steps: ScenarioStep[] = [];
  if (upfront.length) {
    steps.push({
      id: sid('info'),
      kind: 'info',
      title: 'Подготовься до запуска поста',
      text: 'Приготовь растворы заранее — на мойке время платное. Поставь машину в тень, если можно.',
      stage: 'Подготовка',
      tips: ['Кузов не должен быть горячим: если машина стояла на солнце, сначала охлади её водой.'],
      warnings: [],
      skippable: true,
    });
    steps.push(...upfront);
  }

  const firstWash = picks.find((p) => p.role === 'phase1' || p.role === 'phase2');
  const preRinse = firstWash && firstWash.app?.surface !== 'dry';
  let preRinseAdded = false;

  for (const pick of picks) {
    if (pick === firstWash && preRinse && !preRinseAdded) {
      preRinseAdded = true;
      steps.push({
        id: sid('rinse'),
        kind: 'rinse',
        title: 'Сполосни кузов',
        text: 'Режим «Вода». Сбей крупную грязь и песок сверху вниз.',
        stage: STAGE[pick.role],
        tips: [],
        warnings: [],
        skippable: true,
      });
    }
    const def = deferred.get(pick);
    if (def) {
      def.stage = STAGE[pick.role];
      steps.push(def);
    }
    steps.push(...applySteps(pick));
  }

  steps.push({
    id: sid('rinse'),
    kind: 'rinse',
    title: 'Финальное ополаскивание',
    text: 'Если на посту есть режим «Осмос» — ополосни им кузов сверху вниз, чтобы не было разводов.',
    stage: 'Финиш',
    tips: [],
    warnings: [],
    skippable: true,
  });
  steps.push({
    id: sid('dry'),
    kind: 'dry',
    title: 'Высуши кузов',
    text: 'Чистой микрофиброй промокай кузов сверху вниз, без трения по сухому.',
    stage: 'Финиш',
    tips: ['Начни со стёкол и крыши, пороги и низ — в последнюю очередь.'],
    warnings: [],
    skippable: true,
  });

  const consumption: Record<string, number> = {};
  for (const s of steps) {
    if (s.recipe && s.productId) {
      consumption[s.productId] = (consumption[s.productId] ?? 0) + s.recipe.chemMl;
    }
  }

  const estMinutes = steps.reduce((sum, s) => sum + (s.timerSec ? Math.ceil(s.timerSec / 60) : MINUTES[s.kind]), 0);
  const hasP1 = picks.some((p) => p.role === 'phase1');
  const hasP2 = picks.some((p) => p.role === 'phase2');
  const hasProt = picks.some((p) => p.role === 'protection');

  const hasIron = picks.some((p) => p.role === 'iron');
  const title =
    settings.kind === 'iron'
      ? hasIron
        ? hasProt
          ? 'Мойка с Iron + защита'
          : 'Мойка с удалением вкраплений'
        : 'Мойка с Iron'
      : settings.kind === 'quick'
      ? 'Быстрая мойка'
      : hasP1 && hasP2
        ? hasProt
          ? 'Двухфазная мойка + защита'
          : 'Двухфазная мойка'
        : hasProt
          ? 'Мойка + защита'
          : 'Стандартная мойка';

  const subtitle =
    settings.kind === 'iron'
      ? 'Двухфазная мойка, затем удаление металлических частиц на чистой поверхности и защита.'
      : settings.kind === 'quick'
      ? 'Бесконтактная мойка без варежки — когда мало времени.'
      : hasProt
        ? 'Глубокая очистка и защитный слой на кузове.'
        : 'Бесконтактная предмойка и аккуратная ручная мойка.';

  return {
    title,
    subtitle,
    kind: settings.kind,
    steps,
    estMinutes,
    productIds: picks.map((p) => p.product.id),
    equipmentIds: [...new Set(picks.map((p) => p.equipment?.id).filter((x): x is string => !!x))],
    consumption,
    notices,
    missingRoles,
  };
}

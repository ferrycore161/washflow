/**
 * Доменные типы WASHFLOW.
 *
 * Принцип: дозировка хранится в том виде, в каком её даёт производитель
 * (1:X, мл/л, %, «готов к применению»), отдельно для каждого способа нанесения.
 * Пересчёт в миллилитры делается только в domain/dilution.ts.
 */

/** Способ нанесения = тип ёмкости, в которой готовится раствор. */
export type ApplicationMethod =
  | 'sprayer' // ручной помповый распылитель / опрыскиватель
  | 'bucket' // ведро, ручная мойка варежкой
  | 'foam_lance' // пенокомплект / пенная насадка для АВД
  | 'foam_generator' // отдельный пеногенератор (помповый пенный распылитель, бак)
  | 'trigger' // триггерный распылитель (обычно готовые составы)
  | 'hpw_injector'; // через бачок / инжектор АВД

/**
 * bottle_trigger — дисперсионный распылитель, который накручивается прямо на оригинальный
 * флакон: без отдельной ёмкости и без разбавления (только для готовых составов).
 */
export type EquipmentType = ApplicationMethod | 'bottle_trigger' | 'other';

export type Range = { from: number; to: number };

export type Dilution =
  /** 1:X — X частей воды на 1 часть концентрата (basis 'water') либо 1 часть в X частях раствора (basis 'total'). */
  | { kind: 'ratio'; from: number; to: number; ratioBasis: 'water' | 'total' }
  /** мл концентрата на литр воды или литр готового раствора. */
  | { kind: 'ml_per_l'; from: number; to: number; basis: 'water' | 'solution' }
  /** % концентрата в готовом растворе. */
  | { kind: 'percent'; from: number; to: number }
  /** Применять без разведения. */
  | { kind: 'ready' };

export type Surface = 'dry' | 'wet' | 'any';

export type ProductCategory =
  | 'prewash'
  | 'active_foam'
  | 'contact_shampoo'
  | 'universal_shampoo'
  | 'protection'
  | 'wheel_cleaner'
  | 'insect_remover'
  | 'tar_remover'
  | 'iron_remover'
  | 'glass_cleaner'
  | 'drying_aid'
  | 'other';

export type VerificationStatus = 'verified' | 'unverified' | 'demo';

export interface Application {
  method: ApplicationMethod;
  dilution: Dilution;
  /** Дозировка дословно, как в источнике. */
  dilutionText: string;
  surface: Surface | null;
  dwellSec: Range | null;
  steps: string[];
  restrictions: string[];
  sourceUrl: string;
  /** ISO-дата проверки источника. */
  checkedAt: string;
  sourceQuote?: string;
  /** Расход готового раствора/средства на один автомобиль, мл (если указан производителем). */
  consumptionMl?: Range;
  /** official — сайт производителя; retailer — копия инструкции на странице магазина (например, time2detailing). */
  sourceType?: 'official' | 'retailer';
  /** Производитель не назвал устройство; способ выбран по смыслу инструкции. */
  methodAssumed?: boolean;
}

/** На какие поверхности производитель разрешает наносить средство. */
export type Target = 'body' | 'wheels' | 'glass' | 'tires' | 'plastic' | 'engine';

export interface Product {
  id: string;
  brand: string;
  name: string;
  subtitle: string;
  aliases: string[];
  category: ProductCategory;
  phase: 1 | 2 | null;
  ph: string | number | null;
  packages: number[];
  applications: Application[];
  warnings: string[];
  status: VerificationStatus;
  productUrl?: string;
  targets?: Target[];
  /** Фото с официального сайта производителя (показывается онлайн, офлайн — иллюстрация). */
  imageUrl?: string;
  /** Пользовательская карточка (добавлена вручную, не из каталога). */
  custom?: boolean;
}

export interface Equipment {
  id: string;
  type: EquipmentType;
  name: string;
  /** Номинальный объём, мл. */
  volumeMl: number;
  /** Сколько раствора реально заливать, мл (помповым ёмкостям нужен воздух). */
  fillMl: number;
  isDefault?: boolean;
  createdAt: number;
  /** Для распылителя на флакон: на какое средство накручен (пусто — переставляется на любой флакон). */
  productId?: string;
}

export interface OwnedChemical {
  id: string;
  productId: string;
  /** Объём упаковки, мл (≠ объёму ёмкости для раствора). */
  packageMl: number;
  /** Остаток концентрата, мл. */
  remainingMl: number;
  addedAt: number;
}

export type BodyType = 'hatchback' | 'sedan' | 'wagon' | 'crossover' | 'suv' | 'minivan';

export interface CarProfile {
  make: string;
  model: string;
  body: BodyType;
  /** Поколение из библиотеки автомобилей (vehicleCatalog), например mazda-6-gj. */
  generationId?: string;
  /** Вариант кузова при одинаковом типе (3d/5d). */
  bodyVariant?: string;
  /** Ключ цвета из палитры изображений (CAR_COLORS). */
  colorKey?: string;
  years?: string;
  color?: string;
  engine?: string;
}

export type ScenarioKind = 'quick' | 'standard' | 'protect' | 'iron';
export type DirtLevel = 'light' | 'normal' | 'heavy';

export interface WashSettings {
  kind: ScenarioKind;
  dirt: DirtLevel;
  includeWheels: boolean;
  includeInsects: boolean;
}

export type StepKind =
  | 'prepare' // приготовить раствор
  | 'apply' // нанести
  | 'dwell' // выдержать
  | 'rinse' // смыть
  | 'contact' // ручная мойка варежкой
  | 'dry' // сушка
  | 'info'; // подготовка / советы

export interface Recipe {
  /** mix — налить химию и воду; consumption — средство из флакона, показываем расход по инструкции. */
  mode?: 'mix' | 'consumption';
  /** Расход производителя на автомобиль (для mode consumption). */
  rangeMl?: Range;
  chemMl: number;
  waterMl: number;
  totalMl: number;
  /** Что именно взято из диапазона производителя, человеческим языком. */
  basisText: string;
}

export interface ScenarioStep {
  id: string;
  kind: StepKind;
  title: string;
  /** Одна короткая инструкция. */
  text: string;
  stage: string;
  productId?: string;
  equipmentId?: string;
  method?: ApplicationMethod;
  recipe?: Recipe;
  timerSec?: number;
  timerRange?: Range;
  tips: string[];
  warnings: string[];
  /** Можно ли пропустить без риска (например, нельзя пропустить смывку химии). */
  skippable: boolean;
  /** Ссылка на источник методики. */
  sourceUrl?: string;
  checkedAt?: string;
  /** Рецепт не выводится: нет подтверждённой методики. */
  noVerifiedRecipe?: boolean;
}

export interface Scenario {
  title: string;
  subtitle: string;
  kind: ScenarioKind;
  steps: ScenarioStep[];
  estMinutes: number;
  productIds: string[];
  equipmentIds: string[];
  /** Расход концентрата по средствам, мл. */
  consumption: Record<string, number>;
  notices: string[];
  /** Роли, для которых у пользователя нет средства (для подсказки «Покупки»). */
  missingRoles: ('phase1' | 'phase2' | 'protection' | 'wheels' | 'insects' | 'iron')[];
}

import type { ApplicationMethod, BodyType, EquipmentType, ProductCategory } from './types';

export interface EquipmentMeta {
  label: string;
  plural: string;
  hint: string;
  /** Доля номинала, которую заливают по умолчанию. */
  fillRatio: number;
  presets: number[];
  /** Поддерживаемые этим оборудованием способы нанесения. */
  method: ApplicationMethod | null;
}

export const EQUIPMENT_META: Record<EquipmentType, EquipmentMeta> = {
  sprayer: {
    label: 'Ручной распылитель',
    plural: 'Распылители',
    hint: 'Помповый опрыскиватель: Marolex, Kwazar, Mesto…',
    fillRatio: 0.75,
    presets: [1000, 1500, 2000, 5000],
    method: 'sprayer',
  },
  foam_generator: {
    label: 'Пеногенератор',
    plural: 'Пеногенераторы',
    hint: 'Отдельный помповый пенный распылитель или бак',
    fillRatio: 0.75,
    presets: [1000, 1500, 2000, 24000],
    method: 'foam_generator',
  },
  foam_lance: {
    label: 'Пенокомплект АВД',
    plural: 'Пенокомплекты',
    hint: 'Пенная насадка с бачком на пистолет высокого давления',
    fillRatio: 1,
    presets: [500, 1000],
    method: 'foam_lance',
  },
  bucket: {
    label: 'Ведро',
    plural: 'Вёдра',
    hint: 'Для ручной мойки варежкой (лучше два ведра)',
    fillRatio: 0.8,
    presets: [10000, 12000, 15000, 20000],
    method: 'bucket',
  },
  trigger: {
    label: 'Триггер',
    plural: 'Триггеры',
    hint: 'Ручной триггерный распылитель 0,5–1 л',
    fillRatio: 1,
    presets: [500, 750, 1000],
    method: 'trigger',
  },
  bottle_trigger: {
    label: 'Распылитель на флакон',
    plural: 'Распылители на флакон',
    hint: 'Дисперсионный триггер, накручивается прямо на бутылку средства — без разбавления',
    fillRatio: 1,
    presets: [],
    method: 'trigger',
  },
  hpw_injector: {
    label: 'Бачок АВД',
    plural: 'Бачки АВД',
    hint: 'Бачок для химии в собственном аппарате высокого давления',
    fillRatio: 1,
    presets: [500, 1000, 2000],
    method: 'hpw_injector',
  },
  other: {
    label: 'Другое',
    plural: 'Другое',
    hint: 'Варежка, полотенце, щётка — без расчёта раствора',
    fillRatio: 1,
    presets: [],
    method: null,
  },
};

export const METHOD_LABEL: Record<ApplicationMethod, string> = {
  sprayer: 'Ручной распылитель',
  bucket: 'Ведро',
  foam_lance: 'Пенокомплект АВД',
  foam_generator: 'Пеногенератор',
  trigger: 'Триггер',
  hpw_injector: 'Бачок АВД',
};

export const METHOD_VERB: Record<ApplicationMethod, string> = {
  sprayer: 'распылителем',
  bucket: 'варежкой из ведра',
  foam_lance: 'пенной насадкой',
  foam_generator: 'пеногенератором',
  trigger: 'триггером',
  hpw_injector: 'через АВД',
};

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  prewash: 'Бесконтактная · 1 фаза',
  active_foam: 'Активная пена',
  contact_shampoo: 'Ручная мойка · 2 фаза',
  universal_shampoo: 'Универсальный шампунь',
  protection: 'Защита',
  wheel_cleaner: 'Очиститель дисков',
  insect_remover: 'Антимошка',
  tar_remover: 'Антибитум',
  iron_remover: 'Iron · металлические вкрапления',
  glass_cleaner: 'Стёкла',
  drying_aid: 'Сушка',
  other: 'Другое',
};

export const CATEGORY_SHORT: Record<ProductCategory, string> = {
  prewash: '1 фаза',
  active_foam: 'Пена',
  contact_shampoo: '2 фаза',
  universal_shampoo: 'Шампунь',
  protection: 'Защита',
  wheel_cleaner: 'Диски',
  insect_remover: 'Антимошка',
  tar_remover: 'Антибитум',
  iron_remover: 'Iron',
  glass_cleaner: 'Стёкла',
  drying_aid: 'Сушка',
  other: 'Другое',
};

export const BODY_LABEL: Record<BodyType, string> = {
  hatchback: 'Хэтчбек',
  sedan: 'Седан',
  wagon: 'Универсал',
  crossover: 'Кроссовер',
  suv: 'Внедорожник',
  minivan: 'Минивэн',
};

/** Сколько раствора нужно на один проход по кузову распылителем, мл. */
export const BODY_SOLUTION_NEED: Record<BodyType, number> = {
  hatchback: 800,
  sedan: 1000,
  wagon: 1200,
  crossover: 1300,
  suv: 1500,
  minivan: 1800,
};

export function defaultFill(type: EquipmentType, volumeMl: number): number {
  const r = EQUIPMENT_META[type].fillRatio;
  return Math.round((volumeMl * r) / 50) * 50 || volumeMl;
}

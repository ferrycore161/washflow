import type { BodyType } from '../domain/types';
import type { VehicleGeneration, VehicleModel } from '../domain/vehicles';

/**
 * Каталог поколений. Добавление модели = одна запись здесь + (по желанию) ассет в манифесте.
 * Годы и коды — общеизвестные; если в РФ продавались не все кузова, указаны продававшиеся.
 */
const g = (
  modelId: string,
  code: string,
  years: string,
  bodies: (BodyType | [BodyType, string] | [BodyType, string, string])[],
  renderYear?: number,
  imageNote?: string,
): VehicleGeneration => ({
  id: `${modelId}-${code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  code,
  years,
  bodies: bodies.map((b) => (Array.isArray(b) ? { body: b[0], label: b[1], variant: b[2] } : { body: b })),
  renderYear,
  imageNote,
});

const model = (
  make: string,
  name: string,
  gens: (id: string) => VehicleGeneration[],
  extra: Partial<VehicleModel> = {},
): VehicleModel => {
  const id = `${make}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  return { id, make, model: name, generations: gens(id), ...extra };
};

export const VEHICLE_MODELS: VehicleModel[] = [
  model('Mazda', '6', (id) => [
    g(id, 'GJ', '2012–2024', ['sedan', 'wagon'], 2019),
    g(id, 'GH', '2007–2012', ['sedan', ['hatchback', 'Лифтбек'], 'wagon'], 2010),
  ], { alias: ['мазда 6', 'mazda6', 'атенза', 'atenza'], popular: true }),
  model('Mazda', '3', (id) => [
    g(id, 'BP', '2019–', ['sedan', 'hatchback'], 2021),
    g(id, 'BM', '2013–2019', ['sedan', 'hatchback'], 2016),
  ], { alias: ['мазда 3', 'mazda3', 'аксела', 'axela'], popular: true }),
  model('Mazda', 'CX-5', (id) => [
    g(id, 'KF', '2017–', ['crossover'], 2021),
    g(id, 'KE', '2011–2017', ['crossover'], 2015),
  ], { alias: ['мазда сх5', 'cx5', 'сх-5'], popular: true }),

  model('Kia', 'Rio', (id) => [
    g(id, 'IV', '2017–2023', ['sedan', ['hatchback', 'X-Line']], 2019, 'Изображение — Kia Rio той же генерации для рынка США: фары и бампер отличаются от российской версии'),
    g(id, 'III', '2011–2017', ['sedan', 'hatchback'], 2015),
  ], { alias: ['киа рио'], popular: true }),
  model('Kia', 'K5', (id) => [g(id, 'DL3', '2020–', ['sedan'], 2021)], { alias: ['киа к5'], popular: true }),
  model('Kia', 'Seltos', (id) => [g(id, 'SP2', '2019–', ['crossover'], 2021)], { alias: ['киа селтос'], popular: true }),
  model('Kia', 'Sportage', (id) => [
    g(id, 'NQ5', '2021–', ['crossover'], 2023),
    g(id, 'QL', '2016–2021', ['crossover'], 2019),
  ], { alias: ['киа спортейдж', 'спортаж'], popular: true }),
  model('Kia', 'Ceed', (id) => [g(id, 'CD', '2018–', ['hatchback', 'wagon'], 2020)], { alias: ['киа сид', 'cee d'] }),

  model('Hyundai', 'Solaris', (id) => [
    g(id, 'HCr', '2017–2022', ['sedan'], 2019, 'Hyundai Solaris нет в каталоге изображений Car Image API'),
    g(id, 'RB', '2010–2017', ['sedan', 'hatchback'], 2015),
  ], { alias: ['хендай солярис', 'солярис'], popular: true }),
  model('Hyundai', 'Elantra', (id) => [
    g(id, 'CN7', '2020–', ['sedan'], 2021),
    g(id, 'AD', '2015–2020', ['sedan'], 2018),
  ], { alias: ['хендай элантра'] }),
  model('Hyundai', 'Sonata', (id) => [g(id, 'DN8', '2019–', ['sedan'], 2021)], { alias: ['хендай соната'] }),
  model('Hyundai', 'Tucson', (id) => [
    g(id, 'NX4', '2020–', ['crossover'], 2022),
    g(id, 'TL', '2015–2020', ['crossover'], 2018),
  ], { alias: ['хендай туксон', 'туссан'], popular: true }),

  model('Toyota', 'Camry', (id) => [
    g(id, 'XV70', '2017–2024', ['sedan'], 2020),
    g(id, 'XV50', '2011–2017', ['sedan'], 2015),
  ], { alias: ['тойота камри', 'камри'], popular: true }),
  model('Toyota', 'Corolla', (id) => [
    g(id, 'E210', '2018–', ['sedan'], 2020),
    g(id, 'E180', '2013–2018', ['sedan'], 2016),
  ], { alias: ['тойота королла'], popular: true }),
  model('Toyota', 'RAV4', (id) => [
    g(id, 'XA50', '2018–', ['crossover'], 2021),
    g(id, 'XA40', '2012–2019', ['crossover'], 2016),
  ], { alias: ['тойота рав4', 'рав 4'], popular: true }),
  model('Toyota', 'Land Cruiser', (id) => [
    g(id, '200', '2007–2021', ['suv'], 2016),
    g(id, '300', '2021–', ['suv'], 2022),
  ], { alias: ['ленд крузер', 'крузак', 'lc200'], popular: true }),

  model('Lada', 'Vesta', (id) => [
    g(id, '2015', '2015–2023', ['sedan', ['wagon', 'SW / SW Cross']], 2020),
    g(id, 'NG', '2023–', ['sedan', 'wagon'], 2023),
  ], { alias: ['лада веста', 'веста'], popular: true }),
  model('Lada', 'Granta', (id) => [
    g(id, 'FL', '2018–', ['sedan', ['hatchback', 'Лифтбек'], 'wagon'], 2020),
    g(id, 'I', '2011–2018', ['sedan', ['hatchback', 'Лифтбек']], 2016),
  ], { alias: ['лада гранта', 'гранта'], popular: true }),
  model('Lada', 'Niva Travel', (id) => [g(id, '2020', '2020–', ['suv'], 2021, 'Niva Travel нет в каталоге изображений Car Image API')], {
    alias: ['нива тревел', 'шевроле нива', 'chevrolet niva'],
    popular: true,
  }),
  model('Lada', 'Niva Legend', (id) => [g(id, '2021', '2021–', [['suv', '3 двери', '3d'], ['suv', '5 дверей', '5d']], 2021)], {
    alias: ['нива легенд', 'нива', '4x4', 'ваз 2121'],
    popular: true,
  }),

  model('Volkswagen', 'Polo', (id) => [
    g(id, 'Liftback', '2020–', [['hatchback', 'Лифтбек']], 2021, 'В каталоге изображений есть только европейский хэтчбек Polo, а не российский лифтбек'),
    g(id, 'Sedan', '2010–2020', ['sedan'], 2016, 'Российского Polo Sedan нет в каталоге изображений'),
  ], { alias: ['фольксваген поло', 'поло'], popular: true }),
  model('Volkswagen', 'Tiguan', (id) => [g(id, 'II', '2016–', ['crossover'], 2021)], { alias: ['фольксваген тигуан', 'тигуан'], popular: true }),
  model('Volkswagen', 'Passat', (id) => [g(id, 'B8', '2014–', ['sedan', 'wagon'], 2018, 'В каталоге изображений есть только американский Passat, внешне отличающийся от европейского B8')], { alias: ['фольксваген пассат', 'пассат'] }),

  model('Skoda', 'Octavia', (id) => [
    g(id, 'A8', '2020–', [['hatchback', 'Лифтбек'], 'wagon'], 2021),
    g(id, 'A7', '2013–2020', [['hatchback', 'Лифтбек'], 'wagon'], 2018),
  ], { alias: ['шкода октавия', 'октавия'], popular: true }),
  model('Skoda', 'Rapid', (id) => [
    g(id, 'II', '2020–', [['hatchback', 'Лифтбек']], 2021),
    g(id, 'I', '2012–2020', [['hatchback', 'Лифтбек']], 2018),
  ], { alias: ['шкода рапид', 'рапид'], popular: true }),
  model('Skoda', 'Kodiaq', (id) => [g(id, 'I', '2016–', ['crossover'], 2021)], { alias: ['шкода кодиак', 'кодиак'] }),

  model('BMW', '3 Series', (id) => [g(id, 'G20', '2018–', ['sedan'], 2020)], { alias: ['бмв 3', 'тройка', '3er'], popular: true }),
  model('BMW', '5 Series', (id) => [g(id, 'G30', '2016–2023', ['sedan'], 2018)], { alias: ['бмв 5', 'пятёрка', '5er'], popular: true }),
  model('Mercedes-Benz', 'E-Class', (id) => [g(id, 'W213', '2016–2023', ['sedan'], 2018)], { alias: ['мерседес е', 'ешка', 'e-klasse'], popular: true }),
  model('Haval', 'Jolion', (id) => [g(id, 'I', '2020–', ['crossover'], 2022)], { alias: ['хавал джолион', 'джолион'], popular: true }),
];

export function findVehicleModel(make: string, modelName: string): VehicleModel | undefined {
  const n = (s: string) => s.toLowerCase().replace(/[^a-z0-9а-я]/g, '');
  return VEHICLE_MODELS.find((m) => n(m.make) === n(make) && (n(m.model) === n(modelName) || n(m.make + m.model) === n(make + modelName)));
}

export function findGeneration(generationId?: string): { model: VehicleModel; generation: VehicleGeneration } | undefined {
  if (!generationId) return undefined;
  for (const m of VEHICLE_MODELS) {
    const gen = m.generations.find((x) => x.id === generationId);
    if (gen) return { model: m, generation: gen };
  }
  return undefined;
}

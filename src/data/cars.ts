import type { BodyType } from '../domain/types';

/**
 * Популярные на российском рынке модели (новые и на вторичке).
 * Тип кузова — основной для модели в РФ. Лифтбеки отнесены к «хэтчбеку»
 * (подъёмная пятая дверь), но подписываются как «Лифтбек» через bodyName.
 */
export interface CarModel {
  id: string;
  make: string;
  model: string;
  body: BodyType;
  /** Уточнение подписи кузова, если отличается от стандартной (например, «Лифтбек»). */
  bodyName?: string;
  /** Поколения / годы выпуска — только общеизвестные. */
  generations?: string[];
  /** Дополнительные написания для поиска (кириллица, сленг). */
  alias?: string[];
  popular?: boolean;
}

/** Кириллические и альтернативные написания марок. */
export const MAKE_ALIASES: Record<string, string[]> = {
  Lada: ['лада', 'ваз', 'жигули', 'vaz'],
  Kia: ['киа', 'кия', 'кио'],
  Hyundai: ['хендай', 'хендэ', 'хундай', 'хюндай', 'хёндэ', 'хендаи', 'hundai', 'hyunday'],
  Toyota: ['тойота', 'таета', 'тоета'],
  Volkswagen: ['фольксваген', 'фольц', 'вольксваген', 'vw', 'фв'],
  Skoda: ['шкода', 'škoda'],
  Mazda: ['мазда'],
  Haval: ['хавал', 'хавейл', 'хавэйл'],
  Chery: ['чери', 'черри', 'cherry'],
  Geely: ['джили', 'джелли', 'гили'],
  BMW: ['бмв', 'бэха', 'бумер'],
  'Mercedes-Benz': ['мерседес', 'мерс', 'mercedes', 'бенц', 'mb'],
  Renault: ['рено'],
  Nissan: ['ниссан', 'нисан'],
  Lexus: ['лексус'],
  Exeed: ['эксид', 'эксиид'],
  Changan: ['чанган', 'чангань'],
  Omoda: ['омода'],
  Tank: ['танк'],
  Mitsubishi: ['мицубиси', 'митсубиси', 'мицубиши', 'митсубиши'],
  Jetour: ['джетур', 'жетур'],
  Belgee: ['белджи'],
  Ford: ['форд'],
  Chevrolet: ['шевроле', 'шеви'],
};

const m = (
  make: string,
  model: string,
  body: BodyType,
  extra: Partial<Omit<CarModel, 'id' | 'make' | 'model' | 'body'>> = {},
): CarModel => ({
  id: `${make}-${model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  make,
  model,
  body,
  ...extra,
});

export const CAR_MODELS: CarModel[] = [
  // Lada
  m('Lada', 'Vesta', 'sedan', { popular: true, alias: ['веста'], generations: ['2015–2022', 'NG (2023–)'] }),
  m('Lada', 'Vesta SW', 'wagon', { alias: ['веста св', 'веста универсал'] }),
  m('Lada', 'Vesta SW Cross', 'wagon', { alias: ['веста кросс', 'веста св кросс'] }),
  m('Lada', 'Granta', 'sedan', { popular: true, alias: ['гранта'], generations: ['2011–2018', 'FL (2018–)'] }),
  m('Lada', 'Granta лифтбек', 'hatchback', { bodyName: 'Лифтбек', alias: ['гранта лифтбек'] }),
  m('Lada', 'Niva Legend', 'suv', { alias: ['нива', 'нива легенд', '4x4', 'нива 4х4'] }),
  m('Lada', 'Niva Travel', 'suv', { alias: ['нива тревел', 'шнива', 'шевроле нива'] }),
  m('Lada', 'Largus', 'wagon', { alias: ['ларгус'] }),
  m('Lada', 'XRAY', 'hatchback', { alias: ['иксрей', 'хрей', 'x-ray'] }),
  // Kia
  m('Kia', 'Rio', 'sedan', { popular: true, alias: ['рио'], generations: ['III (2011–2017)', 'IV (2017–2022)'] }),
  m('Kia', 'Rio X', 'hatchback', { alias: ['рио икс', 'rio x-line', 'рио х'] }),
  m('Kia', 'Ceed', 'hatchback', { alias: ['сид', "cee'd"] }),
  m('Kia', 'Ceed SW', 'wagon', { alias: ['сид универсал', 'сид св'] }),
  m('Kia', 'Optima', 'sedan', { alias: ['оптима'] }),
  m('Kia', 'K5', 'sedan', { alias: ['к5'] }),
  m('Kia', 'Seltos', 'crossover', { alias: ['селтос'] }),
  m('Kia', 'Sportage', 'crossover', { popular: true, alias: ['спортейдж', 'спортаж'], generations: ['IV (2015–2021)', 'V (2021–)'] }),
  m('Kia', 'Sorento', 'crossover', { alias: ['соренто'] }),
  m('Kia', 'Carnival', 'minivan', { alias: ['карнивал'] }),
  // Hyundai
  m('Hyundai', 'Solaris', 'sedan', { popular: true, alias: ['солярис', 'соларис'], generations: ['I (2010–2017)', 'II (2017–2022)'] }),
  m('Hyundai', 'Elantra', 'sedan', { alias: ['элантра'] }),
  m('Hyundai', 'Sonata', 'sedan', { alias: ['соната'] }),
  m('Hyundai', 'Creta', 'crossover', { popular: true, alias: ['крета'], generations: ['I (2016–2021)', 'II (2021–)'] }),
  m('Hyundai', 'Tucson', 'crossover', { alias: ['туссан', 'тусан', 'таксон'], generations: ['III (2015–2020)', 'IV (2020–)'] }),
  m('Hyundai', 'Santa Fe', 'crossover', { alias: ['санта фе', 'сантафе'] }),
  m('Hyundai', 'Staria', 'minivan', { alias: ['стария'] }),
  // Toyota
  m('Toyota', 'Camry', 'sedan', { popular: true, alias: ['камри', 'камрюха'], generations: ['XV50 (2011–2017)', 'XV70 (2017–)'] }),
  m('Toyota', 'Corolla', 'sedan', { alias: ['королла', 'корола'] }),
  m('Toyota', 'RAV4', 'crossover', { popular: true, alias: ['рав4', 'рав 4', 'рафик'], generations: ['XA40 (2013–2019)', 'XA50 (2019–)'] }),
  m('Toyota', 'Highlander', 'crossover', { alias: ['хайлендер', 'хайландер'] }),
  m('Toyota', 'Land Cruiser', 'suv', { alias: ['ленд крузер', 'крузак', 'ландкрузер', 'lc'], generations: ['200 (2007–2021)', '300 (2021–)'] }),
  m('Toyota', 'Land Cruiser Prado', 'suv', { alias: ['прадо', 'ленд крузер прадо'], generations: ['150 (2009–2023)', '250 (2024–)'] }),
  m('Toyota', 'Alphard', 'minivan', { alias: ['альфард'] }),
  // Volkswagen
  m('Volkswagen', 'Polo', 'sedan', { popular: true, alias: ['поло', 'поло седан'], generations: ['седан (2010–2020)'] }),
  m('Volkswagen', 'Polo лифтбек', 'hatchback', { bodyName: 'Лифтбек', alias: ['поло лифтбек'], generations: ['2020–'] }),
  m('Volkswagen', 'Golf', 'hatchback', { alias: ['гольф'] }),
  m('Volkswagen', 'Passat', 'sedan', { alias: ['пассат'] }),
  m('Volkswagen', 'Tiguan', 'crossover', { alias: ['тигуан'], generations: ['I (2007–2016)', 'II (2016–)'] }),
  m('Volkswagen', 'Touareg', 'suv', { alias: ['туарег'] }),
  m('Volkswagen', 'Multivan', 'minivan', { alias: ['мультивен', 'мультиван'] }),
  // Skoda
  m('Skoda', 'Octavia', 'hatchback', { popular: true, bodyName: 'Лифтбек', alias: ['октавия', 'октавиа'], generations: ['A7 (2013–2020)', 'A8 (2020–)'] }),
  m('Skoda', 'Octavia Combi', 'wagon', { alias: ['октавия комби', 'октавия универсал'] }),
  m('Skoda', 'Rapid', 'hatchback', { bodyName: 'Лифтбек', alias: ['рапид'] }),
  m('Skoda', 'Superb', 'hatchback', { bodyName: 'Лифтбек', alias: ['суперб'] }),
  m('Skoda', 'Karoq', 'crossover', { alias: ['карок'] }),
  m('Skoda', 'Kodiaq', 'crossover', { alias: ['кодиак'] }),
  // Mazda
  m('Mazda', '3', 'sedan', { alias: ['мазда 3', 'тройка'], generations: ['BM (2013–2019)', 'BP (2019–)'] }),
  m('Mazda', '3 хэтчбек', 'hatchback', { alias: ['мазда 3 хэтчбек'] }),
  m('Mazda', '6', 'sedan', { popular: true, alias: ['мазда 6', 'шестерка'], generations: ['GH (2007–2012)', 'GJ (2012–)'] }),
  m('Mazda', 'CX-5', 'crossover', { popular: true, alias: ['cx5', 'сх5', 'сх-5', 'цх5'], generations: ['KE (2011–2017)', 'KF (2017–)'] }),
  m('Mazda', 'CX-30', 'crossover', { alias: ['cx30', 'сх30', 'сх-30'] }),
  // Haval
  m('Haval', 'Jolion', 'crossover', { popular: true, alias: ['джолион', 'жолион'] }),
  m('Haval', 'F7', 'crossover', { popular: true, alias: ['ф7'] }),
  m('Haval', 'F7x', 'crossover', { alias: ['ф7х', 'ф7x'] }),
  m('Haval', 'H6', 'crossover', { alias: ['х6', 'н6'] }),
  m('Haval', 'Dargo', 'crossover', { alias: ['дарго'] }),
  m('Haval', 'H9', 'suv', { alias: ['х9', 'н9'] }),
  // Chery
  m('Chery', 'Tiggo 4 Pro', 'crossover', { popular: true, alias: ['тигго 4', 'тиго 4'] }),
  m('Chery', 'Tiggo 7 Pro', 'crossover', { popular: true, alias: ['тигго 7', 'тиго 7', 'тигго 7 про макс', 'tiggo 7 pro max'] }),
  m('Chery', 'Tiggo 8 Pro', 'crossover', { alias: ['тигго 8', 'тиго 8'] }),
  m('Chery', 'Arrizo 8', 'sedan', { alias: ['арризо 8', 'аризо'] }),
  // Geely
  m('Geely', 'Coolray', 'crossover', { popular: true, alias: ['кулрей', 'кулрэй'] }),
  m('Geely', 'Atlas Pro', 'crossover', { alias: ['атлас про', 'атлас'] }),
  m('Geely', 'Monjaro', 'crossover', { popular: true, alias: ['монжаро', 'монджаро'] }),
  m('Geely', 'Tugella', 'crossover', { alias: ['тугелла', 'тагелла'] }),
  m('Geely', 'Emgrand', 'sedan', { alias: ['эмгранд'] }),
  // BMW
  m('BMW', '3 Series', 'sedan', { alias: ['3 серии', 'тройка', '320', '330'], generations: ['F30 (2011–2019)', 'G20 (2018–)'] }),
  m('BMW', '5 Series', 'sedan', { alias: ['5 серии', 'пятерка', '520', '530'], generations: ['F10 (2010–2017)', 'G30 (2016–2023)', 'G60 (2023–)'] }),
  m('BMW', 'X3', 'crossover', { alias: ['х3', 'икс 3'] }),
  m('BMW', 'X5', 'suv', { alias: ['х5', 'икс 5'], generations: ['F15 (2013–2018)', 'G05 (2018–)'] }),
  // Mercedes-Benz
  m('Mercedes-Benz', 'C-Class', 'sedan', { alias: ['ц класс', 'с класс', 'c класс', 'цешка'], generations: ['W205 (2014–2021)', 'W206 (2021–)'] }),
  m('Mercedes-Benz', 'E-Class', 'sedan', { alias: ['е класс', 'e класс', 'ешка'], generations: ['W213 (2016–2023)', 'W214 (2023–)'] }),
  m('Mercedes-Benz', 'GLC', 'crossover', { alias: ['глц', 'гле ц'] }),
  m('Mercedes-Benz', 'GLE', 'suv', { alias: ['гле'], generations: ['W166 (2015–2019)', 'V167 (2019–)'] }),
  m('Mercedes-Benz', 'G-Class', 'suv', { alias: ['гелик', 'гелендваген', 'g класс'] }),
  m('Mercedes-Benz', 'V-Class', 'minivan', { alias: ['в класс', 'v класс', 'виано'] }),
  // Renault
  m('Renault', 'Logan', 'sedan', { popular: true, alias: ['логан'], generations: ['I (2004–2015)', 'II (2014–2022)'] }),
  m('Renault', 'Sandero', 'hatchback', { alias: ['сандеро'] }),
  m('Renault', 'Sandero Stepway', 'hatchback', { alias: ['степвей', 'сандеро степвей'] }),
  m('Renault', 'Duster', 'crossover', { popular: true, alias: ['дастер'], generations: ['I (2010–2021)', 'II (2021–)'] }),
  m('Renault', 'Kaptur', 'crossover', { alias: ['каптур'] }),
  m('Renault', 'Arkana', 'crossover', { alias: ['аркана'] }),
  // Nissan
  m('Nissan', 'Almera', 'sedan', { alias: ['альмера'] }),
  m('Nissan', 'Qashqai', 'crossover', { alias: ['кашкай'], generations: ['J11 (2013–2021)', 'J12 (2021–)'] }),
  m('Nissan', 'X-Trail', 'crossover', { alias: ['икстрейл', 'х-трейл', 'xtrail', 'хтрейл'], generations: ['T32 (2013–2022)', 'T33 (2021–)'] }),
  m('Nissan', 'Terrano', 'crossover', { alias: ['террано'] }),
  // Lexus
  m('Lexus', 'ES', 'sedan', { alias: ['ес', 'ес250'] }),
  m('Lexus', 'NX', 'crossover', { alias: ['нх', 'нх200'] }),
  m('Lexus', 'RX', 'crossover', { alias: ['рх', 'рх350'], generations: ['AL20 (2015–2022)', 'AL30 (2022–)'] }),
  m('Lexus', 'LX', 'suv', { alias: ['лх', 'лх570'] }),
  // Китай — прочие
  m('Exeed', 'LX', 'crossover', { alias: ['эксид лх'] }),
  m('Exeed', 'TXL', 'crossover', { alias: ['эксид тхл', 'txl'] }),
  m('Exeed', 'VX', 'crossover', { alias: ['эксид вх'] }),
  m('Changan', 'CS35 Plus', 'crossover', { alias: ['цс35', 'cs35'] }),
  m('Changan', 'CS55 Plus', 'crossover', { alias: ['цс55', 'cs55'] }),
  m('Changan', 'CS75 Plus', 'crossover', { alias: ['цс75', 'cs75'] }),
  m('Changan', 'UNI-K', 'crossover', { alias: ['юни к', 'уни к', 'unik'] }),
  m('Changan', 'UNI-V', 'hatchback', { bodyName: 'Лифтбек', alias: ['юни в', 'уни в', 'univ'] }),
  m('Changan', 'Alsvin', 'sedan', { alias: ['алсвин', 'альсвин'] }),
  m('Omoda', 'C5', 'crossover', { alias: ['омода с5', 'ц5'] }),
  m('Tank', '300', 'suv', { alias: ['танк 300'] }),
  m('Jetour', 'Dashing', 'crossover', { alias: ['дашинг'] }),
  m('Belgee', 'X50', 'crossover', { alias: ['х50'] }),
  // Прочие популярные на вторичке
  m('Mitsubishi', 'Outlander', 'crossover', { alias: ['аутлендер', 'аутлэндер'] }),
  m('Mitsubishi', 'Pajero Sport', 'suv', { alias: ['паджеро спорт', 'паджеро'] }),
  m('Ford', 'Focus', 'hatchback', { alias: ['фокус'] }),
  m('Chevrolet', 'Cruze', 'sedan', { alias: ['круз'] }),
];

/* ───────── Поиск ───────── */

const CYR: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y',
  ь: '', э: 'e', ю: 'yu', я: 'ya',
};

export function normalizeCarQuery(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е').replace(/[‐-―]/g, '-').replace(/\s+/g, ' ').trim();
}
const squash = (s: string) => s.replace(/[\s\-_.']/g, '');
const translit = (s: string) => s.replace(/[а-я]/g, (c) => CYR[c] ?? c);

interface Indexed {
  car: CarModel;
  words: string[];
}

let INDEX: Indexed[] | null = null;
function index(): Indexed[] {
  if (INDEX) return INDEX;
  INDEX = CAR_MODELS.map((car) => {
    const base = [car.make, car.model, `${car.make} ${car.model}`, ...(MAKE_ALIASES[car.make] ?? []), ...(car.alias ?? [])];
    const makeAl = MAKE_ALIASES[car.make] ?? [];
    // «мазда 6», «киа рио» — сочетания кириллической марки с моделью
    for (const a of makeAl) {
      base.push(`${a} ${car.model}`);
      for (const ma of car.alias ?? []) base.push(`${a} ${ma}`);
    }
    const words = new Set<string>();
    for (const b of base) {
      const n = normalizeCarQuery(b);
      words.add(squash(n));
      words.add(squash(translit(n)));
    }
    return { car, words: [...words] };
  });
  return INDEX;
}

/** Поиск моделей по марке/модели, кириллицей или латиницей. */
export function searchCars(query: string, limit = 8): CarModel[] {
  const q = normalizeCarQuery(query);
  if (!q) return [];
  const qs = squash(q);
  const qt = squash(translit(q));
  const tokens = q.split(' ').filter(Boolean);
  const scored: { car: CarModel; score: number }[] = [];
  for (const { car, words } of index()) {
    let score = 0;
    for (const w of words) {
      if (w === qs || w === qt) score = Math.max(score, 100);
      else if (w.startsWith(qs) || w.startsWith(qt)) score = Math.max(score, 60 - Math.min(20, w.length - qs.length));
      else if (qs.length >= 2 && (w.includes(qs) || w.includes(qt))) score = Math.max(score, 25);
    }
    if (!score && tokens.length > 1) {
      // каждое слово запроса должно найтись хоть где-то
      const ok = tokens.every((t) => {
        const ts = squash(t);
        const tt = squash(translit(t));
        return words.some((w) => w.startsWith(ts) || w.startsWith(tt) || (ts.length >= 2 && w.includes(ts)));
      });
      if (ok) score = 20;
    }
    if (score) scored.push({ car, score: score + (car.popular ? 5 : 0) });
  }
  scored.sort((a, b) => b.score - a.score || a.car.make.localeCompare(b.car.make) || a.car.model.localeCompare(b.car.model));
  return scored.slice(0, limit).map((s) => s.car);
}

export function findCarModel(make: string, model: string): CarModel | undefined {
  const mk = normalizeCarQuery(make);
  const md = normalizeCarQuery(model);
  return CAR_MODELS.find((c) => normalizeCarQuery(c.make) === mk && normalizeCarQuery(c.model) === md);
}

export const POPULAR_CARS: CarModel[] = CAR_MODELS.filter((c) => c.popular);

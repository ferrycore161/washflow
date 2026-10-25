/** Проверка демо-сценария на собранном каталоге: печатает шаги с дозировками. */
import { readFileSync } from 'node:fs';
import { buildScenario } from '../src/domain/scenario';
import type { Product } from '../src/domain/types';

const { products } = JSON.parse(readFileSync('src/data/catalog.json', 'utf8')) as { products: Product[] };
const noQuote = products.flatMap((p) => p.applications.filter((a) => !a.sourceQuote).map(() => p.id));
console.log('методик без цитаты:', noQuote.length);
const ids = ['shine-systems-delicatewash', 'shine-systems-cherrybomb', 'shine-systems-fastquartz'];
const s = buildScenario({
  settings: { kind: 'protect', dirt: 'normal', includeWheels: false, includeInsects: false },
  car: { make: 'Mazda', model: '6', body: 'sedan' },
  equipment: [{ id: 'm', type: 'sprayer', name: 'Marolex Industry Ergo', volumeMl: 2000, fillMl: 1500, isDefault: true, createdAt: 0 }],
  owned: ids.map((id) => ({ id, productId: id, packageMl: 750, remainingMl: 750, addedAt: 0 })),
  getProduct: (id) => products.find((p) => p.id === id),
});
console.log(s.title, '·', s.estMinutes, 'мин');
s.steps.forEach((st, i) =>
  console.log(`${i + 1}. [${st.stage}] ${st.title}${st.productId ? ' · ' + st.productId.replace('shine-systems-', '') : ''}` +
    (st.recipe ? ` → ${st.recipe.chemMl} мл + ${st.recipe.waterMl} мл воды (${st.recipe.basisText})` : '') +
    (st.timerSec ? ` ⏱${st.timerSec}с` : '') + (st.skippable ? '' : ' [обяз.]')),
);
console.log('notices:', s.notices);

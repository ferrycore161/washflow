import type { Product } from './types';

const RU_LAT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

/** Нормализация для поиска: нижний регистр, транслит, без пробелов и знаков. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .split('')
    .map((c) => RU_LAT[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]/g, '');
}

/** Упрощение фонетики латиницы: «cherri bomb» ≈ «cherrybomb», «kvarc» ≈ «quartz». */
function phonetic(s: string): string {
  return s
    .replace(/qu/g, 'kv')
    .replace(/w/g, 'v')
    .replace(/x/g, 'ks')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/ck/g, 'k')
    .replace(/c/g, 'k')
    .replace(/ph/g, 'f')
    .replace(/tz|ts/g, 'c')
    .replace(/y/g, 'i')
    .replace(/(.)\1+/g, '$1');
}

const cache = new WeakMap<Product, string>();
function haystack(p: Product): string {
  let h = cache.get(p);
  if (!h) {
    const parts = [p.brand, p.name, `${p.brand} ${p.name}`, p.subtitle, ...p.aliases];
    h = parts.map((x) => `${normalize(x)}|${phonetic(normalize(x))}`).join('|');
    cache.set(p, h);
  }
  return h;
}

export function searchProducts(products: Product[], query: string): Product[] {
  const tokens = query.trim().split(/\s+/).map(normalize).filter(Boolean);
  if (!tokens.length) return products;
  const scored: { p: Product; score: number }[] = [];
  for (const p of products) {
    const h = haystack(p);
    let score = 0;
    let ok = true;
    for (const t of tokens) {
      const ph = phonetic(t);
      if (h.includes(t)) score += 2;
      else if (h.includes(ph)) score += 1;
      else {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    const name = normalize(p.name);
    if (name.startsWith(tokens[0])) score += 3;
    if (p.status === 'verified') score += 1;
    scored.push({ p, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.p);
}

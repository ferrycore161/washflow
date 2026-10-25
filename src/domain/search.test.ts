import { normalize, searchProducts } from './search';
import { ALL } from './fixtures';
import type { Product } from './types';

const cherry: Product = { ...ALL[1], id: 'ss-cb', brand: 'Shine Systems', name: 'CherryBomb', aliases: [] };
const list = [...ALL, cherry];

describe('поиск', () => {
  it('нормализует кириллицу и регистр', () => {
    expect(normalize('Шайн Систем')).toBe('shainsistem');
  });
  it('находит по бренду и названию', () => {
    expect(searchProducts(list, 'shine cherry')[0].id).toBe('ss-cb');
    expect(searchProducts(list, 'CHERRYBOMB')[0].id).toBe('ss-cb');
  });
  it('находит по русской транслитерации', () => {
    expect(searchProducts(list, 'черри бомб')[0]?.id).toBe('ss-cb');
  });
  it('пустой запрос возвращает всё', () => {
    expect(searchProducts(list, '  ')).toHaveLength(list.length);
  });
});

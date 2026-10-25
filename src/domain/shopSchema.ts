import { z } from 'zod';

/** Данные раздела «Покупки»: проверенные ссылки на магазины и аксессуары (shop-src/offers.json). */
export const storeSchema = z.enum(['official', 'time2detailing', 'ozon', 'wildberries', 'yandex_market']);
export type Store = z.infer<typeof storeSchema>;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const offerSchema = z.object({
  store: storeSchema,
  url: z.string().url(),
  title: z.string().default(''),
  checkedAt: isoDate,
  seller: z.string().optional(),
  packageMl: z.number().positive().optional(),
});

export const productOfferSchema = offerSchema.extend({ productId: z.string().min(1) });

export const accessoryKindSchema = z.enum([
  'drying_towel',
  'wash_mitt',
  'grit_guard',
  'wheel_brush',
  'applicator',
  'sprayer',
  'foam_lance',
  'bucket',
  'trigger_sprayer',
]);
export type AccessoryKind = z.infer<typeof accessoryKindSchema>;

export const accessorySchema = z.object({
  id: z.string().min(1),
  kind: accessoryKindSchema,
  brand: z.string(),
  name: z.string(),
  description: z.string().default(''),
  sourceUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  offers: z.array(offerSchema).default([]),
});

export const shopFileSchema = z.object({
  checkedAt: isoDate.optional(),
  offers: z.array(productOfferSchema).default([]),
  accessories: z.array(accessorySchema).default([]),
});

export type ShopData = z.infer<typeof shopFileSchema>;
export type Offer = z.infer<typeof offerSchema>;
export type ProductOffer = z.infer<typeof productOfferSchema>;
export type Accessory = z.infer<typeof accessorySchema>;

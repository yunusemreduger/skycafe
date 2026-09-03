import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_PATH, 'db.json');

/** Bir menü ürününün reçetesindeki tek bir malzeme satırı */
export interface RecipeLine {
  stockItemId: string;
  /** Stok kaleminin kendi biriminde (ml / gr / adet) tüketilen miktar */
  amount: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  emoji: string;
  available: boolean;
  featured: boolean;
  createdAt: string;
  /** Ürün satıldığında stoktan düşecek malzemeler */
  recipe?: RecipeLine[];
  /** @deprecated recipe kullanılıyor — eski kayıtlar için geriye dönük destek */
  stockItemId?: string;
  /** @deprecated recipe kullanılıyor */
  stockDeductAmount?: number;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
}

export interface Order {
  id: string;
  tableNumber: string;
  customerName?: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentMethod: 'cash' | 'card';
  paymentStatus: 'unpaid' | 'paid';
  note?: string;
  /** Reçete stoktan düşüldü mü — çift düşmeyi engeller */
  stockDeducted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  costPerUnit: number;
  lastUpdated: string;
}

export interface FinanceRecord {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

export interface DebtRecord {
  id: string;
  tableNumber: string;
  customerName?: string;
  amount: number;
  description: string;
  orderId?: string;
  status: 'unpaid' | 'paid';
  createdAt: string;
  paidAt?: string;
}

export interface DB {
  menuItems: MenuItem[];
  orders: Order[];
  stockItems: StockItem[];
  financeRecords: FinanceRecord[];
  debts: DebtRecord[];
  shopOpen: boolean;
}

/**
 * Stok kalemleri — SKY Protein Bar reçete kartındaki malzemeler.
 * Birimler ml / gr / adet; reçetelerdeki miktarlarla birebir eşleşir.
 * quantity başlangıç değerleridir, admin panelinden güncellenir.
 */
const now = () => new Date().toISOString();

export const STOCK_SEED: StockItem[] = [
  // Sıvılar (ml)
  { id: 'st_badem_sutu',   name: 'Badem Sütü',              unit: 'ml', quantity: 5000,  minQuantity: 1000, costPerUnit: 0.09, lastUpdated: now() },
  { id: 'st_normal_sut',   name: 'Normal Süt',              unit: 'ml', quantity: 10000, minQuantity: 2000, costPerUnit: 0.05, lastUpdated: now() },
  { id: 'st_hindistan',    name: 'Hindistan Cevizi Suyu',   unit: 'ml', quantity: 5000,  minQuantity: 1000, costPerUnit: 0.12, lastUpdated: now() },

  // Dondurulmuş meyveler (gr)
  { id: 'st_don_muz',      name: 'Dondurulmuş Muz',         unit: 'gr', quantity: 5000, minQuantity: 1000, costPerUnit: 0.08, lastUpdated: now() },
  { id: 'st_don_orman',    name: 'Dondurulmuş Orman Meyvesi', unit: 'gr', quantity: 3000, minQuantity: 600, costPerUnit: 0.25, lastUpdated: now() },
  { id: 'st_don_ejder',    name: 'Dondurulmuş Ejder Meyvesi', unit: 'gr', quantity: 2000, minQuantity: 400, costPerUnit: 0.4,  lastUpdated: now() },
  { id: 'st_don_mango',    name: 'Dondurulmuş Mango',       unit: 'gr', quantity: 3000, minQuantity: 600, costPerUnit: 0.18, lastUpdated: now() },
  { id: 'st_don_ananas',   name: 'Dondurulmuş Ananas',      unit: 'gr', quantity: 3000, minQuantity: 600, costPerUnit: 0.16, lastUpdated: now() },
  { id: 'st_don_cilek',    name: 'Dondurulmuş Çilek',       unit: 'gr', quantity: 3000, minQuantity: 600, costPerUnit: 0.2,  lastUpdated: now() },

  // Ezmeler, tozlar, tatlandırıcılar (gr)
  { id: 'st_fistik_ezme',  name: 'Fıstık Ezmesi',           unit: 'gr', quantity: 2000, minQuantity: 400, costPerUnit: 0.45, lastUpdated: now() },
  { id: 'st_badem_ezme',   name: 'Badem Ezmesi',            unit: 'gr', quantity: 1500, minQuantity: 300, costPerUnit: 0.6,  lastUpdated: now() },
  { id: 'st_acai',         name: 'Açaí Tozu',               unit: 'gr', quantity: 500,  minQuantity: 100, costPerUnit: 3.5,  lastUpdated: now() },
  { id: 'st_kolajen',      name: 'Kolajen',                 unit: 'gr', quantity: 500,  minQuantity: 100, costPerUnit: 4,    lastUpdated: now() },
  { id: 'st_granola',      name: 'Granola',                 unit: 'gr', quantity: 1000, minQuantity: 200, costPerUnit: 0.35, lastUpdated: now() },
  { id: 'st_keten',        name: 'Keten Tohumu',            unit: 'gr', quantity: 500,  minQuantity: 100, costPerUnit: 0.3,  lastUpdated: now() },
  { id: 'st_bal',          name: 'Bal',                     unit: 'gr', quantity: 1000, minQuantity: 200, costPerUnit: 0.5,  lastUpdated: now() },
  { id: 'st_tarcin',       name: 'Tarçın',                  unit: 'gr', quantity: 200,  minQuantity: 50,  costPerUnit: 1.2,  lastUpdated: now() },
  { id: 'st_zerdecal',     name: 'Zerdeçal',                unit: 'gr', quantity: 200,  minQuantity: 50,  costPerUnit: 1.5,  lastUpdated: now() },
  { id: 'st_hurma',        name: 'Çekirdeksiz Hurma',       unit: 'gr', quantity: 1500, minQuantity: 300, costPerUnit: 0.55, lastUpdated: now() },

  // Taze ürünler (gr)
  { id: 'st_yogurt',       name: 'Süzme Yoğurt',            unit: 'gr', quantity: 2000, minQuantity: 500, costPerUnit: 0.22, lastUpdated: now() },
  { id: 'st_ispanak',      name: 'Ispanak',                 unit: 'gr', quantity: 1000, minQuantity: 200, costPerUnit: 0.15, lastUpdated: now() },
  { id: 'st_kale',         name: 'Kale',                    unit: 'gr', quantity: 800,  minQuantity: 150, costPerUnit: 0.35, lastUpdated: now() },
  { id: 'st_zencefil',     name: 'Taze Zencefil',           unit: 'gr', quantity: 300,  minQuantity: 80,  costPerUnit: 0.4,  lastUpdated: now() },

  // Kahve / matcha — reçeteleri henüz tanımlı değil
  { id: 'st_kahve',        name: 'Kahve Çekirdeği',         unit: 'gr', quantity: 5000, minQuantity: 1000, costPerUnit: 0.15, lastUpdated: now() },
  { id: 'st_matcha',       name: 'Matcha Tozu',             unit: 'gr', quantity: 500,  minQuantity: 100,  costPerUnit: 4,    lastUpdated: now() },
];

/**
 * Ürün adı -> reçete eşlemesi (SKY Protein Bar 550 ml personel reçete kartı).
 * Hem defaultDB hem de /api/admin/seed-recipes bu tek kaynağı kullanır.
 */
export const RECIPE_SEED: Record<string, RecipeLine[]> = {
  'Power PB': [
    { stockItemId: 'st_badem_sutu',  amount: 180 },
    { stockItemId: 'st_don_muz',     amount: 160 },
    { stockItemId: 'st_acai',        amount: 10 },
    { stockItemId: 'st_fistik_ezme', amount: 30 },
    { stockItemId: 'st_granola',     amount: 25 },
  ],
  'Berry Boost': [
    { stockItemId: 'st_normal_sut', amount: 170 },
    { stockItemId: 'st_don_orman',  amount: 160 },
    { stockItemId: 'st_don_ejder',  amount: 80 },
    { stockItemId: 'st_don_muz',    amount: 100 },
    { stockItemId: 'st_bal',        amount: 10 },
  ],
  'Tropical Escape': [
    { stockItemId: 'st_hindistan',  amount: 160 },
    { stockItemId: 'st_don_mango',  amount: 160 },
    { stockItemId: 'st_don_ananas', amount: 150 },
    { stockItemId: 'st_keten',      amount: 8 },
    { stockItemId: 'st_kolajen',    amount: 10 },
  ],
  'Nutty Fuel': [
    { stockItemId: 'st_badem_sutu',  amount: 150 },
    { stockItemId: 'st_don_muz',     amount: 180 },
    { stockItemId: 'st_yogurt',      amount: 80 },
    { stockItemId: 'st_fistik_ezme', amount: 30 },
    { stockItemId: 'st_tarcin',      amount: 2 },
  ],
  'Berry Bliss': [
    { stockItemId: 'st_normal_sut', amount: 150 },
    { stockItemId: 'st_don_cilek',  amount: 180 },
    { stockItemId: 'st_don_muz',    amount: 120 },
    { stockItemId: 'st_yogurt',     amount: 80 },
    { stockItemId: 'st_bal',        amount: 10 },
  ],
  'Green Gold': [
    { stockItemId: 'st_hindistan', amount: 160 },
    { stockItemId: 'st_don_mango', amount: 180 },
    { stockItemId: 'st_ispanak',   amount: 35 },
    { stockItemId: 'st_kale',      amount: 25 },
    { stockItemId: 'st_zencefil',  amount: 5 },
  ],
  'Golden Boost': [
    { stockItemId: 'st_hindistan',  amount: 150 },
    { stockItemId: 'st_don_muz',    amount: 100 },
    { stockItemId: 'st_don_mango',  amount: 120 },
    { stockItemId: 'st_don_ananas', amount: 120 },
    { stockItemId: 'st_zencefil',   amount: 5 },
    { stockItemId: 'st_zerdecal',   amount: 2 },
    { stockItemId: 'st_bal',        amount: 10 },
  ],
  'Date Power': [
    { stockItemId: 'st_normal_sut', amount: 160 },
    { stockItemId: 'st_don_muz',    amount: 180 },
    { stockItemId: 'st_hurma',      amount: 45 },
    { stockItemId: 'st_badem_ezme', amount: 30 },
    { stockItemId: 'st_tarcin',     amount: 2 },
  ],
};

const defaultDB: DB = {
  shopOpen: true,
  menuItems: [
    // Smoothie
    { id: 'm1', name: 'Power PB', description: 'Muz, Açaí tozu, Fıstık ezmesi, Granola, Badem sütü · 510 kcal', price: 550, category: 'Smoothie', emoji: '🥤', available: true, featured: true, createdAt: now(),
      recipe: RECIPE_SEED['Power PB'] },
    { id: 'm2', name: 'Berry Boost', description: 'Karışık orman meyveleri, Ejder meyvesi, Muz, Bal, Tercihe göre süt · 330 kcal', price: 550, category: 'Smoothie', emoji: '🫐', available: true, featured: true, createdAt: now(),
      recipe: RECIPE_SEED['Berry Boost'] },
    { id: 'm3', name: 'Tropical Escape', description: 'Mango, Ananas, Keten tohumu, Kolajen, Hindistan cevizi suyu · 290 kcal', price: 550, category: 'Smoothie', emoji: '🥭', available: true, featured: false, createdAt: now(),
      recipe: RECIPE_SEED['Tropical Escape'] },
    { id: 'm4', name: 'Nutty Fuel', description: 'Muz, Süzme yoğurt, Fıstık ezmesi, Tarçın, Badem sütü · 445 kcal', price: 550, category: 'Smoothie', emoji: '🥜', available: true, featured: false, createdAt: now(),
      recipe: RECIPE_SEED['Nutty Fuel'] },
    { id: 'm5', name: 'Berry Bliss', description: 'Çilek, Muz, Süzme yoğurt, Bal, Normal süt · 365 kcal', price: 550, category: 'Smoothie', emoji: '🍓', available: true, featured: false, createdAt: now(),
      recipe: RECIPE_SEED['Berry Bliss'] },
    { id: 'm6', name: 'Green Gold', description: 'Kale, Ispanak, Mango, Zencefil, Hindistan cevizi suyu · 165 kcal', price: 550, category: 'Smoothie', emoji: '🥬', available: true, featured: false, createdAt: now(),
      recipe: RECIPE_SEED['Green Gold'] },
    { id: 'm7', name: 'Golden Boost', description: 'Zencefil, Zerdeçal, Muz, Mango, Ananas, Bal, Hindistan cevizi suyu · 290 kcal', price: 550, category: 'Smoothie', emoji: '✨', available: true, featured: false, createdAt: now(),
      recipe: RECIPE_SEED['Golden Boost'] },
    { id: 'm8', name: 'Date Power', description: 'Hurma, Muz, Badem ezmesi, Tarçın, Normal süt · 575 kcal', price: 550, category: 'Smoothie', emoji: '🌴', available: true, featured: false, createdAt: now(),
      recipe: RECIPE_SEED['Date Power'] },
    // Kahve
    { id: 'm9', name: 'Espresso', description: 'Saf espresso', price: 140, category: 'Kahve', emoji: '☕', available: true, featured: false, createdAt: new Date().toISOString() },
    { id: 'm10', name: 'Americano', description: 'Espresso + sıcak su', price: 180, category: 'Kahve', emoji: '☕', available: true, featured: false, createdAt: new Date().toISOString() },
    { id: 'm11', name: 'Latte', description: 'Espresso + buharda ısıtılmış süt', price: 200, category: 'Kahve', emoji: '🥛', available: true, featured: true, createdAt: new Date().toISOString() },
    { id: 'm12', name: 'Cappuccino', description: 'Espresso + süt köpüğü', price: 200, category: 'Kahve', emoji: '☕', available: true, featured: false, createdAt: new Date().toISOString() },
    { id: 'm13', name: 'Ice Americano', description: 'Soğuk Americano, buzlu servis', price: 190, category: 'Kahve', emoji: '🧊', available: true, featured: false, createdAt: new Date().toISOString() },
    { id: 'm14', name: 'Ice Latte', description: 'Soğuk latte, buzlu servis', price: 210, category: 'Kahve', emoji: '🧊', available: true, featured: false, createdAt: new Date().toISOString() },
    // Matcha
    { id: 'm15', name: 'Matcha Latte', description: 'Sıcak matcha latte', price: 220, category: 'Matcha', emoji: '🍵', available: true, featured: true, createdAt: new Date().toISOString() },
    { id: 'm16', name: 'Ice Matcha Latte', description: 'Soğuk matcha latte, buzlu servis', price: 230, category: 'Matcha', emoji: '🍵', available: true, featured: false, createdAt: new Date().toISOString() },
  ],
  orders: [],
  stockItems: STOCK_SEED,
  financeRecords: [
    { id: '1', type: 'income', category: 'Satış', amount: 1250, description: 'Günlük kasa geliri', date: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString() },
    { id: '2', type: 'expense', category: 'Malzeme', amount: 320, description: 'Kahve ve süt alımı', date: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString() },
  ],
  debts: [],
};

// ---------------------------------------------------------------------------
// Storage katmanı
// Production: Upstash Redis (REST API) — Vercel gibi serverless ortamlarda kalıcı
// Local dev:  data/db.json dosyası
// ---------------------------------------------------------------------------

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_KEY = 'skycafe:db';
const useRedis = Boolean(REDIS_URL && REDIS_TOKEN);

async function redisCommand(command: unknown[]): Promise<unknown> {
  const res = await fetch(REDIS_URL!, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Redis hatası (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return data.result;
}

function ensureDataDir() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(DB_PATH, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2));
  }
}

/** Eksik alanları defaultDB'den tamamlar (şema değişikliklerine karşı) */
function normalize(db: Partial<DB>): DB {
  return {
    menuItems: db.menuItems ?? defaultDB.menuItems,
    orders: db.orders ?? [],
    stockItems: db.stockItems ?? defaultDB.stockItems,
    financeRecords: db.financeRecords ?? [],
    debts: db.debts ?? [],
    shopOpen: db.shopOpen ?? true,
  };
}

export async function readDB(): Promise<DB> {
  if (useRedis) {
    const raw = await redisCommand(['GET', REDIS_KEY]);
    if (!raw) {
      await writeDB(defaultDB);
      return defaultDB;
    }
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return normalize(parsed);
  }

  ensureDataDir();
  const content = fs.readFileSync(DB_FILE, 'utf-8');
  return normalize(JSON.parse(content));
}

export async function writeDB(db: DB): Promise<void> {
  if (useRedis) {
    await redisCommand(['SET', REDIS_KEY, JSON.stringify(db)]);
    return;
  }

  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

/** DB'yi fabrika ayarlarına döndürür (menü + stok default, sipariş/borç/finans sıfır) */
export async function resetDB(): Promise<DB> {
  await writeDB(defaultDB);
  return defaultDB;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

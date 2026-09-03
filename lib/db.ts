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

const defaultDB: DB = {
  shopOpen: true,
  menuItems: [
    // Smoothie
    { id: 'm1', name: 'Power PB', description: 'Muz, Açaí tozu, Fıstık ezmesi, Granola, Badem sütü · 510 kcal', price: 550, category: 'Smoothie', emoji: '🥤', available: true, featured: true, createdAt: new Date().toISOString(),
      recipe: [
        { stockItemId: 's3', amount: 1 },    // Muz — 1 adet
        { stockItemId: 's5', amount: 5 },    // Açaí tozu — 5 gr
        { stockItemId: 's4', amount: 20 },   // Fıstık ezmesi — 20 gr
        { stockItemId: 's2', amount: 25 },   // Granola — 25 gr
        { stockItemId: 's1', amount: 130 },  // Badem sütü — 130 ml
      ] },
    { id: 'm2', name: 'Berry Boost', description: 'Karışık orman meyveleri, Ejder meyvesi, Muz, Bal, Tercihe göre süt · 330 kcal', price: 550, category: 'Smoothie', emoji: '🫐', available: true, featured: true, createdAt: new Date().toISOString() },
    { id: 'm3', name: 'Tropical Escape', description: 'Mango, Ananas, Keten tohumu, Kolajen, Hindistan cevizi suyu · 290 kcal', price: 550, category: 'Smoothie', emoji: '🥭', available: true, featured: false, createdAt: new Date().toISOString() },
    { id: 'm4', name: 'Nutty Fuel', description: 'Muz, Süzme yoğurt, Fıstık ezmesi, Tarçın, Badem sütü · 445 kcal', price: 550, category: 'Smoothie', emoji: '🥜', available: true, featured: false, createdAt: new Date().toISOString() },
    { id: 'm5', name: 'Berry Bliss', description: 'Çilek, Muz, Süzme yoğurt, Bal, Yağlı süt · 365 kcal', price: 550, category: 'Smoothie', emoji: '🍓', available: true, featured: false, createdAt: new Date().toISOString() },
    { id: 'm6', name: 'Green Gold', description: 'Kale, Ispanak, Mango, Zencefil, Hindistan cevizi suyu · 165 kcal', price: 550, category: 'Smoothie', emoji: '🥬', available: true, featured: false, createdAt: new Date().toISOString() },
    { id: 'm7', name: 'Golden Boost', description: 'Zencefil, Zerdeçal, Muz, Mango, Ananas, Bal, Hindistan cevizi suyu · 290 kcal', price: 550, category: 'Smoothie', emoji: '✨', available: true, featured: false, createdAt: new Date().toISOString() },
    { id: 'm8', name: 'Date Power', description: 'Hurma, Muz, Badem ezmesi, Kakao nibs, Tarçın, Yağlı süt · 575 kcal', price: 550, category: 'Smoothie', emoji: '🌴', available: true, featured: false, createdAt: new Date().toISOString() },
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
  stockItems: [
    // Birimler ml / gr / adet — reçetelerle birebir eşleşsin diye
    { id: 's1', name: 'Badem Sütü', unit: 'ml', quantity: 5000, minQuantity: 1000, costPerUnit: 0.09, lastUpdated: new Date().toISOString() },
    { id: 's2', name: 'Granola', unit: 'gr', quantity: 1000, minQuantity: 200, costPerUnit: 0.35, lastUpdated: new Date().toISOString() },
    { id: 's3', name: 'Muz', unit: 'adet', quantity: 40, minQuantity: 10, costPerUnit: 12, lastUpdated: new Date().toISOString() },
    { id: 's4', name: 'Fıstık Ezmesi', unit: 'gr', quantity: 2000, minQuantity: 300, costPerUnit: 0.45, lastUpdated: new Date().toISOString() },
    { id: 's5', name: 'Açaí Tozu', unit: 'gr', quantity: 500, minQuantity: 100, costPerUnit: 3.5, lastUpdated: new Date().toISOString() },
    { id: 's6', name: 'Yağlı Süt', unit: 'ml', quantity: 10000, minQuantity: 2000, costPerUnit: 0.05, lastUpdated: new Date().toISOString() },
    { id: 's7', name: 'Kahve Çekirdeği', unit: 'gr', quantity: 5000, minQuantity: 1000, costPerUnit: 0.15, lastUpdated: new Date().toISOString() },
    { id: 's8', name: 'Matcha Tozu', unit: 'gr', quantity: 500, minQuantity: 100, costPerUnit: 4, lastUpdated: new Date().toISOString() },
  ],
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

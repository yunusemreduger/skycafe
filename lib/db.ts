import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_PATH, 'db.json');

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

export interface DB {
  menuItems: MenuItem[];
  orders: Order[];
  stockItems: StockItem[];
  financeRecords: FinanceRecord[];
  shopOpen: boolean;
}

const defaultDB: DB = {
  shopOpen: true,
  menuItems: [
    // Sandviçler
    { id: 'm1', name: 'Club Sandviç', description: 'Dana jambon, domates, kaşar peyniri, baby marul, salatalık, pesto sos. Patates kızartması ile.', price: 380, category: 'Sandviçler', emoji: '🥪', available: true, featured: true, createdAt: new Date().toISOString() },
    { id: 'm2', name: 'Tavuklu Sandviç', description: 'Izgara tavuk, domates, baby marul, salatalık, pesto sos. Patates kızartması ile.', price: 450, category: 'Sandviçler', emoji: '🥙', available: true, featured: false, createdAt: new Date().toISOString() },
    { id: 'm3', name: 'Ton Balıklı Sandviç', description: 'Ton balığı, baby marul, salatalık, domates, pesto sos. Patates kızartması ile.', price: 480, category: 'Sandviçler', emoji: '🐟', available: true, featured: false, createdAt: new Date().toISOString() },
    // Kahvaltı
    { id: 'm4', name: 'Sky Breakfast', description: 'Avokado, salatalık, haşlanmış yumurta (5 adet), 1 adet mini club sandviç, kuru kayısı, ceviz, kırmızı pancar, filtre kahve.', price: 450, category: 'Kahvaltı', emoji: '🍳', available: true, featured: true, createdAt: new Date().toISOString() },
    // Fit / Protein
    { id: 'm5', name: 'Dip Avokado & Çırpılmış Yumurtalı Sandviç', description: 'Ekşi mayalı ekmek, dip avokado, çırpılmış yumurta, baby marul, domates, salatalık, karabiber, tuz, zeytinyağı, pesto sos. Filtre kahve ile servis edilir.', price: 480, category: 'Fit / Protein', emoji: '🥑', available: true, featured: true, createdAt: new Date().toISOString() },
    { id: 'm6', name: 'Basmati Tavuk (250 gr)', description: 'Haşlanmış tavuk, basmati pirinç, baby marul.', price: 350, category: 'Fit / Protein', emoji: '🍗', available: true, featured: false, createdAt: new Date().toISOString() },
    { id: 'm7', name: 'Protein Shake', description: '30 gr protein, muz, süt, ceviz.', price: 350, category: 'Fit / Protein', emoji: '🥤', available: true, featured: false, createdAt: new Date().toISOString() },
    { id: 'm8', name: 'Sky Protein Salata', description: 'Akdeniz yeşillikleri, baby marul, portakal marineli ızgara tavuk, avokado, domates, salatalık, kırmızı pancar, ceviz, nar ekşili sos.', price: 550, category: 'Fit / Protein', emoji: '🥗', available: true, featured: false, createdAt: new Date().toISOString() },
    // Ana Yemekler
    { id: 'm9', name: 'Köfte', description: '6 adet köfte, baby marul, çarliston biber, domates, sweet chili sos. Tortilla ekmek dilimleri ile.', price: 500, category: 'Ana Yemekler', emoji: '🍖', available: true, featured: true, createdAt: new Date().toISOString() },
    { id: 'm10', name: 'Izgara Tavuk', description: '290 gr ızgara tavuk, baby marul, çarliston biber, domates, sweet chili sos. Tortilla ekmek dilimleri ile.', price: 500, category: 'Ana Yemekler', emoji: '🍗', available: true, featured: false, createdAt: new Date().toISOString() },
    { id: 'm11', name: 'Extra Pilav', description: 'Basmati pirinç.', price: 50, category: 'Ana Yemekler', emoji: '🍚', available: true, featured: false, createdAt: new Date().toISOString() },
    // Sides
    { id: 'm12', name: 'Parmesan Fries', description: 'Patates kızartması, parmesan peyniri.', price: 250, category: 'Sides', emoji: '🍟', available: true, featured: false, createdAt: new Date().toISOString() },
    { id: 'm13', name: 'Parmesan Chips', description: 'Patates cipsi, parmesan peyniri.', price: 200, category: 'Sides', emoji: '🫙', available: true, featured: false, createdAt: new Date().toISOString() },
    // Dondurma & Meyve
    { id: 'm14', name: 'Karpuz Peynir Nane', description: '4 dilim karpuz, beyaz peynir, taze nane.', price: 250, category: 'Dondurma & Meyve', emoji: '🍉', available: true, featured: true, createdAt: new Date().toISOString() },
    { id: 'm15', name: 'Mevsim Meyveleri', description: 'Fiyat için sorunuz.', price: 0, category: 'Dondurma & Meyve', emoji: '🍓', available: true, featured: false, createdAt: new Date().toISOString() },
    { id: 'm16', name: 'Waffle Cup Dondurma Meyve', description: 'Algida kaymaklı dondurma ile servis edilir. Kaymaklıdır.', price: 200, category: 'Dondurma & Meyve', emoji: '🧇', available: true, featured: false, createdAt: new Date().toISOString() },
  ],
  orders: [],
  stockItems: [
    { id: '1', name: 'Kahve Çekirdeği', unit: 'kg', quantity: 5, minQuantity: 2, costPerUnit: 150, lastUpdated: new Date().toISOString() },
    { id: '2', name: 'Süt', unit: 'litre', quantity: 20, minQuantity: 5, costPerUnit: 20, lastUpdated: new Date().toISOString() },
    { id: '3', name: 'Şeker', unit: 'kg', quantity: 10, minQuantity: 3, costPerUnit: 25, lastUpdated: new Date().toISOString() },
    { id: '4', name: 'Un', unit: 'kg', quantity: 8, minQuantity: 3, costPerUnit: 20, lastUpdated: new Date().toISOString() },
    { id: '5', name: 'Tereyağı', unit: 'kg', quantity: 3, minQuantity: 1, costPerUnit: 180, lastUpdated: new Date().toISOString() },
    { id: '6', name: 'Limon', unit: 'adet', quantity: 50, minQuantity: 20, costPerUnit: 3, lastUpdated: new Date().toISOString() },
  ],
  financeRecords: [
    { id: '1', type: 'income', category: 'Satış', amount: 1250, description: 'Günlük kasa geliri', date: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString() },
    { id: '2', type: 'expense', category: 'Malzeme', amount: 320, description: 'Kahve ve süt alımı', date: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString() },
  ],
};

function ensureDataDir() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(DB_PATH, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2));
  }
}

export function readDB(): DB {
  ensureDataDir();
  const content = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(content);
}

export function writeDB(db: DB): void {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

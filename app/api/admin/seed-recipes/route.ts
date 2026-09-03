import { NextResponse } from 'next/server';
import { readDB, writeDB, STOCK_SEED, RECIPE_SEED } from '@/lib/db';

/**
 * Reçete kartındaki stok kalemlerini ve smoothie reçetelerini
 * mevcut veritabanına işler. Siparişlere, borçlara ve finans
 * kayıtlarına dokunmaz.
 *
 * Yalnızca admin çağırabilir (middleware /api/admin yollarını personele kapatır).
 */
export async function POST() {
  const db = await readDB();

  // 1) Eksik stok kalemlerini ekle — mevcut miktarlara dokunma
  const mevcutIdler = new Set(db.stockItems.map(s => s.id));
  const eklenenStoklar: string[] = [];
  for (const item of STOCK_SEED) {
    if (!mevcutIdler.has(item.id)) {
      db.stockItems.push({ ...item, lastUpdated: new Date().toISOString() });
      eklenenStoklar.push(item.name);
    }
  }

  // 2) Reçeteleri ürün adına göre eşleştir
  const guncellenen: string[] = [];
  const bulunamayan: string[] = [];
  for (const [urunAdi, recipe] of Object.entries(RECIPE_SEED)) {
    const idx = db.menuItems.findIndex(
      m => m.name.toLocaleLowerCase('tr') === urunAdi.toLocaleLowerCase('tr')
    );
    if (idx === -1) { bulunamayan.push(urunAdi); continue; }
    db.menuItems[idx].recipe = recipe;
    guncellenen.push(urunAdi);
  }

  await writeDB(db);

  return NextResponse.json({
    success: true,
    eklenenStokKalemi: eklenenStoklar,
    receteYazilanUrunler: guncellenen,
    menudeBulunamayan: bulunamayan,
    ozet: `${eklenenStoklar.length} stok kalemi eklendi, ${guncellenen.length} ürüne reçete yazıldı`,
  });
}

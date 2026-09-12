import type { DB, OrderItem } from './db';

/**
 * Verilen ürünlerin reçetelerine göre stoktan düşer.
 * db nesnesini yerinde değiştirir; çağıran writeDB ile kaydeder.
 *
 * @returns Stoğu yetmeyen malzemeler için uyarı metinleri
 */
export function deductStockForItems(db: DB, items: OrderItem[]): string[] {
  const warnings: string[] = [];

  for (const item of items) {
    const menuItem = db.menuItems.find(m => m.id === item.menuItemId);
    if (!menuItem) continue;

    // Yeni reçete formatı; yoksa eski tekli stok bağlantısına düş
    const recipe = menuItem.recipe?.length
      ? menuItem.recipe
      : menuItem.stockItemId
        ? [{ stockItemId: menuItem.stockItemId, amount: menuItem.stockDeductAmount ?? 1 }]
        : [];

    for (const line of recipe) {
      const stok = db.stockItems.find(s => s.id === line.stockItemId);
      if (!stok) continue;

      const gerekli = line.amount * item.quantity;
      if (stok.quantity < gerekli) {
        warnings.push(`${stok.name}: ${gerekli} ${stok.unit} gerekiyordu, stokta ${stok.quantity} ${stok.unit} vardı`);
      }
      stok.quantity = Math.max(0, stok.quantity - gerekli);
      stok.lastUpdated = new Date().toISOString();
    }
  }

  return warnings;
}

/** Ürün listesinin toplam tutarı */
export function calcTotal(items: OrderItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

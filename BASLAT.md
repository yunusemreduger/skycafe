# ☕ SkyCafé — Başlangıç Rehberi

## Kurulum (İlk Kez)

```bash
cd skycafe
npm install
```

## Çalıştır

```bash
npm run dev
```

Tarayıcıda aç: **http://localhost:3000**

---

## Sayfalar

| URL | Açıklama |
|-----|----------|
| `http://localhost:3000/admin` | Admin paneli (dashboard) |
| `http://localhost:3000/admin/orders` | Siparişler — canlı |
| `http://localhost:3000/admin/menu` | Menü yönetimi |
| `http://localhost:3000/admin/stock` | Stok takibi |
| `http://localhost:3000/admin/finance` | Gelir & Gider |
| `http://localhost:3000/admin/qr` | QR kod üretici |
| `http://localhost:3000/menu?daire=12` | Müşteri menüsü (Daire 12) |

---

## QR Akışı

1. **Admin → QR Kodlar** sayfasına git
2. Daire numarası gir → QR oluştur → İndir veya yazdır
3. QR'ı daireye yapıştır (kapı, içeride vb.)
4. Sakin kamerasıyla okutunca `/menu?daire=XX` açılır
5. Sipariş verince **anında Admin → Siparişler**'e düşer + ses bildirimi

---

## Veriler

Tüm veriler `data/db.json` dosyasında saklanır.
İlk çalıştırmada örnek menü ve stok verileriyle başlar.

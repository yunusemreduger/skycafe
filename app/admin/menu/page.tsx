'use client';
import { useEffect, useState } from 'react';

interface RecipeLine { stockItemId: string; amount: number; }

interface MenuItem {
  id: string; name: string; description: string; price: number;
  category: string; emoji: string; available: boolean; featured: boolean; createdAt: string;
  recipe?: RecipeLine[];
  stockItemId?: string; stockDeductAmount?: number;
}

interface StockItem { id: string; name: string; unit: string; quantity: number; }

const CATEGORY_ORDER = ['Smoothie', 'Kahve', 'Matcha'];

const EMOJIS = ['☕', '🥛', '🧊', '🍋', '🍊', '🫖', '🍵', '🥤', '🍫', '🍰', '🧁', '🍩', '🥪', '🥔', '🍕', '🥗', '🍽️'];

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [form, setForm] = useState({ name: '', description: '', price: '', category: CATEGORY_ORDER[0], emoji: '☕', available: true, featured: false });
  const [recipe, setRecipe] = useState<RecipeLine[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  const fetchItems = async () => {
    const res = await fetch('/api/menu');
    setItems(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
    fetch('/api/stock').then(r => r.json()).then(setStockItems);
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', description: '', price: '', category: CATEGORY_ORDER[0], emoji: '☕', available: true, featured: false });
    setRecipe([]);
    setShowModal(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setForm({ name: item.name, description: item.description, price: String(item.price), category: item.category, emoji: item.emoji, available: item.available, featured: item.featured });
    // Eski tekli stok bağlantısı varsa reçeteye çevir
    setRecipe(
      item.recipe?.length ? item.recipe
        : item.stockItemId ? [{ stockItemId: item.stockItemId, amount: item.stockDeductAmount ?? 1 }]
        : []
    );
    setShowModal(true);
  };

  const addRecipeLine = () => setRecipe(r => [...r, { stockItemId: '', amount: 0 }]);
  const updateRecipeLine = (i: number, patch: Partial<RecipeLine>) =>
    setRecipe(r => r.map((line, idx) => idx === i ? { ...line, ...patch } : line));
  const removeRecipeLine = (i: number) => setRecipe(r => r.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!form.name || !form.price) return;
    const payload = {
      ...form,
      recipe: recipe.filter(l => l.stockItemId && l.amount > 0),
      stockItemId: '',          // eski alanları temizle
      stockDeductAmount: 0,
    };
    if (editItem) {
      await fetch(`/api/menu/${editItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
      await fetch('/api/menu', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    setShowModal(false);
    fetchItems();
  };

  /** Bir reçetenin toplam malzeme maliyeti (varsa) */
  const recipeCost = (lines: RecipeLine[]) => lines.reduce((sum, l) => {
    const s = stockItems.find(x => x.id === l.stockItemId) as (StockItem & { costPerUnit?: number }) | undefined;
    return sum + (s?.costPerUnit ?? 0) * l.amount;
  }, 0);

  const toggleAvailable = async (item: MenuItem) => {
    await fetch(`/api/menu/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ available: !item.available }) });
    fetchItems();
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    await fetch(`/api/menu/${id}`, { method: 'DELETE' });
    fetchItems();
  };

  // Derive unique categories from actual items, using preferred order
  const uniqueCats = [...new Set(items.map(i => i.category))].sort(
    (a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a);
      const bi = CATEGORY_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    }
  );
  const categories = ['all', ...uniqueCats];
  const filtered = filterCat === 'all' ? items : items.filter(i => i.category === filterCat);
  const groupedByCategory = uniqueCats.reduce((acc, cat) => {
    const catItems = filtered.filter(i => i.category === cat);
    if (catItems.length) acc[cat] = catItems;
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (loading) return <div style={{ color: '#6B6456', padding: '40px' }}>Yükleniyor...</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Menü Yönetimi</h1>
          <p style={{ color: '#746C5C', fontSize: '13px' }}>{items.length} ürün</p>
        </div>
        <button
          onClick={openCreate}
          style={{
            padding: '10px 20px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #2A7049, #256844)',
            border: 'none', color: '#fff', fontWeight: 700,
            fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          + Yeni Ürün
        </button>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            style={{
              padding: '7px 14px', borderRadius: '8px',
              cursor: 'pointer', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap',
              background: filterCat === cat ? 'rgba(42,112,73,0.15)' : '#FFFFFF',
              color: filterCat === cat ? '#2A7049' : '#6B6456',
              border: filterCat === cat ? '1px solid rgba(42,112,73,0.3)' : '1px solid #E3DACA',
            }}
          >
            {cat === 'all' ? '🍽️ Tümü' : cat}
          </button>
        ))}
      </div>

      {/* Items by category */}
      {Object.entries(groupedByCategory).map(([cat, catItems]) => (
        <div key={cat} style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#746C5C', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
            {cat}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {catItems.map(item => (
              <div key={item.id} className="card-hover" style={{
                background: '#FFFFFF',
                border: '1px solid #E3DACA',
                borderRadius: '14px', padding: '18px',
                opacity: item.available ? 1 : 0.5,
              }}>
                <div style={{ display: 'flex', gap: '14px' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '12px',
                    background: '#FAF7F0', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '24px', flexShrink: 0
                  }}>{item.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{item.name}</div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {item.featured && (
                            <span style={{ fontSize: '10px', background: 'rgba(42,112,73,0.15)', color: '#2A7049', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              ⭐ Öne Çıkan
                            </span>
                          )}
                          {item.recipe?.length ? (
                            <span style={{ fontSize: '10px', background: 'rgba(42,112,73,0.12)', color: '#256844', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              🧾 {item.recipe.length} malzeme
                            </span>
                          ) : (
                            <span style={{ fontSize: '10px', background: 'rgba(107,100,86,0.1)', color: '#746C5C', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              reçetesiz
                            </span>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#2A7049', flexShrink: 0 }}>₺{item.price}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#746C5C', margin: '6px 0 0', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.description}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button
                    onClick={() => toggleAvailable(item)}
                    style={{
                      flex: 1, padding: '7px', borderRadius: '8px',
                      background: item.available ? 'rgba(42,112,73,0.1)' : 'rgba(192,57,43,0.1)',
                      border: item.available ? '1px solid rgba(42,112,73,0.2)' : '1px solid rgba(192,57,43,0.2)',
                      color: item.available ? '#256844' : '#A32D22',
                      fontSize: '12px', cursor: 'pointer', fontWeight: 500
                    }}
                  >
                    {item.available ? '✓ Mevcut' : '✗ Tükendi'}
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    style={{
                      padding: '7px 14px', borderRadius: '8px',
                      background: '#FAF7F0', border: '1px solid #E3DACA',
                      color: '#6B6456', fontSize: '12px', cursor: 'pointer'
                    }}
                  >✏️</button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    style={{
                      padding: '7px 14px', borderRadius: '8px',
                      background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.15)',
                      color: '#A32D22', fontSize: '12px', cursor: 'pointer'
                    }}
                  >🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(46,43,36,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '20px'
        }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{
            background: '#FFFFFF', border: '1px solid #E3DACA',
            borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '480px',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>
              {editItem ? '✏️ Ürünü Düzenle' : '+ Yeni Ürün Ekle'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Emoji picker */}
              <div>
                <label style={{ fontSize: '12px', color: '#746C5C', display: 'block', marginBottom: '8px' }}>Emoji</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                      style={{
                        width: '40px', height: '40px', borderRadius: '8px', border: 'none',
                        background: form.emoji === e ? 'rgba(42,112,73,0.2)' : '#FAF7F0',
                        cursor: 'pointer', fontSize: '20px',
                        outline: form.emoji === e ? '2px solid #2A7049' : 'none',
                      }}
                    >{e}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#746C5C', display: 'block', marginBottom: '6px' }}>Ürün Adı *</label>
                <input
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="örn. Türk Kahvesi"
                  style={{ width: '100%', padding: '10px 14px', background: '#FAF7F0', border: '1px solid #D6CBB6', borderRadius: '10px', color: '#2E2B24', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#746C5C', display: 'block', marginBottom: '6px' }}>Açıklama</label>
                <textarea
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Kısa açıklama..."
                  rows={2}
                  style={{ width: '100%', padding: '10px 14px', background: '#FAF7F0', border: '1px solid #D6CBB6', borderRadius: '10px', color: '#2E2B24', fontSize: '14px', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#746C5C', display: 'block', marginBottom: '6px' }}>Fiyat (₺) *</label>
                  <input
                    type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="0"
                    style={{ width: '100%', padding: '10px 14px', background: '#FAF7F0', border: '1px solid #D6CBB6', borderRadius: '10px', color: '#2E2B24', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#746C5C', display: 'block', marginBottom: '6px' }}>Kategori</label>
                  <select
                    value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', background: '#FAF7F0', border: '1px solid #D6CBB6', borderRadius: '10px', color: '#2E2B24', fontSize: '14px', outline: 'none' }}
                  >
                    {CATEGORY_ORDER.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#6B6456' }}>
                  <input type="checkbox" checked={form.available} onChange={e => setForm(f => ({ ...f, available: e.target.checked }))} />
                  Mevcut
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#6B6456' }}>
                  <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
                  ⭐ Öne Çıkan
                </label>
              </div>
            </div>

            {/* Reçete — çoklu malzeme */}
            <div style={{ marginTop: '16px', padding: '14px', background: '#EFE8DA', borderRadius: '10px', border: '1px solid #E3DACA' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', color: '#746C5C', fontWeight: 600 }}>🧾 Reçete — 1 adet için kullanılan malzemeler</div>
                {recipe.length > 0 && recipeCost(recipe) > 0 && (
                  <div style={{ fontSize: '11px', color: '#2A7049', fontWeight: 600 }}>
                    Maliyet ≈ ₺{recipeCost(recipe).toFixed(2)}
                  </div>
                )}
              </div>

              {recipe.length === 0 && (
                <div style={{ fontSize: '12px', color: '#7A7263', padding: '8px 0 12px' }}>
                  Henüz malzeme eklenmedi. Sipariş tamamlandığında stok düşmesi için malzeme ekleyin.
                </div>
              )}

              {recipe.map((line, i) => {
                const stok = stockItems.find(s => s.id === line.stockItemId);
                return (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginBottom: '8px' }}>
                    <div style={{ flex: 2 }}>
                      <select
                        value={line.stockItemId}
                        onChange={e => updateRecipeLine(i, { stockItemId: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', background: '#FFFFFF', border: '1px solid #E3DACA', borderRadius: '8px', color: '#2E2B24', fontSize: '13px', outline: 'none' }}
                      >
                        <option value="">— Malzeme seç —</option>
                        {stockItems.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Miktar"
                        value={line.amount || ''}
                        onChange={e => updateRecipeLine(i, { amount: parseFloat(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '8px 42px 8px 10px', background: '#FFFFFF', border: '1px solid #E3DACA', borderRadius: '8px', color: '#2E2B24', fontSize: '13px', outline: 'none' }}
                      />
                      <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#746C5C', pointerEvents: 'none' }}>
                        {stok?.unit || ''}
                      </span>
                    </div>
                    <button
                      onClick={() => removeRecipeLine(i)}
                      title="Malzemeyi kaldır"
                      style={{ padding: '8px 11px', background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: '8px', color: '#A32D22', fontSize: '13px', cursor: 'pointer', lineHeight: 1 }}
                    >✕</button>
                  </div>
                );
              })}

              <button
                onClick={addRecipeLine}
                style={{ width: '100%', marginTop: '4px', padding: '9px', background: 'rgba(42,112,73,0.08)', border: '1px dashed rgba(42,112,73,0.3)', borderRadius: '8px', color: '#2A7049', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >+ Malzeme Ekle</button>

              <div style={{ fontSize: '11px', color: '#7A7263', marginTop: '10px', lineHeight: 1.5 }}>
                Miktarlar stok kaleminin birimindedir (ml / gr / adet). Sipariş <strong style={{ color: '#746C5C' }}>Tamamlandı</strong> olarak işaretlendiğinde bu malzemeler ana stoktan otomatik düşer.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  background: '#FAF7F0', border: '1px solid #E3DACA',
                  color: '#6B6456', fontSize: '14px', cursor: 'pointer'
                }}
              >İptal</button>
              <button
                onClick={save}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2A7049, #256844)',
                  border: 'none', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer'
                }}
              >{editItem ? 'Güncelle' : 'Ekle'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

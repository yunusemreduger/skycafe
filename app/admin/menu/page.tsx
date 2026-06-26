'use client';
import { useEffect, useState } from 'react';

interface MenuItem {
  id: string; name: string; description: string; price: number;
  category: string; emoji: string; available: boolean; featured: boolean; createdAt: string;
}

const CATEGORY_ORDER = ['Sandviçler', 'Kahvaltı', 'Fit / Protein', 'Ana Yemekler', 'Sides', 'Dondurma & Meyve'];

const EMOJIS = ['☕', '🥛', '🧊', '🍋', '🍊', '🫖', '🍵', '🥤', '🍫', '🍰', '🧁', '🍩', '🥪', '🥔', '🍕', '🥗', '🍽️'];

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [form, setForm] = useState({ name: '', description: '', price: '', category: CATEGORY_ORDER[0], emoji: '☕', available: true, featured: false, stockItemId: '', stockDeductAmount: '1' });
  const [stockItems, setStockItems] = useState<{ id: string; name: string; unit: string }[]>([]);

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
    setForm({ name: '', description: '', price: '', category: CATEGORY_ORDER[0], emoji: '☕', available: true, featured: false, stockItemId: '', stockDeductAmount: '1' });
    setShowModal(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setForm({ name: item.name, description: item.description, price: String(item.price), category: item.category, emoji: item.emoji, available: item.available, featured: item.featured, stockItemId: item.stockItemId || '', stockDeductAmount: String(item.stockDeductAmount ?? 1) });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name || !form.price) return;
    if (editItem) {
      await fetch(`/api/menu/${editItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    } else {
      await fetch('/api/menu', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    }
    setShowModal(false);
    fetchItems();
  };

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

  if (loading) return <div style={{ color: '#94a3b8', padding: '40px' }}>Yükleniyor...</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Menü Yönetimi</h1>
          <p style={{ color: '#64748b', fontSize: '13px' }}>{items.length} ürün</p>
        </div>
        <button
          onClick={openCreate}
          style={{
            padding: '10px 20px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            border: 'none', color: '#000', fontWeight: 700,
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
              background: filterCat === cat ? 'rgba(245,158,11,0.15)' : '#12121a',
              color: filterCat === cat ? '#f59e0b' : '#94a3b8',
              border: filterCat === cat ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {cat === 'all' ? '🍽️ Tümü' : cat}
          </button>
        ))}
      </div>

      {/* Items by category */}
      {Object.entries(groupedByCategory).map(([cat, catItems]) => (
        <div key={cat} style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
            {cat}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {catItems.map(item => (
              <div key={item.id} className="card-hover" style={{
                background: '#12121a',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '14px', padding: '18px',
                opacity: item.available ? 1 : 0.5,
              }}>
                <div style={{ display: 'flex', gap: '14px' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '12px',
                    background: '#1a1a26', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '24px', flexShrink: 0
                  }}>{item.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{item.name}</div>
                        {item.featured && (
                          <span style={{ fontSize: '10px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            ⭐ Öne Çıkan
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e', flexShrink: 0 }}>₺{item.price}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.description}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button
                    onClick={() => toggleAvailable(item)}
                    style={{
                      flex: 1, padding: '7px', borderRadius: '8px',
                      background: item.available ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      border: item.available ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(239,68,68,0.2)',
                      color: item.available ? '#4ade80' : '#f87171',
                      fontSize: '12px', cursor: 'pointer', fontWeight: 500
                    }}
                  >
                    {item.available ? '✓ Mevcut' : '✗ Tükendi'}
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    style={{
                      padding: '7px 14px', borderRadius: '8px',
                      background: '#1a1a26', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#94a3b8', fontSize: '12px', cursor: 'pointer'
                    }}
                  >✏️</button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    style={{
                      padding: '7px 14px', borderRadius: '8px',
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                      color: '#f87171', fontSize: '12px', cursor: 'pointer'
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
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '20px'
        }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{
            background: '#12121a', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '480px',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>
              {editItem ? '✏️ Ürünü Düzenle' : '+ Yeni Ürün Ekle'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Emoji picker */}
              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '8px' }}>Emoji</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                      style={{
                        width: '40px', height: '40px', borderRadius: '8px', border: 'none',
                        background: form.emoji === e ? 'rgba(245,158,11,0.2)' : '#1a1a26',
                        cursor: 'pointer', fontSize: '20px',
                        outline: form.emoji === e ? '2px solid #f59e0b' : 'none',
                      }}
                    >{e}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Ürün Adı *</label>
                <input
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="örn. Türk Kahvesi"
                  style={{ width: '100%', padding: '10px 14px', background: '#1a1a26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f8fafc', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Açıklama</label>
                <textarea
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Kısa açıklama..."
                  rows={2}
                  style={{ width: '100%', padding: '10px 14px', background: '#1a1a26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f8fafc', fontSize: '14px', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Fiyat (₺) *</label>
                  <input
                    type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="0"
                    style={{ width: '100%', padding: '10px 14px', background: '#1a1a26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f8fafc', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Kategori</label>
                  <select
                    value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', background: '#1a1a26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f8fafc', fontSize: '14px', outline: 'none' }}
                  >
                    {CATEGORY_ORDER.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#94a3b8' }}>
                  <input type="checkbox" checked={form.available} onChange={e => setForm(f => ({ ...f, available: e.target.checked }))} />
                  Mevcut
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#94a3b8' }}>
                  <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
                  ⭐ Öne Çıkan
                </label>
              </div>
            </div>

            {/* Stok bağlantısı */}
            <div style={{ marginTop: '16px', padding: '14px', background: '#0d0d18', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', fontWeight: 600 }}>📦 Stok Bağlantısı (opsiyonel)</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: '11px', color: '#475569', display: 'block', marginBottom: '6px' }}>Stok Kalemi</label>
                  <select
                    value={form.stockItemId}
                    onChange={e => setForm(f => ({ ...f, stockItemId: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', background: '#12121a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                  >
                    <option value="">— Bağlantı yok —</option>
                    {stockItems.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#475569', display: 'block', marginBottom: '6px' }}>Sipariş başına düş</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.stockDeductAmount}
                    onChange={e => setForm(f => ({ ...f, stockDeductAmount: e.target.value }))}
                    disabled={!form.stockItemId}
                    style={{ width: '100%', padding: '8px 10px', background: '#12121a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: form.stockItemId ? '#f8fafc' : '#374151', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  background: '#1a1a26', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#94a3b8', fontSize: '14px', cursor: 'pointer'
                }}
              >İptal</button>
              <button
                onClick={save}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  border: 'none', color: '#000', fontSize: '14px', fontWeight: 700, cursor: 'pointer'
                }}
              >{editItem ? 'Güncelle' : 'Ekle'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

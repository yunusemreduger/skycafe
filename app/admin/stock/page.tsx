'use client';
import { useEffect, useState } from 'react';

interface StockItem {
  id: string; name: string; unit: string; quantity: number;
  minQuantity: number; costPerUnit: number; lastUpdated: string;
}

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [adjustItem, setAdjustItem] = useState<StockItem | null>(null);
  const [adjustValue, setAdjustValue] = useState('');
  const [adjustMode, setAdjustMode] = useState<'add' | 'set'>('add');
  const [form, setForm] = useState({ name: '', unit: 'kg', quantity: '', minQuantity: '', costPerUnit: '' });

  const fetchItems = async () => {
    const res = await fetch('/api/stock');
    setItems(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', unit: 'kg', quantity: '', minQuantity: '', costPerUnit: '' });
    setShowModal(true);
  };

  const openEdit = (item: StockItem) => {
    setEditItem(item);
    setForm({ name: item.name, unit: item.unit, quantity: String(item.quantity), minQuantity: String(item.minQuantity), costPerUnit: String(item.costPerUnit) });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name || !form.quantity) return;
    if (editItem) {
      await fetch(`/api/stock/${editItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    } else {
      await fetch('/api/stock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    }
    setShowModal(false);
    fetchItems();
  };

  const doAdjust = async () => {
    if (!adjustItem || !adjustValue) return;
    const val = Number(adjustValue);
    const newQty = adjustMode === 'add' ? adjustItem.quantity + val : val;
    await fetch(`/api/stock/${adjustItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity: newQty }) });
    setAdjustItem(null);
    setAdjustValue('');
    fetchItems();
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Bu stok kalemini silmek istiyor musunuz?')) return;
    await fetch(`/api/stock/${id}`, { method: 'DELETE' });
    fetchItems();
  };

  const getStockLevel = (item: StockItem) => {
    if (item.quantity <= 0) return 'empty';
    if (item.quantity <= item.minQuantity) return 'low';
    if (item.quantity <= item.minQuantity * 1.5) return 'warning';
    return 'ok';
  };

  const levelColors: Record<string, { color: string; bg: string; label: string }> = {
    empty: { color: '#f87171', bg: 'rgba(239,68,68,0.15)', label: 'Tükendi' },
    low: { color: '#fb923c', bg: 'rgba(251,146,60,0.15)', label: 'Kritik' },
    warning: { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', label: 'Az' },
    ok: { color: '#4ade80', bg: 'rgba(34,197,94,0.15)', label: 'Yeterli' },
  };

  const lowStockItems = items.filter(i => getStockLevel(i) !== 'ok');

  if (loading) return <div style={{ color: '#94a3b8', padding: '40px' }}>Yükleniyor...</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Stok Takibi</h1>
          <p style={{ color: '#64748b', fontSize: '13px' }}>{items.length} kalem · {lowStockItems.length} uyarı</p>
        </div>
        <button onClick={openCreate} style={{
          padding: '10px 20px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          border: 'none', color: '#000', fontWeight: 700, fontSize: '14px', cursor: 'pointer'
        }}>+ Stok Ekle</button>
      </div>

      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '12px', padding: '14px 18px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f87171' }}>Stok Uyarısı</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              {lowStockItems.map(i => i.name).join(', ')} — kritik seviyede
            </div>
          </div>
        </div>
      )}

      {/* Stock grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
        {items.map(item => {
          const level = getStockLevel(item);
          const lc = levelColors[level];
          const pct = Math.min(100, (item.quantity / (item.minQuantity * 3)) * 100);

          return (
            <div key={item.id} className="card-hover" style={{
              background: '#12121a', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px', padding: '18px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '3px' }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>Min: {item.minQuantity} {item.unit}</div>
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px',
                  background: lc.bg, color: lc.color,
                }}>{lc.label}</span>
              </div>

              <div style={{ fontSize: '28px', fontWeight: 700, color: lc.color, marginBottom: '6px' }}>
                {item.quantity} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 400 }}>{item.unit}</span>
              </div>

              {/* Progress bar */}
              <div style={{ background: '#1a1a26', borderRadius: '4px', height: '6px', marginBottom: '14px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: lc.color, borderRadius: '4px', transition: 'width 0.3s ease' }} />
              </div>

              {item.costPerUnit > 0 && (
                <div style={{ fontSize: '12px', color: '#475569', marginBottom: '12px' }}>
                  Birim maliyet: ₺{item.costPerUnit} · Toplam: ₺{(item.quantity * item.costPerUnit).toFixed(0)}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => { setAdjustItem(item); setAdjustMode('add'); setAdjustValue(''); }}
                  style={{
                    flex: 1, padding: '7px', borderRadius: '8px',
                    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                    color: '#4ade80', fontSize: '12px', cursor: 'pointer', fontWeight: 500
                  }}
                >+ Ekle</button>
                <button
                  onClick={() => openEdit(item)}
                  style={{
                    padding: '7px 12px', borderRadius: '8px',
                    background: '#1a1a26', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#94a3b8', fontSize: '12px', cursor: 'pointer'
                  }}
                >✏️</button>
                <button
                  onClick={() => deleteItem(item.id)}
                  style={{
                    padding: '7px 12px', borderRadius: '8px',
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                    color: '#f87171', fontSize: '12px', cursor: 'pointer'
                  }}
                >🗑</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '420px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>{editItem ? 'Stok Düzenle' : 'Yeni Stok Kalemi'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Malzeme Adı *', key: 'name', type: 'text', placeholder: 'örn. Kahve Çekirdeği' },
                { label: 'Miktar', key: 'quantity', type: 'number', placeholder: '0' },
                { label: 'Minimum Miktar', key: 'minQuantity', type: 'number', placeholder: '0' },
                { label: 'Birim Maliyet (₺)', key: 'costPerUnit', type: 'number', placeholder: '0' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                  <input
                    type={f.type} placeholder={f.placeholder}
                    value={(form as Record<string, string>)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', background: '#1a1a26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f8fafc', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Birim</label>
                <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', background: '#1a1a26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f8fafc', fontSize: '14px', outline: 'none' }}>
                  {['kg', 'litre', 'adet', 'gram', 'paket', 'kutu'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#1a1a26', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '14px', cursor: 'pointer' }}>İptal</button>
              <button onClick={save} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#000', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>{editItem ? 'Güncelle' : 'Ekle'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {adjustItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}
          onClick={e => e.target === e.currentTarget && setAdjustItem(null)}>
          <div style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '360px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{adjustItem.name}</h2>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
              Mevcut: {adjustItem.quantity} {adjustItem.unit}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {(['add', 'set'] as const).map(m => (
                <button key={m} onClick={() => setAdjustMode(m)} style={{
                  flex: 1, padding: '8px', borderRadius: '8px',
                  background: adjustMode === m ? 'rgba(245,158,11,0.15)' : '#1a1a26',
                  border: adjustMode === m ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  color: adjustMode === m ? '#f59e0b' : '#94a3b8', fontSize: '13px', cursor: 'pointer', fontWeight: 500
                }}>
                  {m === 'add' ? '+ Ekle' : '= Yeni Değer'}
                </button>
              ))}
            </div>
            <input
              type="number" placeholder="Miktar..." value={adjustValue}
              onChange={e => setAdjustValue(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', background: '#1a1a26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f8fafc', fontSize: '16px', outline: 'none', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setAdjustItem(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#1a1a26', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', cursor: 'pointer' }}>İptal</button>
              <button onClick={doAdjust} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer' }}>Güncelle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

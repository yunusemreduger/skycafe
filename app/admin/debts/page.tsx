'use client';
import { useEffect, useState } from 'react';

interface DebtRecord {
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

interface MenuItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
  category: string;
}

interface SelectedItem extends MenuItem {
  quantity: number;
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('unpaid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ tableNumber: '', customerName: '', amount: '', description: '' });
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [useMenu, setUseMenu] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchDebts = async () => {
    const res = await fetch('/api/debts');
    setDebts(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchDebts();
    fetch('/api/menu').then(r => r.json()).then(setMenuItems);
  }, []);

  const markPaid = async (id: string) => {
    await fetch(`/api/debts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' }),
    });
    fetchDebts();
  };

  const deleteDebt = async (id: string) => {
    if (!confirm('Bu borç kaydını silmek istediğinizden emin misiniz?')) return;
    await fetch(`/api/debts/${id}`, { method: 'DELETE' });
    fetchDebts();
  };

  const toggleItem = (item: MenuItem) => {
    setSelectedItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.filter(i => i.id !== item.id);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setSelectedItems(prev => prev.map(i => i.id === id
      ? { ...i, quantity: Math.max(1, i.quantity + delta) }
      : i
    ));
  };

  const menuTotal = selectedItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const openModal = (prefill?: { tableNumber: string; customerName?: string }) => {
    setForm({ tableNumber: prefill?.tableNumber ?? '', customerName: prefill?.customerName ?? '', amount: '', description: '' });
    setSelectedItems([]);
    setUseMenu(true);
    setShowAddModal(true);
  };

  const addDebt = async () => {
    if (!form.tableNumber) return;
    const amount = useMenu ? menuTotal : Number(form.amount);
    const description = useMenu
      ? selectedItems.map(i => `${i.emoji} ${i.name} x${i.quantity}`).join(', ')
      : form.description;
    if (!amount) return;
    setSaving(true);
    await fetch('/api/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableNumber: form.tableNumber, customerName: form.customerName, amount, description }),
    });
    setShowAddModal(false);
    setSaving(false);
    fetchDebts();
  };

  const filtered = debts.filter(d => filter === 'all' ? true : d.status === filter);
  const totalUnpaid = debts.filter(d => d.status === 'unpaid').reduce((s, d) => s + d.amount, 0);
  const totalPaid = debts.filter(d => d.status === 'paid').reduce((s, d) => s + d.amount, 0);

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    background: '#1a1a26', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px', color: '#f8fafc', fontSize: '14px', outline: 'none',
  };

  if (loading) return <div style={{ color: '#94a3b8', padding: '40px' }}>Yükleniyor...</div>;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Borç Defteri</h1>
          <p style={{ color: '#64748b', fontSize: '13px' }}>{debts.filter(d => d.status === 'unpaid').length} açık borç</p>
        </div>
        <button onClick={() => openModal()} style={{ padding: '10px 20px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#000', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
          + Borç Ekle
        </button>
      </div>

      {/* Özet kartlar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Toplam Borç</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f87171' }}>{totalUnpaid.toLocaleString('tr-TR')} ₺</div>
        </div>
        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Tahsil Edilen</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#4ade80' }}>{totalPaid.toLocaleString('tr-TR')} ₺</div>
        </div>
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Toplam Kayıt</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>{debts.length}</div>
        </div>
      </div>

      {/* Filtre */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {(['unpaid', 'paid', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: 500,
            background: filter === f ? '#f59e0b' : '#12121a',
            color: filter === f ? '#000' : '#64748b',
          }}>
            {f === 'unpaid' ? '⏳ Açık' : f === 'paid' ? '✅ Ödendi' : '📋 Tümü'}
          </button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#374151' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📒</div>
          <div>Kayıt bulunamadı</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(debt => (
            <div key={debt.id} style={{
              background: '#12121a',
              border: `1px solid ${debt.status === 'unpaid' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.2)'}`,
              borderRadius: '14px', padding: '18px',
              display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
            }}>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <div style={{ fontWeight: 700, fontSize: '16px', color: '#f8fafc' }}>🏠 Daire {debt.tableNumber}</div>
                {debt.customerName && <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>{debt.customerName}</div>}
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>{debt.description}</div>
              </div>
              <div style={{ textAlign: 'right', minWidth: '100px' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: debt.status === 'unpaid' ? '#f87171' : '#4ade80' }}>
                  {debt.amount.toLocaleString('tr-TR')} ₺
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{new Date(debt.createdAt).toLocaleDateString('tr-TR')}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {debt.status === 'unpaid' ? (
                  <>
                    <span style={{ fontSize: '12px', color: '#f87171', background: 'rgba(239,68,68,0.1)', padding: '4px 10px', borderRadius: '6px' }}>Ödenmedi</span>
                    <button onClick={() => markPaid(debt.id)} style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: 'rgba(34,197,94,0.15)', color: '#4ade80', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>✓ Ödendi</button>
                    <button onClick={() => openModal({ tableNumber: debt.tableNumber, customerName: debt.customerName })} style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>+ Ekle</button>
                  </>
                ) : (
                  <span style={{ fontSize: '12px', color: '#4ade80', background: 'rgba(34,197,94,0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                    ✓ Ödendi {debt.paidAt ? new Date(debt.paidAt).toLocaleDateString('tr-TR') : ''}
                  </span>
                )}
                <button onClick={() => deleteDebt(debt.id)} style={{ padding: '7px 10px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.08)', color: '#f87171', fontSize: '13px', cursor: 'pointer' }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>📒 Borç Ekle</h2>

            {/* Daire & isim */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Daire No *</label>
                <input value={form.tableNumber} onChange={e => setForm(f => ({ ...f, tableNumber: e.target.value }))} placeholder="Örn: 12B" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>İsim (opsiyonel)</label>
                <input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Müşteri adı" style={inputStyle} />
              </div>
            </div>

            {/* Menüden seç / manuel */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button onClick={() => setUseMenu(true)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, background: useMenu ? '#f59e0b' : '#1a1a26', color: useMenu ? '#000' : '#64748b' }}>🍽 Menüden Seç</button>
              <button onClick={() => setUseMenu(false)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, background: !useMenu ? '#f59e0b' : '#1a1a26', color: !useMenu ? '#000' : '#64748b' }}>✏️ Manuel Gir</button>
            </div>

            {useMenu ? (
              <>
                {/* Menü ürün listesi */}
                <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                  {menuItems.filter(i => i.price > 0).map(item => {
                    const sel = selectedItems.find(i => i.id === item.id);
                    return (
                      <div key={item.id} onClick={() => toggleItem(item)} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                        background: sel ? 'rgba(245,158,11,0.1)' : '#1a1a26',
                        border: `1px solid ${sel ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.05)'}`,
                        transition: 'all 0.15s',
                      }}>
                        <span style={{ fontSize: '18px' }}>{item.emoji}</span>
                        <span style={{ flex: 1, fontSize: '13px', color: '#f8fafc' }}>{item.name}</span>
                        <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 600 }}>{item.price} ₺</span>
                        {sel && (
                          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button onClick={() => changeQty(item.id, -1)} style={{ width: '22px', height: '22px', borderRadius: '50%', border: 'none', background: '#374151', color: '#f8fafc', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>−</button>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b', minWidth: '16px', textAlign: 'center' }}>{sel.quantity}</span>
                            <button onClick={() => changeQty(item.id, 1)} style={{ width: '22px', height: '22px', borderRadius: '50%', border: 'none', background: '#374151', color: '#f8fafc', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>+</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {selectedItems.length > 0 && (
                  <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>{selectedItems.length} ürün seçildi</span>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#f59e0b' }}>{menuTotal.toLocaleString('tr-TR')} ₺</span>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Tutar (₺) *</label>
                  <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Açıklama</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Sipariş detayı vb." style={inputStyle} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#1a1a26', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', cursor: 'pointer' }}>İptal</button>
              <button
                onClick={addDebt}
                disabled={saving || !form.tableNumber || (useMenu ? selectedItems.length === 0 : !form.amount)}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer', opacity: (saving || !form.tableNumber || (useMenu ? selectedItems.length === 0 : !form.amount)) ? 0.5 : 1 }}
              >Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

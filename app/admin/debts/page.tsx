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

export default function DebtsPage() {
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('unpaid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ tableNumber: '', customerName: '', amount: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchDebts = async () => {
    const res = await fetch('/api/debts');
    setDebts(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchDebts(); }, []);

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

  const addDebt = async () => {
    if (!form.tableNumber || !form.amount) return;
    setSaving(true);
    await fetch('/api/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: Number(form.amount) }),
    });
    setForm({ tableNumber: '', customerName: '', amount: '', description: '' });
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
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '10px 20px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            border: 'none', color: '#000', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
          }}
        >+ Manuel Borç Ekle</button>
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
              {/* Daire & isim */}
              <div style={{ flex: 1, minWidth: '140px' }}>
                <div style={{ fontWeight: 700, fontSize: '16px', color: '#f8fafc' }}>
                  🏠 Daire {debt.tableNumber}
                </div>
                {debt.customerName && (
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>{debt.customerName}</div>
                )}
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>{debt.description}</div>
              </div>

              {/* Tutar */}
              <div style={{ textAlign: 'right', minWidth: '100px' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: debt.status === 'unpaid' ? '#f87171' : '#4ade80' }}>
                  {debt.amount.toLocaleString('tr-TR')} ₺
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                  {new Date(debt.createdAt).toLocaleDateString('tr-TR')}
                </div>
              </div>

              {/* Durum & butonlar */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {debt.status === 'unpaid' ? (
                  <>
                    <span style={{ fontSize: '12px', color: '#f87171', background: 'rgba(239,68,68,0.1)', padding: '4px 10px', borderRadius: '6px' }}>Ödenmedi</span>
                    <button
                      onClick={() => markPaid(debt.id)}
                      style={{
                        padding: '7px 14px', borderRadius: '8px', border: 'none',
                        background: 'rgba(34,197,94,0.15)', color: '#4ade80',
                        fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      }}
                    >✓ Ödendi</button>
                  </>
                ) : (
                  <span style={{ fontSize: '12px', color: '#4ade80', background: 'rgba(34,197,94,0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                    ✓ Ödendi {debt.paidAt ? new Date(debt.paidAt).toLocaleDateString('tr-TR') : ''}
                  </span>
                )}
                <button
                  onClick={() => deleteDebt(debt.id)}
                  style={{
                    padding: '7px 10px', borderRadius: '8px', border: 'none',
                    background: 'rgba(239,68,68,0.08)', color: '#f87171',
                    fontSize: '13px', cursor: 'pointer',
                  }}
                >🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manuel borç ekle modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '420px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Borç Ekle</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Daire No *</label>
                <input value={form.tableNumber} onChange={e => setForm(f => ({ ...f, tableNumber: e.target.value }))} placeholder="Örn: 12B" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>İsim (opsiyonel)</label>
                <input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Müşteri adı" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Tutar (₺) *</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Açıklama</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Sipariş detayı vb." style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#1a1a26', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', cursor: 'pointer' }}>İptal</button>
              <button onClick={addDebt} disabled={saving || !form.tableNumber || !form.amount} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer' }}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

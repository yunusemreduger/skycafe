'use client';
import { useEffect, useState, useMemo } from 'react';

interface FinanceRecord {
  id: string; type: 'income' | 'expense'; category: string;
  amount: number; description: string; date: string; createdAt: string;
}

type Period = 'daily' | 'weekly' | 'monthly';

const INCOME_CATS = ['Satış', 'Diğer Gelir'];
const EXPENSE_CATS = ['Malzeme', 'Kira', 'Personel', 'Elektrik/Su', 'Bakım', 'Diğer Gider'];

function getDateRange(period: Period): { start: Date; end: Date; label: string } {
  const now = new Date();
  if (period === 'daily') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start.getTime() + 86400000 - 1);
    return { start, end, label: now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) };
  }
  if (period === 'weekly') {
    const day = now.getDay(); // 0=Sun
    const diffToMon = (day === 0 ? -6 : 1 - day);
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMon);
    const end = new Date(start.getTime() + 7 * 86400000 - 1);
    const s = start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    const e = end.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    return { start, end, label: `${s} – ${e}` };
  }
  // monthly
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end, label: now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) };
}

export default function FinancePage() {
  const [allRecords, setAllRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [period, setPeriod] = useState<Period>('daily');
  const [form, setForm] = useState({ type: 'expense', category: EXPENSE_CATS[0], amount: '', description: '', date: new Date().toISOString().split('T')[0] });

  const fetchRecords = async () => {
    const res = await fetch('/api/finance');
    setAllRecords(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, []);

  const { start, end, label } = getDateRange(period);

  const records = useMemo(() => {
    return allRecords.filter(r => {
      const d = new Date(r.date);
      return d >= start && d <= end;
    });
  }, [allRecords, period]);

  const save = async () => {
    if (!form.amount) return;
    await fetch('/api/finance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowModal(false);
    fetchRecords();
  };

  const deleteRecord = async (id: string) => {
    await fetch(`/api/finance/${id}`, { method: 'DELETE' });
    fetchRecords();
  };

  const totalIncome = records.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
  const totalExpense = records.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const expenseByCategory = EXPENSE_CATS.reduce((acc, cat) => {
    const sum = records.filter(r => r.type === 'expense' && r.category === cat).reduce((s, r) => s + r.amount, 0);
    if (sum > 0) acc[cat] = sum;
    return acc;
  }, {} as Record<string, number>);
  const maxExpense = Math.max(...Object.values(expenseByCategory), 1);

  // Günlük breakdown for weekly/monthly chart
  const dailyData = useMemo(() => {
    if (period === 'daily') return [];
    const map: Record<string, { income: number; expense: number }> = {};
    records.forEach(r => {
      if (!map[r.date]) map[r.date] = { income: 0, expense: 0 };
      map[r.date][r.type] += r.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({ date, ...vals }));
  }, [records, period]);

  const maxBar = Math.max(...dailyData.map(d => Math.max(d.income, d.expense)), 1);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  const formatShort = (d: string) => {
    const date = new Date(d);
    if (period === 'weekly') return date.toLocaleDateString('tr-TR', { weekday: 'short' });
    return date.toLocaleDateString('tr-TR', { day: 'numeric' });
  };

  if (loading) return <div style={{ color: '#6B6456', padding: '40px' }}>Yükleniyor...</div>;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Gelir & Gider</h1>
          <p style={{ color: '#746C5C', fontSize: '13px' }}>{label}</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          padding: '10px 20px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #2A7049, #256844)',
          border: 'none', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer'
        }}>+ Ekle</button>
      </div>

      {/* Period tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {([
          { key: 'daily', label: '📅 Günlük' },
          { key: 'weekly', label: '📆 Haftalık' },
          { key: 'monthly', label: '🗓 Aylık' },
        ] as { key: Period; label: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setPeriod(tab.key)}
            style={{
              padding: '9px 18px', borderRadius: '10px', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600,
              background: period === tab.key ? 'rgba(42,112,73,0.15)' : '#FFFFFF',
              color: period === tab.key ? '#2A7049' : '#6B6456',
              border: period === tab.key ? '1px solid rgba(42,112,73,0.3)' : '1px solid #E3DACA',
              transition: 'all 0.15s ease',
            }}
          >{tab.label}</button>
        ))}
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Toplam Gelir', value: totalIncome, color: '#2A7049', icon: '📈' },
          { label: 'Toplam Gider', value: totalExpense, color: '#A32D22', icon: '📉' },
          { label: 'Net Kâr', value: netProfit, color: netProfit >= 0 ? '#2A7049' : '#A32D22', icon: '💹' },
        ].map((card, i) => (
          <div key={i} style={{
            background: '#FFFFFF', border: '1px solid #E3DACA',
            borderRadius: '14px', padding: '20px'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>{card.icon}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: card.color }}>
              {netProfit < 0 && i === 2 ? '-' : ''}₺{Math.abs(card.value).toLocaleString('tr-TR')}
            </div>
            <div style={{ fontSize: '12px', color: '#746C5C', marginTop: '4px' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart — weekly / monthly */}
      {dailyData.length > 0 && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E3DACA', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '20px', color: '#6B6456' }}>
            {period === 'weekly' ? 'Günlere Göre Dağılım' : 'Günlük Dağılım'}
          </h3>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '120px', overflowX: 'auto' }}>
            {dailyData.map(d => (
              <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '40px', flex: 1 }}>
                <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '90px' }}>
                  <div style={{ width: '14px', background: 'rgba(42,112,73,0.7)', borderRadius: '3px 3px 0 0', height: `${(d.income / maxBar) * 90}px`, minHeight: d.income > 0 ? '4px' : '0', transition: 'height 0.3s ease' }} title={`Gelir: ₺${d.income}`} />
                  <div style={{ width: '14px', background: 'rgba(192,57,43,0.7)', borderRadius: '3px 3px 0 0', height: `${(d.expense / maxBar) * 90}px`, minHeight: d.expense > 0 ? '4px' : '0', transition: 'height 0.3s ease' }} title={`Gider: ₺${d.expense}`} />
                </div>
                <div style={{ fontSize: '10px', color: '#7A7263', whiteSpace: 'nowrap' }}>{formatShort(d.date)}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6B6456' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(42,112,73,0.7)' }} /> Gelir
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6B6456' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(192,57,43,0.7)' }} /> Gider
            </div>
          </div>
        </div>
      )}

      {/* Expense breakdown */}
      {Object.keys(expenseByCategory).length > 0 && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E3DACA', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: '#6B6456' }}>Gider Dağılımı</h3>
          {Object.entries(expenseByCategory).map(([cat, amount]) => (
            <div key={cat} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: '#6B6456' }}>{cat}</span>
                <span style={{ fontSize: '12px', color: '#A32D22', fontWeight: 600 }}>₺{amount.toLocaleString('tr-TR')}</span>
              </div>
              <div style={{ background: '#FAF7F0', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${(amount / maxExpense) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #2A7049, #256844)', borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Records */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E3DACA', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #EFE8DA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Kayıtlar</h3>
          <span style={{ fontSize: '12px', color: '#7A7263' }}>{records.length} kayıt</span>
        </div>
        {records.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#7A7263' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
            <div>Bu dönem için kayıt yok</div>
          </div>
        ) : (
          records.map((r, i) => (
            <div key={r.id} style={{
              padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '14px',
              borderBottom: i < records.length - 1 ? '1px solid #EFE8DA' : 'none'
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: r.type === 'income' ? 'rgba(42,112,73,0.12)' : 'rgba(192,57,43,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0
              }}>
                {r.type === 'income' ? '💰' : '💸'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>{r.description || r.category}</div>
                <div style={{ fontSize: '11px', color: '#7A7263' }}>{r.category} · {formatDate(r.date)}</div>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, flexShrink: 0, color: r.type === 'income' ? '#2A7049' : '#A32D22' }}>
                {r.type === 'income' ? '+' : '-'}₺{r.amount.toLocaleString('tr-TR')}
              </div>
              <button onClick={() => deleteRecord(r.id)} style={{
                padding: '6px 10px', borderRadius: '7px',
                background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.15)',
                color: '#A32D22', fontSize: '12px', cursor: 'pointer', flexShrink: 0
              }}>🗑</button>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(46,43,36,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E3DACA', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '420px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>Yeni Kayıt</h2>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {(['income', 'expense'] as const).map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t, category: t === 'income' ? INCOME_CATS[0] : EXPENSE_CATS[0] }))}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px',
                    background: form.type === t ? (t === 'income' ? 'rgba(42,112,73,0.15)' : 'rgba(192,57,43,0.15)') : '#FAF7F0',
                    border: form.type === t ? (t === 'income' ? '1px solid rgba(42,112,73,0.3)' : '1px solid rgba(192,57,43,0.3)') : '1px solid #E3DACA',
                    color: form.type === t ? (t === 'income' ? '#256844' : '#A32D22') : '#6B6456',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                  }}>
                  {t === 'income' ? '📈 Gelir' : '📉 Gider'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#746C5C', display: 'block', marginBottom: '6px' }}>Kategori</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', background: '#FAF7F0', border: '1px solid #D6CBB6', borderRadius: '10px', color: '#2E2B24', fontSize: '14px', outline: 'none' }}>
                  {(form.type === 'income' ? INCOME_CATS : EXPENSE_CATS).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#746C5C', display: 'block', marginBottom: '6px' }}>Tutar (₺) *</label>
                <input type="number" placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', background: '#FAF7F0', border: '1px solid #D6CBB6', borderRadius: '10px', color: '#2E2B24', fontSize: '14px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#746C5C', display: 'block', marginBottom: '6px' }}>Açıklama</label>
                <input type="text" placeholder="Açıklama..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', background: '#FAF7F0', border: '1px solid #D6CBB6', borderRadius: '10px', color: '#2E2B24', fontSize: '14px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#746C5C', display: 'block', marginBottom: '6px' }}>Tarih</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', background: '#FAF7F0', border: '1px solid #D6CBB6', borderRadius: '10px', color: '#2E2B24', fontSize: '14px', outline: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#FAF7F0', border: '1px solid #E3DACA', color: '#6B6456', cursor: 'pointer' }}>İptal</button>
              <button onClick={save} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #2A7049, #256844)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

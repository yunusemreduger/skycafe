'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface OrderItem { menuItemId: string; name: string; price: number; quantity: number; note?: string; }
interface Tab { id: string; tableNumber: number; items: OrderItem[]; status: string; openedAt: string; }
interface TableState { tableNumber: number; tab: Tab | null; total: number; itemCount: number; }
interface MenuItem { id: string; name: string; price: number; category: string; emoji: string; available: boolean; }

const CATEGORY_ORDER = ['Smoothie', 'Kahve', 'Matcha'];
const TL = (n: number) => '₺' + n.toLocaleString('tr-TR');

/** "az önce" / "23 dk" / "2sa 15dk" */
function sureMetni(iso: string): string {
  const dk = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (dk < 1) return 'az önce';
  if (dk < 60) return `${dk} dk`;
  const sa = Math.floor(dk / 60);
  const kalan = dk % 60;
  return kalan ? `${sa}sa ${kalan}dk` : `${sa} saat`;
}

const saat = (iso: string) =>
  new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

export default function KasaPage() {
  const [tables, setTables] = useState<TableState[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [activeCat, setActiveCat] = useState<string>('Tümü');
  const [payModal, setPayModal] = useState(false);
  const [debtModal, setDebtModal] = useState(false);
  const [moveModal, setMoveModal] = useState(false);
  const [debtName, setDebtName] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch('/api/tabs', { cache: 'no-store' });
      const data = await res.json();
      setTables(data.tables ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/tabs', { cache: 'no-store' }).then(r => r.json()),
      fetch('/api/menu', { cache: 'no-store' }).then(r => r.json()),
    ]).then(([t, m]) => {
      setTables(t.tables ?? []);
      setMenu((m as MenuItem[]).filter(i => i.available));
      setLoading(false);
    }).catch(() => setLoading(false));

    const iv = setInterval(fetchTables, 4000);
    return () => clearInterval(iv);
  }, [fetchTables]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const current = tables.find(t => t.tableNumber === selected) ?? null;

  const categories = useMemo(() => {
    const cats = [...new Set(menu.map(m => m.category))].sort(
      (a, b) => (CATEGORY_ORDER.indexOf(a) + 99) % 99 - (CATEGORY_ORDER.indexOf(b) + 99) % 99
    );
    return ['Tümü', ...cats];
  }, [menu]);

  const visibleMenu = activeCat === 'Tümü' ? menu : menu.filter(m => m.category === activeCat);

  // ---- işlemler ----
  const addItem = async (menuItemId: string) => {
    if (selected === null || busy) return;
    setBusy(true);
    await fetch('/api/tabs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableNumber: selected, menuItemId, quantity: 1 }),
    });
    await fetchTables();
    setBusy(false);
  };

  const setQty = async (item: OrderItem, quantity: number) => {
    if (selected === null || busy) return;
    setBusy(true);
    await fetch(`/api/tabs/${selected}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setQuantity', menuItemId: item.menuItemId, note: item.note, quantity }),
    });
    await fetchTables();
    setBusy(false);
  };

  const closeTab = async (paymentMethod: 'cash' | 'card') => {
    if (selected === null || busy) return;
    setBusy(true);
    const res = await fetch(`/api/tabs/${selected}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'close', paymentMethod }),
    });
    const data = await res.json();
    setPayModal(false);
    await fetchTables();
    setBusy(false);
    if (data.stockWarnings?.length) {
      alert('⚠️ Stok uyarısı:\n\n' + data.stockWarnings.join('\n'));
    } else {
      showToast(`Masa ${selected} kapatıldı — ${paymentMethod === 'card' ? 'Kart' : 'Nakit'}`);
    }
    setSelected(null);
  };

  const toDebt = async () => {
    if (selected === null || busy || !debtName.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/tabs/${selected}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toDebt', customerName: debtName.trim() }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { alert(data.error || 'İşlem başarısız'); return; }
    setDebtModal(false);
    setDebtName('');
    await fetchTables();
    showToast(`Masa ${selected} borç defterine yazıldı`);
    setSelected(null);
  };

  const moveOrMerge = async (targetTable: number) => {
    if (selected === null || busy) return;
    const hedefDolu = tables.find(t => t.tableNumber === targetTable)?.tab;
    setBusy(true);
    const res = await fetch(`/api/tabs/${selected}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: hedefDolu ? 'merge' : 'move', targetTable }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { alert(data.error || 'İşlem başarısız'); return; }
    setMoveModal(false);
    await fetchTables();
    showToast(hedefDolu ? `Masa ${selected} → Masa ${targetTable} birleştirildi` : `Masa ${selected} → Masa ${targetTable} taşındı`);
    setSelected(targetTable);
  };

  const cancelTab = async () => {
    if (selected === null || busy) return;
    if (!confirm(`Masa ${selected} adisyonu iptal edilecek. Emin misiniz?`)) return;
    setBusy(true);
    await fetch(`/api/tabs/${selected}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    });
    await fetchTables();
    setBusy(false);
    showToast(`Masa ${selected} adisyonu iptal edildi`);
    setSelected(null);
  };

  if (loading) return <div style={{ color: '#94a3b8', padding: '40px' }}>Yükleniyor...</div>;

  const btn = (bg: string, border: string, color: string) => ({
    padding: '12px', borderRadius: '10px', background: bg,
    border: `1px solid ${border}`, color, fontSize: '13px',
    fontWeight: 700, cursor: 'pointer', flex: 1,
  });

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '4px' }}>Kasa</h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Masaya sipariş ekle, hesabı kapat</p>
      </div>

      {/* Masa kartları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {tables.map(t => {
          const dolu = !!t.tab;
          const aktif = selected === t.tableNumber;
          return (
            <button
              key={t.tableNumber}
              onClick={() => setSelected(aktif ? null : t.tableNumber)}
              className="card-hover"
              style={{
                background: aktif ? 'rgba(245,158,11,0.12)' : '#12121a',
                border: `1px solid ${aktif ? 'rgba(245,158,11,0.45)' : dolu ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '16px', padding: '20px 18px', cursor: 'pointer',
                textAlign: 'left', color: 'inherit', transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '17px', fontWeight: 700 }}>Masa {t.tableNumber}</span>
                <span style={{
                  width: '9px', height: '9px', borderRadius: '50%',
                  background: dolu ? '#22c55e' : '#374151',
                }} />
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: dolu ? '#22c55e' : '#374151' }}>
                {dolu ? TL(t.total) : 'Boş'}
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>
                {dolu ? `${t.itemCount} ürün · ${sureMetni(t.tab!.openedAt)}` : 'Adisyon yok'}
              </div>
            </button>
          );
        })}
      </div>

      {selected === null ? (
        <div style={{
          background: '#12121a', border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#475569', fontSize: '14px',
        }}>
          Sipariş eklemek için yukarıdan bir masa seçin
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.15fr) minmax(0,1fr)', gap: '18px', alignItems: 'start' }}
             className="kasa-grid">

          {/* Ürün seçimi */}
          <div style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', marginBottom: '12px' }}>
              Masa {selected} — ürün ekle
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {categories.map(c => (
                <button key={c} onClick={() => setActiveCat(c)} style={{
                  padding: '6px 13px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  background: activeCat === c ? 'rgba(245,158,11,0.15)' : '#1a1a26',
                  border: `1px solid ${activeCat === c ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  color: activeCat === c ? '#f59e0b' : '#94a3b8',
                }}>{c}</button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '9px' }}>
              {visibleMenu.map(m => (
                <button key={m.id} onClick={() => addItem(m.id)} disabled={busy} style={{
                  background: '#1a1a26', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '11px', padding: '12px 10px', cursor: busy ? 'wait' : 'pointer',
                  textAlign: 'left', color: 'inherit',
                }}>
                  <div style={{ fontSize: '17px', marginBottom: '5px' }}>{m.emoji}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, lineHeight: 1.25, marginBottom: '4px' }}>{m.name}</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#22c55e' }}>{TL(m.price)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Adisyon */}
          <div style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '18px', position: 'sticky', top: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>Adisyon</div>
                {current?.tab && (
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                    {saat(current.tab.openedAt)}&apos;de açıldı · {sureMetni(current.tab.openedAt)} önce
                  </div>
                )}
              </div>
              {current?.tab && (
                <button onClick={cancelTab} style={{
                  background: 'none', border: 'none', color: '#475569',
                  fontSize: '11px', cursor: 'pointer', padding: '2px 6px',
                }}>İptal et</button>
              )}
            </div>

            {!current?.tab || current.tab.items.length === 0 ? (
              <div style={{ color: '#475569', fontSize: '13px', padding: '24px 0', textAlign: 'center' }}>
                Adisyon boş — soldan ürün ekleyin
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '14px' }}>
                  {current.tab.items.map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#475569' }}>{TL(item.price)} × {item.quantity}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <button onClick={() => setQty(item, item.quantity - 1)} disabled={busy} style={{
                          width: '25px', height: '25px', borderRadius: '7px', background: '#1a1a26',
                          border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', cursor: 'pointer', fontSize: '15px', lineHeight: 1,
                        }}>−</button>
                        <span style={{ minWidth: '18px', textAlign: 'center', fontSize: '13px', fontWeight: 700 }}>{item.quantity}</span>
                        <button onClick={() => setQty(item, item.quantity + 1)} disabled={busy} style={{
                          width: '25px', height: '25px', borderRadius: '7px', background: '#1a1a26',
                          border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', cursor: 'pointer', fontSize: '15px', lineHeight: 1,
                        }}>+</button>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#22c55e', minWidth: '58px', textAlign: 'right' }}>
                        {TL(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '13px 0', borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px',
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>Toplam</span>
                  <span style={{ fontSize: '21px', fontWeight: 700, color: '#22c55e' }}>{TL(current.total)}</span>
                </div>

                <button onClick={() => setPayModal(true)} disabled={busy} style={{
                  width: '100%', padding: '14px', borderRadius: '12px', marginBottom: '9px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none',
                  color: '#000', fontSize: '15px', fontWeight: 700, cursor: busy ? 'wait' : 'pointer',
                }}>Hesabı Kapat</button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setDebtModal(true)} disabled={busy}
                    style={btn('rgba(245,158,11,0.08)', 'rgba(245,158,11,0.2)', '#f59e0b')}>📒 Borca Yaz</button>
                  <button onClick={() => setMoveModal(true)} disabled={busy}
                    style={btn('#1a1a26', 'rgba(255,255,255,0.08)', '#94a3b8')}>↔ Masa Değiştir</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Ödeme yöntemi */}
      {payModal && current && (
        <div onClick={() => setPayModal(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#12121a', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '380px',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Masa {selected} — tahsil edilecek</div>
              <div style={{ fontSize: '34px', fontWeight: 700, color: '#22c55e' }}>{TL(current.total)}</div>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '11px', fontWeight: 600 }}>Ödeme yöntemi</div>
            <div style={{ display: 'flex', gap: '11px', marginBottom: '14px' }}>
              <button onClick={() => closeTab('cash')} disabled={busy} style={{
                flex: 1, padding: '22px 14px', borderRadius: '14px',
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                color: '#4ade80', cursor: busy ? 'wait' : 'pointer',
              }}>
                <div style={{ fontSize: '26px', marginBottom: '7px' }}>💵</div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>Nakit</div>
              </button>
              <button onClick={() => closeTab('card')} disabled={busy} style={{
                flex: 1, padding: '22px 14px', borderRadius: '14px',
                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
                color: '#60a5fa', cursor: busy ? 'wait' : 'pointer',
              }}>
                <div style={{ fontSize: '26px', marginBottom: '7px' }}>💳</div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>Kredi Kartı</div>
              </button>
            </div>
            <button onClick={() => setPayModal(false)} style={{
              width: '100%', padding: '11px', borderRadius: '10px', background: '#1a1a26',
              border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '13px', cursor: 'pointer',
            }}>Vazgeç</button>
          </div>
        </div>
      )}

      {/* Borca yaz */}
      {debtModal && current && (
        <div onClick={() => setDebtModal(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#12121a', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '380px',
          }}>
            <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '5px' }}>Borç Defterine Yaz</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px' }}>
              Masa {selected} — {TL(current.total)}
            </div>
            <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '7px' }}>Kime yazılacak?</label>
            <input
              autoFocus value={debtName} onChange={e => setDebtName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') toDebt(); }}
              placeholder="İsim / daire no"
              style={{
                width: '100%', padding: '11px 14px', background: '#1a1a26',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                color: '#f8fafc', fontSize: '14px', outline: 'none', marginBottom: '18px',
              }}
            />
            <div style={{ display: 'flex', gap: '11px' }}>
              <button onClick={() => setDebtModal(false)} style={{
                flex: 1, padding: '12px', borderRadius: '10px', background: '#1a1a26',
                border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '14px', cursor: 'pointer',
              }}>İptal</button>
              <button onClick={toDebt} disabled={!debtName.trim() || busy} style={{
                flex: 1, padding: '12px', borderRadius: '10px',
                background: debtName.trim() ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#1a1a26',
                border: 'none', color: debtName.trim() ? '#000' : '#475569',
                fontSize: '14px', fontWeight: 700, cursor: debtName.trim() ? 'pointer' : 'not-allowed',
              }}>Borca Yaz</button>
            </div>
          </div>
        </div>
      )}

      {/* Masa değiştir */}
      {moveModal && (
        <div onClick={() => setMoveModal(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#12121a', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '380px',
          }}>
            <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '5px' }}>Masa {selected} adisyonu</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px' }}>
              Boş masaya taşınır, dolu masayla birleştirilir
            </div>
            <div style={{ display: 'grid', gap: '9px', marginBottom: '18px' }}>
              {tables.filter(t => t.tableNumber !== selected).map(t => (
                <button key={t.tableNumber} onClick={() => moveOrMerge(t.tableNumber)} disabled={busy} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '13px 16px', borderRadius: '11px', background: '#1a1a26',
                  border: '1px solid rgba(255,255,255,0.08)', color: 'inherit',
                  cursor: busy ? 'wait' : 'pointer', textAlign: 'left',
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>Masa {t.tableNumber}</span>
                  <span style={{ fontSize: '12px', color: t.tab ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>
                    {t.tab ? `Birleştir · ${TL(t.total)}` : 'Taşı · Boş'}
                  </span>
                </button>
              ))}
            </div>
            <button onClick={() => setMoveModal(false)} style={{
              width: '100%', padding: '11px', borderRadius: '10px', background: '#1a1a26',
              border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '13px', cursor: 'pointer',
            }}>Vazgeç</button>
          </div>
        </div>
      )}

      {/* Bildirim */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
          color: '#4ade80', padding: '13px 22px', borderRadius: '12px',
          fontSize: '14px', fontWeight: 600, zIndex: 200, backdropFilter: 'blur(8px)',
        }}>✓ {toast}</div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .kasa-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

'use client';
import { useEffect, useState, useCallback, useRef } from 'react';

interface OrderItem { name: string; price: number; quantity: number; note?: string; }
interface Order {
  id: string; tableNumber: string; customerName?: string;
  items: OrderItem[]; total: number; status: string;
  paymentMethod: 'cash' | 'card'; paymentStatus: 'unpaid' | 'paid';
  note?: string; createdAt: string; updatedAt: string;
}

const STATUS_FLOW: Record<string, string> = {
  pending: 'preparing',
  preparing: 'ready',
  ready: 'completed',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '🔴 Bekliyor', preparing: '🔵 Hazırlanıyor',
  ready: '🟢 Hazır', completed: '✅ Tamamlandı', cancelled: '❌ İptal',
};

const STATUS_NEXT: Record<string, string> = {
  pending: 'Hazırlamaya Başla', preparing: 'Hazır İşaretle', ready: 'Tamamlandı',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('active');
  const [loading, setLoading] = useState(true);
  const prevCountRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);

  const playNotification = useCallback(() => {
    try {
      const ctx = audioRef.current || new AudioContext();
      audioRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      const data: Order[] = await res.json();
      setOrders(data);
      const pendingCount = data.filter(o => o.status === 'pending').length;
      if (pendingCount > prevCountRef.current && prevCountRef.current >= 0) {
        playNotification();
      }
      prevCountRef.current = pendingCount;
      setLoading(false);
    } catch { setLoading(false); }
  }, [playNotification]);

  useEffect(() => {
    fetchOrders();
    const iv = setInterval(fetchOrders, 3000);
    return () => clearInterval(iv);
  }, [fetchOrders]);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    // Stok yetersizse uyar
    try {
      const data = await res.json();
      if (data.stockWarnings?.length) {
        alert('⚠️ Stok uyarısı — sipariş tamamlandı ama bazı malzemeler yetersizdi:\n\n' + data.stockWarnings.join('\n'));
      }
    } catch {}
    fetchOrders();
  };

  const cancelOrder = (id: string) => updateStatus(id, 'cancelled');

  const filteredOrders = orders.filter(o => {
    if (filter === 'active') return ['pending', 'preparing', 'ready'].includes(o.status);
    if (filter === 'completed') return o.status === 'completed';
    if (filter === 'cancelled') return o.status === 'cancelled';
    return true;
  });

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diff < 1) return 'Az önce';
    if (diff < 60) return `${diff} dk önce`;
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const counts = {
    active: orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    all: orders.length,
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ color: '#94a3b8', fontSize: '14px' }}>Siparişler yükleniyor...</div>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Siparişler</h1>
          <p style={{ color: '#64748b', fontSize: '13px' }}>Her 3 saniyede güncellenir</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', position: 'relative' }}>
            <span style={{
              position: 'absolute', inset: '-3px', borderRadius: '50%',
              border: '2px solid rgba(34,197,94,0.4)',
              animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite'
            }} />
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Canlı</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { key: 'active', label: 'Aktif', count: counts.active },
          { key: 'completed', label: 'Tamamlandı', count: counts.completed },
          { key: 'cancelled', label: 'İptal', count: counts.cancelled },
          { key: 'all', label: 'Tümü', count: counts.all },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '8px 16px', borderRadius: '10px',
              cursor: 'pointer', fontSize: '13px', fontWeight: 500,
              background: filter === tab.key ? 'rgba(245,158,11,0.15)' : '#12121a',
              color: filter === tab.key ? '#f59e0b' : '#94a3b8',
              border: filter === tab.key ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.06)',
              whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
            <span style={{
              background: filter === tab.key ? '#f59e0b' : '#1e2035',
              color: filter === tab.key ? '#000' : '#64748b',
              borderRadius: '20px', fontSize: '11px', fontWeight: 700,
              padding: '1px 6px', minWidth: '18px', textAlign: 'center'
            }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Orders grid */}
      {filteredOrders.length === 0 ? (
        <div style={{
          background: '#12121a', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px', padding: '64px', textAlign: 'center', color: '#475569'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
          <div style={{ fontSize: '15px' }}>Bu kategoride sipariş bulunmuyor</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filteredOrders.map(order => (
            <div key={order.id} className="slide-up" style={{
              background: '#12121a',
              border: order.paymentStatus === 'unpaid' && order.status !== 'cancelled'
                ? '1px solid rgba(239,68,68,0.25)'
                : order.status === 'pending' ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px', overflow: 'hidden',
              boxShadow: order.paymentStatus === 'unpaid' && order.status !== 'cancelled'
                ? '0 0 20px rgba(239,68,68,0.04)'
                : order.status === 'pending' ? '0 0 20px rgba(245,158,11,0.05)' : 'none',
              transition: 'all 0.2s ease',
            }}>
              {/* Card header */}
              <div style={{
                padding: '14px 18px',
                background: order.status === 'pending' ? 'rgba(245,158,11,0.07)' : '#0d0d18',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'rgba(245,158,11,0.15)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: '#f59e0b', fontSize: '14px'
                  }}>{order.tableNumber}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Daire {order.tableNumber}</div>
                    {order.customerName && (
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{order.customerName}</div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`status-${order.status}`} style={{
                    fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px',
                  }}>
                    {STATUS_LABELS[order.status]}
                  </span>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                    {formatTime(order.createdAt)}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {order.items.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '5px 0',
                    borderBottom: idx < order.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        background: '#1a1a26', color: '#f59e0b',
                        borderRadius: '5px', padding: '1px 6px',
                        fontSize: '12px', fontWeight: 600
                      }}>{item.quantity}x</span>
                      <span style={{ fontSize: '13px', color: '#e2e8f0' }}>{item.name}</span>
                    </div>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>₺{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
                {order.note && (
                  <div style={{
                    marginTop: '10px', padding: '8px 10px', background: 'rgba(245,158,11,0.06)',
                    borderRadius: '8px', fontSize: '12px', color: '#94a3b8',
                    border: '1px solid rgba(245,158,11,0.1)'
                  }}>
                    📝 {order.note}
                  </div>
                )}
              </div>

              {/* Ödeme bandı */}
              <div style={{
                padding: '10px 18px',
                background: order.paymentStatus === 'unpaid' ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)',
                borderTop: '1px solid rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>{order.paymentMethod === 'card' ? '💳' : '💵'}</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {order.paymentMethod === 'card' ? 'Kartla' : 'Nakit'}
                  </span>
                </div>
                {order.paymentStatus === 'unpaid' ? (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => fetch(`/api/orders/${order.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentStatus: 'paid' }) }).then(fetchOrders)}
                      style={{
                        padding: '5px 12px', borderRadius: '7px',
                        background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                        color: '#4ade80', fontSize: '11px', cursor: 'pointer', fontWeight: 600
                      }}
                    >💰 Ödendi</button>
                    <button
                      onClick={async () => {
                        await fetch('/api/debts', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            tableNumber: order.tableNumber,
                            customerName: order.customerName,
                            amount: order.total,
                            description: order.items.map(i => `${i.name} x${i.quantity}`).join(', '),
                            orderId: order.id,
                          }),
                        });
                        await fetch(`/api/orders/${order.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ paymentStatus: 'paid' }),
                        });
                        fetchOrders();
                      }}
                      style={{
                        padding: '5px 12px', borderRadius: '7px',
                        background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
                        color: '#f59e0b', fontSize: '11px', cursor: 'pointer', fontWeight: 600
                      }}
                    >📒 Borca Yaz</button>
                  </div>
                ) : (
                  <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 600 }}>✓ Ödendi</span>
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '12px 18px', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ fontWeight: 700, fontSize: '16px', color: '#22c55e' }}>
                  ₺{order.total}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <>
                      <button
                        onClick={() => cancelOrder(order.id)}
                        style={{
                          padding: '6px 12px', borderRadius: '8px',
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                          color: '#f87171', fontSize: '12px', cursor: 'pointer', fontWeight: 500
                        }}
                      >İptal</button>
                      {STATUS_FLOW[order.status] && (
                        <button
                          onClick={() => updateStatus(order.id, STATUS_FLOW[order.status])}
                          style={{
                            padding: '6px 14px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            border: 'none', color: '#000',
                            fontSize: '12px', cursor: 'pointer', fontWeight: 600
                          }}
                        >{STATUS_NEXT[order.status]}</button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  todayRevenue: number;
  todayOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  lowStock: number;
  todayExpenses: number;
}

interface RecentOrder {
  id: string;
  tableNumber: string;
  items: { name: string; quantity: number }[];
  total: number;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ todayRevenue: 0, todayOrders: 0, pendingOrders: 0, preparingOrders: 0, lowStock: 0, todayExpenses: 0 });
  const [openDebts, setOpenDebts] = useState(0);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'admin' | 'staff' | null>(null);

  const isStaff = role === 'staff';

  const fetchData = async (currentRole: 'admin' | 'staff' | null) => {
    try {
      const staff = currentRole === 'staff';

      // Personel finans ve stok uçlarına erişemez — onları hiç çağırma
      const [ordersRes, debtsRes, stockRes, financeRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/debts'),
        staff ? Promise.resolve(null) : fetch('/api/stock'),
        staff ? Promise.resolve(null) : fetch('/api/finance'),
      ]);

      const orders = await ordersRes.json();
      const debts = await debtsRes.json();
      const stock = stockRes ? await stockRes.json() : [];
      const finance = financeRes ? await financeRes.json() : [];

      const today = new Date().toISOString().split('T')[0];
      const todayOrders = orders.filter((o: RecentOrder) => o.createdAt.startsWith(today));
      const todayFinance = finance.filter((f: { date: string; type: string; amount: number }) => f.date === today);

      setStats({
        todayRevenue: todayFinance.filter((f: { type: string; amount: number }) => f.type === 'income').reduce((s: number, f: { amount: number }) => s + f.amount, 0),
        todayOrders: todayOrders.length,
        pendingOrders: orders.filter((o: RecentOrder) => o.status === 'pending').length,
        preparingOrders: orders.filter((o: RecentOrder) => o.status === 'preparing').length,
        lowStock: stock.filter((s: { quantity: number; minQuantity: number }) => s.quantity <= s.minQuantity).length,
        todayExpenses: todayFinance.filter((f: { type: string; amount: number }) => f.type === 'expense').reduce((s: number, f: { amount: number }) => s + f.amount, 0),
      });

      setOpenDebts(debts.filter((d: { status: string }) => d.status === 'unpaid').length);
      setRecentOrders(orders.slice(0, 8));
      setLoading(false);
    } catch { setLoading(false); }
  };

  useEffect(() => {
    let iv: ReturnType<typeof setInterval>;
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const r = d?.role ?? null;
        setRole(r);
        fetchData(r);
        iv = setInterval(() => fetchData(r), 5000);
      })
      .catch(() => setLoading(false));
    return () => clearInterval(iv);
  }, []);

  const statusLabel: Record<string, string> = {
    pending: 'Bekliyor', preparing: 'Hazırlanıyor', ready: 'Hazır', completed: 'Tamamlandı', cancelled: 'İptal'
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const adminCards = [
    { label: "Bugünkü Gelir", value: `₺${stats.todayRevenue.toLocaleString('tr-TR')}`, icon: '💰', color: '#22c55e', sub: `Gider: ₺${stats.todayExpenses.toLocaleString('tr-TR')}`, href: '/admin/finance' },
    { label: "Bugünkü Siparişler", value: stats.todayOrders, icon: '📊', color: '#3b82f6', sub: 'Toplam sipariş', href: '/admin/orders' },
    { label: "Bekleyen Siparişler", value: stats.pendingOrders, icon: '🛎', color: '#f59e0b', sub: `Hazırlanıyor: ${stats.preparingOrders}`, href: '/admin/orders' },
    { label: "Düşük Stok", value: stats.lowStock, icon: '⚠️', color: stats.lowStock > 0 ? '#ef4444' : '#22c55e', sub: stats.lowStock > 0 ? 'Stok uyarısı!' : 'Stok yeterli', href: '/admin/stock' },
  ];

  // Personel kartları — ciro / gider / maliyet yok
  const staffCards = [
    { label: "Bekleyen Siparişler", value: stats.pendingOrders, icon: '🛎', color: '#f59e0b', sub: `Hazırlanıyor: ${stats.preparingOrders}`, href: '/admin/orders' },
    { label: "Bugünkü Siparişler", value: stats.todayOrders, icon: '📊', color: '#3b82f6', sub: 'Toplam sipariş', href: '/admin/orders' },
    { label: "Açık Borçlar", value: openDebts, icon: '📒', color: openDebts > 0 ? '#f59e0b' : '#22c55e', sub: openDebts > 0 ? 'Tahsil edilmedi' : 'Açık borç yok', href: '/admin/debts' },
  ];

  const statCards = isStaff ? staffCards : adminCards;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>☕</div>
        <div style={{ color: '#94a3b8', fontSize: '16px' }}>Yükleniyor...</div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '4px' }}>
          Hoş Geldin ☀️
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {statCards.map((card, i) => (
          <Link key={i} href={card.href} style={{ textDecoration: 'none' }}>
            <div className="card-hover" style={{
              background: '#12121a',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px', padding: '22px',
              cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: `${card.color}20`, border: `1px solid ${card.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px'
                }}>{card.icon}</div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: card.color, marginBottom: '4px' }}>
                {card.value}
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>{card.label}</div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>{card.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div style={{
        background: '#12121a',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px', overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Son Siparişler</h2>
          <Link href="/admin/orders" style={{ fontSize: '13px', color: '#f59e0b', textDecoration: 'none' }}>
            Tümünü gör →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#475569' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
            <div>Henüz sipariş yok</div>
          </div>
        ) : (
          <div>
            {recentOrders.map((order, i) => (
              <div key={order.id} style={{
                padding: '16px 24px',
                borderBottom: i < recentOrders.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                display: 'flex', alignItems: 'center', gap: '16px',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: '#1a1a26', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '16px', flexShrink: 0,
                  fontWeight: 700, color: '#f59e0b'
                }}>
                  {order.tableNumber}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', color: '#f8fafc', fontWeight: 500, marginBottom: '2px' }}>
                    Daire {order.tableNumber}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#22c55e', marginBottom: '4px' }}>
                    ₺{order.total}
                  </div>
                  <span className={`status-${order.status}`} style={{
                    fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '6px',
                  }}>
                    {statusLabel[order.status]}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#475569', flexShrink: 0, width: '44px', textAlign: 'right' }}>
                  {formatTime(order.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

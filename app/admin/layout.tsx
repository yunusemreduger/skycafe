'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '⬡' },
  { href: '/admin/orders', label: 'Siparişler', icon: '🛎' },
  { href: '/admin/menu', label: 'Menü', icon: '📋' },
  { href: '/admin/stock', label: 'Stok', icon: '📦' },
  { href: '/admin/finance', label: 'Finans', icon: '💰' },
  { href: '/admin/qr', label: 'QR Kodlar', icon: '⬛' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState<boolean | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetch('/api/shop-status').then(r => r.json()).then(d => setShopOpen(d.shopOpen));
  }, []);

  const toggleShop = async () => {
    if (toggling || shopOpen === null) return;
    setToggling(true);
    const next = !shopOpen;
    setShopOpen(next);
    await fetch('/api/shop-status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopOpen: next }),
    });
    setToggling(false);
  };

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await fetch('/api/orders?status=pending');
        const data = await res.json();
        setPendingCount(data.length);
      } catch {}
    };
    fetchPending();
    const interval = setInterval(fetchPending, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'linear-gradient(rgba(10,10,15,0.60), rgba(10,10,15,0.70)), url(https://i.pinimg.com/736x/a0/e8/62/a0e862a298652353eeecba4aabe7564a.jpg) center/cover fixed' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 40, display: 'block'
          }}
          className="lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: '240px',
        background: '#0d0d18',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflowY: 'auto',
        zIndex: 50,
        transition: 'transform 0.3s ease',
      }}
      className={`fixed lg:static h-full ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', flexShrink: 0
            }}>☕</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.5px' }}>
                <span className="text-gradient">Sky</span>
                <span style={{ color: '#f8fafc' }}>Café</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>Site Kafe Yönetimi</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 12px', flex: 1 }}>
          {navItems.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '11px 14px', borderRadius: '10px',
                  marginBottom: '4px', textDecoration: 'none',
                  background: active ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                  color: active ? '#f59e0b' : '#94a3b8',
                  fontWeight: active ? 600 : 400,
                  fontSize: '14px',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  border: active ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent',
                }}
              >
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                <span>{item.label}</span>
                {item.href === '/admin/orders' && pendingCount > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '20px',
                    minWidth: '20px',
                    textAlign: 'center',
                  }}>{pendingCount}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Dükkan aç/kapat */}
          <button
            onClick={toggleShop}
            disabled={toggling || shopOpen === null}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: '12px',
              border: 'none', cursor: toggling ? 'wait' : 'pointer',
              background: shopOpen
                ? 'rgba(34,197,94,0.12)'
                : 'rgba(239,68,68,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>{shopOpen ? '🟢' : '🔴'}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: shopOpen ? '#4ade80' : '#f87171' }}>
                  {shopOpen === null ? '...' : shopOpen ? 'AÇIK' : 'KAPALI'}
                </div>
                <div style={{ fontSize: '10px', color: '#475569', marginTop: '1px' }}>
                  {shopOpen ? 'Sipariş alınıyor' : 'Sipariş kapalı'}
                </div>
              </div>
            </div>
            {/* Toggle pill */}
            <div style={{
              width: '36px', height: '20px', borderRadius: '10px',
              background: shopOpen ? '#22c55e' : '#374151',
              position: 'relative', transition: 'background 0.2s',
              flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: '3px',
                left: shopOpen ? '19px' : '3px',
                width: '14px', height: '14px', borderRadius: '50%',
                background: 'white', transition: 'left 0.2s',
              }} />
            </div>
          </button>

          {/* Çıkış */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: '#475569' }}>Sistem aktif</span>
            </div>
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/admin/login';
              }}
              style={{
                background: 'none', border: 'none', color: '#475569',
                fontSize: '12px', cursor: 'pointer', padding: '4px 8px',
                borderRadius: '6px', transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
            >Çıkış ↩</button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{
          height: '56px', background: '#0d0d18',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', padding: '0 24px',
          justifyContent: 'space-between', flexShrink: 0,
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'none', border: 'none', color: '#94a3b8',
              cursor: 'pointer', fontSize: '20px', padding: '4px',
            }}
            className="lg:hidden"
          >☰</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <div style={{
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '8px', padding: '6px 14px',
              fontSize: '13px', color: '#f59e0b', fontWeight: 500
            }}>
              👤 Admin
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

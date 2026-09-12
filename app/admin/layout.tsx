'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

type Role = 'admin' | 'staff';

const navItems: { href: string; label: string; icon: string; roles: Role[] }[] = [
  { href: '/admin',         label: 'Dashboard',    icon: '⬡',  roles: ['admin', 'staff'] },
  { href: '/admin/kasa',    label: 'Kasa',         icon: '🧾', roles: ['admin', 'staff'] },
  { href: '/admin/orders',  label: 'Siparişler',   icon: '🛎', roles: ['admin', 'staff'] },
  { href: '/admin/debts',   label: 'Borç Defteri', icon: '📒', roles: ['admin', 'staff'] },
  { href: '/admin/menu',    label: 'Menü',         icon: '📋', roles: ['admin'] },
  { href: '/admin/stock',   label: 'Stok',         icon: '📦', roles: ['admin'] },
  { href: '/admin/finance', label: 'Finans',       icon: '💰', roles: ['admin'] },
  { href: '/admin/qr',      label: 'QR Kodlar',    icon: '⬛', roles: ['admin'] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState<boolean | null>(null);
  const [toggling, setToggling] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    fetch('/api/shop-status').then(r => r.json()).then(d => setShopOpen(d.shopOpen)).catch(() => {});
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.role) { setRole(d.role); setUsername(d.username); } })
      .catch(() => {});
  }, []);

  const visibleNav = navItems.filter(i => !role || i.roles.includes(role));
  const isStaff = role === 'staff';

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
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F4EFE5' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(46,43,36,0.4)',
            zIndex: 40, display: 'block'
          }}
          className="lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: '240px',
        background: '#EFE8DA',
        borderRight: '1px solid #EFE8DA',
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
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid #EFE8DA' }}>
          <div>
            <div className="brand-title" style={{ fontSize: '15px', lineHeight: 1.35 }}>
              SKY<br />PROTEIN BAR
            </div>
            <div style={{ fontSize: '11px', color: '#746C5C', marginTop: '5px' }}>Yönetim Paneli</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 12px', flex: 1 }}>
          {visibleNav.map(item => {
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
                  background: active ? 'rgba(42,112,73, 0.12)' : 'transparent',
                  color: active ? '#2A7049' : '#6B6456',
                  fontWeight: active ? 600 : 400,
                  fontSize: '14px',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  border: active ? '1px solid rgba(42,112,73,0.2)' : '1px solid transparent',
                }}
              >
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                <span>{item.label}</span>
                {item.href === '/admin/orders' && pendingCount > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    background: '#C0392B',
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
        <div style={{ padding: '16px 20px', borderTop: '1px solid #EFE8DA', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Dükkan aç/kapat — sadece admin */}
          {!isStaff && (
          <button
            onClick={toggleShop}
            disabled={toggling || shopOpen === null}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: '12px',
              border: 'none', cursor: toggling ? 'wait' : 'pointer',
              background: shopOpen
                ? 'rgba(42,112,73,0.12)'
                : 'rgba(192,57,43,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>{shopOpen ? '🟢' : '🔴'}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: shopOpen ? '#256844' : '#A32D22' }}>
                  {shopOpen === null ? '...' : shopOpen ? 'AÇIK' : 'KAPALI'}
                </div>
                <div style={{ fontSize: '10px', color: '#7A7263', marginTop: '1px' }}>
                  {shopOpen ? 'Sipariş alınıyor' : 'Sipariş kapalı'}
                </div>
              </div>
            </div>
            {/* Toggle pill */}
            <div style={{
              width: '36px', height: '20px', borderRadius: '10px',
              background: shopOpen ? '#2A7049' : '#C4B69C',
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
          )}

          {/* Çıkış */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2A7049', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: '#7A7263' }}>Sistem aktif</span>
            </div>
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/admin/login';
              }}
              style={{
                background: 'none', border: 'none', color: '#7A7263',
                fontSize: '12px', cursor: 'pointer', padding: '4px 8px',
                borderRadius: '6px', transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#A32D22')}
              onMouseLeave={e => (e.currentTarget.style.color = '#7A7263')}
            >Çıkış ↩</button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{
          height: '56px', background: '#EFE8DA',
          borderBottom: '1px solid #EFE8DA',
          display: 'flex', alignItems: 'center', padding: '0 24px',
          justifyContent: 'space-between', flexShrink: 0,
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'none', border: 'none', color: '#6B6456',
              cursor: 'pointer', fontSize: '20px', padding: '4px',
            }}
            className="lg:hidden"
          >☰</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <div style={{
              background: isStaff ? 'rgba(37,99,235,0.1)' : 'rgba(42,112,73,0.1)',
              border: `1px solid ${isStaff ? 'rgba(37,99,235,0.25)' : 'rgba(42,112,73,0.2)'}`,
              borderRadius: '8px', padding: '6px 14px',
              fontSize: '13px', color: isStaff ? '#1D4ED8' : '#2A7049', fontWeight: 500
            }}>
              {isStaff ? '👥' : '👤'} {username || (isStaff ? 'Personel' : 'Admin')}
              <span style={{ opacity: 0.6, marginLeft: '6px', fontSize: '11px' }}>
                {isStaff ? 'Personel' : 'Yönetici'}
              </span>
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

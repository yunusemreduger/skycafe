'use client';
import { useEffect, useState, useRef } from 'react';

interface MenuItem {
  id: string; name: string; description: string; price: number;
  category: string; emoji: string; available: boolean; featured: boolean;
}

interface CartItem extends MenuItem { quantity: number; }

const CATEGORY_ICONS: Record<string, string> = {
  'Smoothie': '🥤',
  'Kahve': '☕',
  'Matcha': '🍵',
};

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const catScrollRef = useRef<HTMLDivElement>(null);
  const scrollCats = (dir: 'left' | 'right') => {
    catScrollRef.current?.scrollBy({ left: dir === 'left' ? -180 : 180, behavior: 'smooth' });
  };
  const [cartOpen, setCartOpen] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [daireNo, setDaireNo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [daireError, setDaireError] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [shopOpen, setShopOpen] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [menuRes, statusRes] = await Promise.all([
          fetch('/api/menu'),
          fetch('/api/shop-status'),
        ]);
        const menuData: MenuItem[] = await menuRes.json();
        const statusData = await statusRes.json();
        setMenuItems(menuData.filter(i => i.available));
        setShopOpen(statusData.shopOpen ?? true);
      } catch (e) {
        console.error('Veri yüklenemedi:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const categories = ['Tümü', ...Array.from(new Set(menuItems.map(i => i.category)))];
  const featuredItems = menuItems.filter(i => i.featured);

  const filtered = menuItems.filter(item => {
    const matchCat = activeCategory === 'Tümü' || item.category === activeCategory;
    const matchSearch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === id);
      if (existing && existing.quantity > 1) return prev.map(c => c.id === id ? { ...c, quantity: c.quantity - 1 } : c);
      return prev.filter(c => c.id !== id);
    });
  };

  const cartQuantity = (id: string) => cart.find(c => c.id === id)?.quantity || 0;
  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);
  const totalPrice = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  const submitOrder = async () => {
    let hasError = false;
    if (!daireNo.trim()) { setDaireError(true); hasError = true; }
    else setDaireError(false);
    if (!customerName.trim()) { setNameError(true); hasError = true; }
    else setNameError(false);
    if (hasError) return;
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: daireNo.trim(),
          customerName: customerName.trim() || undefined,
          items: cart.map(c => ({ menuItemId: c.id, name: c.name, price: c.price, quantity: c.quantity })),
          note: orderNote.trim() || undefined,
          paymentMethod,
        }),
      });
      setCart([]);
      setCartOpen(false);
      setOrderSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F4EFE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>☕</div>
        <div style={{ color: '#6B6456', fontSize: '15px' }}>Menü hazırlanıyor...</div>
      </div>
    </div>
  );

  if (!shopOpen) return (
    <div style={{ minHeight: '100vh', background: '#F4EFE5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ textAlign: 'center', maxWidth: '340px' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '24px',
          background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '36px', margin: '0 auto 24px',
        }}>🔴</div>
        <div className="brand-title" style={{ fontSize: '19px', marginBottom: '16px' }}>SKY PROTEIN BAR</div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#2E2B24', marginBottom: '10px' }}>
          Şu an kapalıyız
        </h2>
        <p style={{ color: '#746C5C', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
          Siparişler şu an alınmıyor. Lütfen daha sonra tekrar deneyin.
        </p>
      </div>
    </div>
  );

  if (orderSent) return (
    <div style={{ minHeight: '100vh', background: '#F4EFE5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ textAlign: 'center', maxWidth: '360px' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '10px', color: '#2E2B24' }}>Siparişiniz Alındı!</h2>
        <p style={{ color: '#746C5C', fontSize: '15px', lineHeight: '1.6', marginBottom: '28px' }}>
          Daire <strong style={{ color: '#2A7049' }}>{daireNo}</strong> için siparişiniz hazırlanmaya başladı. En kısa sürede kapınıza getirilecek.
        </p>
        <button
          onClick={() => { setOrderSent(false); setDaireNo(''); setCustomerName(''); setOrderNote(''); setPaymentMethod('cash'); }}
          style={{
            padding: '14px 32px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #2A7049, #256844)',
            border: 'none', color: '#fff', fontWeight: 700,
            fontSize: '15px', cursor: 'pointer'
          }}
        >Yeni Sipariş Ver</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F4EFE5', paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{
        background: 'rgba(244,239,229,0.96)',
        borderBottom: '1px solid #EFE8DA',
        padding: '20px 20px 0', position: 'sticky', top: 0, zIndex: 40,
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div className="brand-title" style={{ fontSize: '19px' }}>SKY PROTEIN BAR</div>
              <div className="brand-sub" style={{ fontSize: '10px', marginTop: '2px' }}>
                Smoothie · Kahve · Matcha
              </div>
            </div>

            <button
              onClick={() => setCartOpen(true)}
              style={{
                position: 'relative', padding: '10px 16px', borderRadius: '12px',
                background: totalItems > 0 ? 'linear-gradient(135deg, #2A7049, #256844)' : '#FFFFFF',
                border: totalItems > 0 ? 'none' : '1px solid #E3DACA',
                color: totalItems > 0 ? '#000' : '#6B6456',
                fontWeight: 700, cursor: 'pointer', fontSize: '14px',
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <span>🛒</span>
              {totalItems > 0 && <span>{totalItems} ürün · ₺{totalPrice}</span>}
            </button>
          </div>

          {/* Search */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#7A7263' }}>🔍</span>
              <input
                type="text" placeholder="Menüde ara..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '11px 14px 11px 36px',
                  background: '#FFFFFF', border: '1px solid #E3DACA',
                  borderRadius: '12px', color: '#2E2B24', fontSize: '14px', outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Category tabs */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Sol ok */}
            <button
              onClick={() => scrollCats('left')}
              style={{
                flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%',
                background: '#FAF7F0', border: '1px solid #E3DACA',
                color: '#6B6456', cursor: 'pointer', fontSize: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', lineHeight: 1,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#2A7049'; e.currentTarget.style.color = '#000'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FAF7F0'; e.currentTarget.style.color = '#6B6456'; }}
            >‹</button>

            <div ref={catScrollRef} style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', flex: 1 }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 14px', borderRadius: '10px', border: 'none',
                    cursor: 'pointer', fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap',
                    background: activeCategory === cat ? '#2A7049' : '#FFFFFF',
                    color: activeCategory === cat ? '#000' : '#6B6456',
                    transition: 'all 0.15s ease',
                    display: 'flex', alignItems: 'center', gap: '5px',
                  }}
                >
                  {cat !== 'Tümü' && <span>{CATEGORY_ICONS[cat] || '✨'}</span>}
                  {cat}
                </button>
              ))}
            </div>

            {/* Sağ ok */}
            <button
              onClick={() => scrollCats('right')}
              style={{
                flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%',
                background: '#FAF7F0', border: '1px solid #E3DACA',
                color: '#6B6456', cursor: 'pointer', fontSize: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', lineHeight: 1,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#2A7049'; e.currentTarget.style.color = '#000'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FAF7F0'; e.currentTarget.style.color = '#6B6456'; }}
            >›</button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px' }}>
        {/* Featured */}
        {activeCategory === 'Tümü' && !searchTerm && featuredItems.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#2A7049', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}>
              ⭐ Öne Çıkanlar
            </h2>
            <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
              {featuredItems.map(item => (
                <div key={item.id} style={{
                  background: 'linear-gradient(135deg, rgba(42,112,73,0.08), rgba(217,119,6,0.04))',
                  border: '1px solid rgba(42,112,73,0.2)',
                  borderRadius: '16px', padding: '16px',
                  minWidth: '160px', maxWidth: '160px', flexShrink: 0,
                  cursor: 'pointer',
                }} onClick={() => addToCart(item)}>
                  <div style={{ fontSize: '36px', textAlign: 'center', marginBottom: '8px' }}>{item.emoji}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px', textAlign: 'center' }}>{item.name}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#2A7049', textAlign: 'center' }}>₺{item.price}</div>
                  {cartQuantity(item.id) > 0 && (
                    <div style={{ marginTop: '8px', background: '#2A7049', color: '#fff', borderRadius: '8px', padding: '4px', textAlign: 'center', fontSize: '13px', fontWeight: 700 }}>
                      {cartQuantity(item.id)} sepette
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#7A7263' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
            <div>Sonuç bulunamadı</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(item => {
              const qty = cartQuantity(item.id);
              return (
                <div key={item.id} style={{
                  background: '#FFFFFF',
                  border: qty > 0 ? '1px solid rgba(42,112,73,0.3)' : '1px solid #E3DACA',
                  borderRadius: '14px', padding: '16px',
                  display: 'flex', gap: '14px', alignItems: 'center',
                  transition: 'all 0.15s ease',
                }}>
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '14px',
                    background: '#FAF7F0', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '28px', flexShrink: 0,
                  }}>{item.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '3px' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: '#746C5C', lineHeight: '1.4', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.description}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#2A7049' }}>
                      {item.price === 0 ? 'Fiyat sorunuz' : `₺${item.price}`}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {qty === 0 ? (
                      <button onClick={() => item.price > 0 && addToCart(item)} style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #2A7049, #256844)',
                        border: 'none', color: '#fff', fontSize: '20px',
                        cursor: 'pointer', fontWeight: 700, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}>+</button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => removeFromCart(item.id)} style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          background: '#FAF7F0', border: '1px solid #D6CBB6',
                          color: '#2E2B24', fontSize: '18px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>−</button>
                        <span style={{ fontWeight: 700, fontSize: '16px', color: '#2A7049', minWidth: '16px', textAlign: 'center' }}>{qty}</span>
                        <button onClick={() => addToCart(item)} style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          background: 'linear-gradient(135deg, #2A7049, #256844)',
                          border: 'none', color: '#fff', fontSize: '18px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed bottom cart button */}
      {totalItems > 0 && !cartOpen && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '16px 20px', background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)', borderTop: '1px solid #E3DACA',
          zIndex: 50,
        }}>
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <button onClick={() => setCartOpen(true)} style={{
              width: '100%', padding: '16px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #2A7049, #256844)',
              border: 'none', color: '#fff', fontWeight: 700,
              fontSize: '16px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>🛒 Sepetim ({totalItems})</span>
              <span>₺{totalPrice}</span>
            </button>
          </div>
        </div>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div onClick={() => setCartOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(46,43,36,0.4)' }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: '#FFFFFF', borderRadius: '24px 24px 0 0',
            maxHeight: '90vh', overflow: 'auto',
            border: '1px solid #E3DACA',
          }}>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>🛒 Sepetim</h2>
                <button onClick={() => setCartOpen(false)} style={{
                  background: '#FAF7F0', border: 'none', color: '#6B6456',
                  width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px'
                }}>×</button>
              </div>

              {/* Cart items */}
              <div style={{ marginBottom: '20px' }}>
                {cart.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 0', borderBottom: '1px solid #EFE8DA',
                  }}>
                    <span style={{ fontSize: '24px' }}>{item.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{item.name}</div>
                      <div style={{ fontSize: '13px', color: '#2A7049', fontWeight: 600, marginTop: '2px' }}>₺{item.price * item.quantity}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => removeFromCart(item.id)} style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#FAF7F0', border: '1px solid #D6CBB6', color: '#2E2B24', cursor: 'pointer', fontSize: '16px' }}>−</button>
                      <span style={{ fontWeight: 700, color: '#2A7049', minWidth: '16px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => addToCart(item)} style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#2A7049', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: 700 }}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Daire no — zorunlu */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#746C5C', display: 'block', marginBottom: '6px' }}>
                  Daire Numarası <span style={{ color: '#A32D22' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="örn. 12, 304, A-5..."
                  value={daireNo}
                  onChange={e => { setDaireNo(e.target.value); setDaireError(false); }}
                  style={{
                    width: '100%', padding: '12px 14px',
                    background: daireError ? 'rgba(192,57,43,0.08)' : '#FAF7F0',
                    border: daireError ? '1px solid rgba(192,57,43,0.5)' : '1px solid #D6CBB6',
                    borderRadius: '10px', color: '#2E2B24', fontSize: '16px', outline: 'none',
                  }}
                />
                {daireError && (
                  <p style={{ color: '#A32D22', fontSize: '12px', marginTop: '4px' }}>
                    Daire numaranızı girin
                  </p>
                )}
              </div>

              {/* Ad (zorunlu) */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: nameError ? '#A32D22' : '#746C5C', display: 'block', marginBottom: '6px' }}>Adınız <span style={{ color: '#A32D22' }}>*</span></label>
                <input
                  type="text" placeholder="Adınız..."
                  value={customerName} onChange={e => { setCustomerName(e.target.value); setNameError(false); }}
                  style={{ width: '100%', padding: '10px 14px', background: nameError ? 'rgba(192,57,43,0.08)' : '#FAF7F0', border: nameError ? '1px solid rgba(192,57,43,0.5)' : '1px solid #D6CBB6', borderRadius: '10px', color: '#2E2B24', fontSize: '14px', outline: 'none' }}
                />
                {nameError && <p style={{ color: '#A32D22', fontSize: '11px', marginTop: '4px' }}>Lütfen adınızı girin</p>}
              </div>

              {/* Not */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#746C5C', display: 'block', marginBottom: '6px' }}>Sipariş notu (isteğe bağlı)</label>
                <textarea
                  placeholder="Özel istek..." value={orderNote}
                  onChange={e => setOrderNote(e.target.value)} rows={2}
                  style={{ width: '100%', padding: '10px 14px', background: '#FAF7F0', border: '1px solid #D6CBB6', borderRadius: '10px', color: '#2E2B24', fontSize: '14px', outline: 'none', resize: 'none' }}
                />
              </div>

              {/* Ödeme yöntemi */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#746C5C', display: 'block', marginBottom: '8px' }}>
                  Ödeme Yöntemi <span style={{ color: '#A32D22' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {([
                    { key: 'cash', icon: '💵', label: 'Nakit', desc: 'Kapıda nakit ödeme' },
                    { key: 'card', icon: '💳', label: 'Kartla', desc: 'Kredi / banka kartı' },
                  ] as const).map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setPaymentMethod(opt.key)}
                      style={{
                        padding: '12px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                        background: paymentMethod === opt.key ? 'rgba(42,112,73,0.12)' : '#FAF7F0',
                        border: paymentMethod === opt.key ? '2px solid #2A7049' : '2px solid #E3DACA',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontSize: '22px', marginBottom: '4px' }}>{opt.icon}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: paymentMethod === opt.key ? '#2A7049' : '#2E2B24' }}>{opt.label}</div>
                      <div style={{ fontSize: '11px', color: '#746C5C', marginTop: '2px' }}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toplam */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderTop: '1px solid #E3DACA', marginBottom: '16px' }}>
                <span style={{ color: '#6B6456', fontSize: '14px' }}>Toplam</span>
                <span style={{ fontSize: '20px', fontWeight: 700, color: '#2A7049' }}>₺{totalPrice}</span>
              </div>

              <div style={{ paddingBottom: '8px' }}>
                <button
                  onClick={submitOrder}
                  disabled={submitting}
                  style={{
                    width: '100%', padding: '16px', borderRadius: '14px',
                    background: 'linear-gradient(135deg, #2A7049, #256844)',
                    border: 'none', color: '#fff', fontWeight: 700, fontSize: '16px',
                    cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? '⏳ Gönderiliyor...' : '✅ Sipariş Ver'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

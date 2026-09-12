'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok) {
        // Tam sayfa yüklemesi: yeni oturum çerezi middleware'e ilk istekte ulaşır.
        // router.push ile client-side gidilirse middleware çerezi henüz göremiyor
        // ve kullanıcı giriş ekranında kalıyordu.
        window.location.assign(data.redirect || '/admin');
        return; // yönlendirme sürerken butonu "Giriş yapılıyor" konumunda bırak
      }

      setError(data.error || 'Giriş başarısız');
    } catch {
      setError('Bağlantı hatası, tekrar deneyin');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#F4EFE5',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(42,112,73,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: '400px',
        background: '#FFFFFF',
        border: '1px solid #E3DACA',
        borderRadius: '24px',
        padding: '40px 36px',
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1 className="brand-title" style={{ fontSize: '20px', margin: 0 }}>SKY PROTEIN BAR</h1>
          <p className="brand-sub" style={{ fontSize: '10px', marginTop: '6px' }}>Yönetim Paneli</p>
        </div>

        {/* Form */}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#746C5C', display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Kullanıcı Adı
            </label>
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              placeholder="Kullanıcı adı"
              autoComplete="username"
              style={{
                width: '100%', padding: '12px 16px',
                background: '#FAF7F0',
                border: error ? '1px solid rgba(192,57,43,0.5)' : '1px solid #E3DACA',
                borderRadius: '12px', color: '#2E2B24', fontSize: '15px',
                outline: 'none', transition: 'border-color 0.15s',
              }}
              onFocus={e => { if (!error) e.target.style.borderColor = 'rgba(42,112,73,0.4)'; }}
              onBlur={e => { if (!error) e.target.style.borderColor = '#E3DACA'; }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#746C5C', display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Şifre
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%', padding: '12px 44px 12px 16px',
                  background: '#FAF7F0',
                  border: error ? '1px solid rgba(192,57,43,0.5)' : '1px solid #E3DACA',
                  borderRadius: '12px', color: '#2E2B24', fontSize: '15px',
                  outline: 'none', transition: 'border-color 0.15s',
                }}
                onFocus={e => { if (!error) e.target.style.borderColor = 'rgba(42,112,73,0.4)'; }}
                onBlur={e => { if (!error) e.target.style.borderColor = '#E3DACA'; }}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#7A7263',
                  cursor: 'pointer', fontSize: '16px', padding: '4px',
                }}
              >{showPass ? '🙈' : '👁'}</button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)',
              borderRadius: '10px', padding: '10px 14px',
              fontSize: '13px', color: '#A32D22', display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            style={{
              width: '100%', padding: '14px',
              borderRadius: '12px', border: 'none',
              background: (loading || !username || !password)
                ? '#FAF7F0'
                : 'linear-gradient(135deg, #2A7049, #256844)',
              color: (loading || !username || !password) ? '#7A7263' : '#fff',
              fontWeight: 700, fontSize: '15px',
              cursor: (loading || !username || !password) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              marginTop: '4px',
            }}
          >
            {loading ? '⏳ Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#746C5C', marginTop: '28px' }}>
          SKY PROTEIN BAR
        </p>
      </div>
    </div>
  );
}

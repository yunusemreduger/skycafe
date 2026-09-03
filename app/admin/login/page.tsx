'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
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

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(data.redirect || '/admin');
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || 'Giriş başarısız');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: '400px',
        background: '#12121a',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '24px',
        padding: '40px 36px',
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '30px', margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(245,158,11,0.25)',
          }}>☕</div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', margin: 0 }}>
            <span style={{
              background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Sky</span>
            <span style={{ color: '#f8fafc' }}>Café</span>
          </h1>
          <p style={{ color: '#475569', fontSize: '13px', marginTop: '6px' }}>Admin Paneli</p>
        </div>

        {/* Form */}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '8px', fontWeight: 500 }}>
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
                background: '#1a1a26',
                border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', color: '#f8fafc', fontSize: '15px',
                outline: 'none', transition: 'border-color 0.15s',
              }}
              onFocus={e => { if (!error) e.target.style.borderColor = 'rgba(245,158,11,0.4)'; }}
              onBlur={e => { if (!error) e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '8px', fontWeight: 500 }}>
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
                  background: '#1a1a26',
                  border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px', color: '#f8fafc', fontSize: '15px',
                  outline: 'none', transition: 'border-color 0.15s',
                }}
                onFocus={e => { if (!error) e.target.style.borderColor = 'rgba(245,158,11,0.4)'; }}
                onBlur={e => { if (!error) e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#475569',
                  cursor: 'pointer', fontSize: '16px', padding: '4px',
                }}
              >{showPass ? '🙈' : '👁'}</button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '10px', padding: '10px 14px',
              fontSize: '13px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px',
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
                ? '#1a1a26'
                : 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: (loading || !username || !password) ? '#475569' : '#000',
              fontWeight: 700, fontSize: '15px',
              cursor: (loading || !username || !password) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              marginTop: '4px',
            }}
          >
            {loading ? '⏳ Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#2d2d40', marginTop: '28px' }}>
          SkyCafé Yönetim Sistemi
        </p>
      </div>
    </div>
  );
}

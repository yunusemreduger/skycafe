'use client';
import { useEffect, useState } from 'react';

export default function QRPage() {
  const [baseUrl, setBaseUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  useEffect(() => {
    if (baseUrl) generateQR();
  }, [baseUrl]);

  const generateQR = async () => {
    setGenerating(true);
    try {
      const QRCode = (await import('qrcode')).default;
      const url = `${baseUrl}/menu`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 500, margin: 2,
        color: { dark: '#f59e0b', light: '#0a0a0f' },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(dataUrl);
    } finally {
      setGenerating(false);
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'skycafe-menu-qr.png';
    a.click();
  };

  const printQR = () => {
    if (!qrDataUrl) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SkyCafé QR Menü</title>
        <style>
          body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: white; font-family: Arial, sans-serif; }
          .card { text-align: center; border: 3px solid #f59e0b; border-radius: 20px; padding: 32px 40px; max-width: 360px; }
          .logo { font-size: 28px; font-weight: 900; margin-bottom: 4px; color: #111; }
          .logo span { color: #f59e0b; }
          .subtitle { font-size: 13px; color: #888; margin-bottom: 20px; }
          img { width: 260px; height: 260px; border-radius: 12px; }
          .info { margin-top: 16px; font-size: 13px; color: #555; line-height: 1.5; }
          @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">☕ Sky<span>Café</span></div>
          <div class="subtitle">Site Kafesi</div>
          <img src="${qrDataUrl}" alt="QR Menü" />
          <div class="info">
            📱 QR kodu okutun<br>
            menüyü görün ve sipariş verin
          </div>
        </div>
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  const menuUrl = `${baseUrl}/menu`;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>QR Kod</h1>
        <p style={{ color: '#64748b', fontSize: '13px' }}>
          Tek QR kod — müşteri okutunca menüyü görür, sipariş verirken daire numarasını kendisi girer
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {/* QR Card */}
        <div style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '28px', textAlign: 'center' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Kafe Menü QR</div>
            <div style={{ fontSize: '12px', color: '#475569', wordBreak: 'break-all' }}>{menuUrl}</div>
          </div>

          {generating ? (
            <div style={{ width: '220px', height: '220px', background: '#1a1a26', borderRadius: '16px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '14px' }}>
              Oluşturuluyor...
            </div>
          ) : qrDataUrl ? (
            <div style={{ display: 'inline-block', background: '#0a0a0f', borderRadius: '16px', padding: '16px', border: '2px solid rgba(245,158,11,0.3)', marginBottom: '20px' }}>
              <img src={qrDataUrl} alt="QR Code" style={{ width: '220px', height: '220px', display: 'block' }} />
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={downloadQR} disabled={!qrDataUrl} style={{
              flex: 1, padding: '12px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '13px'
            }}>⬇️ İndir</button>
            <button onClick={printQR} disabled={!qrDataUrl} style={{
              flex: 1, padding: '12px', borderRadius: '10px',
              background: '#1a1a26', border: '1px solid rgba(255,255,255,0.08)',
              color: '#94a3b8', cursor: 'pointer', fontSize: '13px'
            }}>🖨️ Yazdır</button>
            <button onClick={() => window.open(menuUrl, '_blank')} style={{
              flex: 1, padding: '12px', borderRadius: '10px',
              background: '#1a1a26', border: '1px solid rgba(255,255,255,0.08)',
              color: '#94a3b8', cursor: 'pointer', fontSize: '13px'
            }}>👁 Önizle</button>
          </div>
        </div>

        {/* Nasıl çalışır */}
        <div style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>📌 Nasıl Çalışır?</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: '1️⃣', title: 'QR\'ı Yazdır', desc: 'Tek QR — kafenin girişine, masalara veya site geneline asın' },
              { icon: '2️⃣', title: 'Müşteri Okuttu', desc: 'Telefon kamerasıyla okutunca menü sayfası açılır' },
              { icon: '3️⃣', title: 'Menüyü Gördü, Seçti', desc: 'Ürünleri sepete ekler, sipariş vermek için sepete geçer' },
              { icon: '4️⃣', title: 'Daire No Girer', desc: 'Sepet ekranında daire numarasını yazar (zorunlu alan)' },
              { icon: '5️⃣', title: 'Sipariş Düşer', desc: 'Admin panelinde anında görünür, ses bildirimi çalar' },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px' }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>{step.icon}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>{step.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

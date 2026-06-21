'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ftwzrojfmczmgnecjavy.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0d3pyb2pmbWN6bWduZWNqYXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3ODc3MTEsImV4cCI6MjA5NzM2MzcxMX0.WGK0d4loqaTnkUaYPsq-l5IVF3WwII05T1n9iy8QGfQ'
);

export default function Page() {
  const [tenants, setTenants] = useState([]);

  useEffect(() => {
    // მონაცემების წამოღება ახალი status სვეტით
    supabase.from('tenants').select('*').then(({ data }) => setTenants(data || []));
  }, []);

  // სტატუსის შეცვლის ფუნქცია
  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'pending' : 'active';
    
    // ვაახლებთ მონაცემს ბაზაში
    await supabase.from('tenants').update({ status: newStatus }).eq('id', id);
    
    // ვაახლებთ ეკრანს (UI)
    setTenants(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  return (
    <main style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>🏢 Agency OS: Client Manager</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {tenants.map(t => (
          <li key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid #eee' }}>
            <span>{t.name}</span>
            <button 
              onClick={() => toggleStatus(t.id, t.status)}
              style={{ 
                padding: '6px 12px', 
                borderRadius: '6px',
                background: t.status === 'active' ? '#dcfce7' : '#fee2e2',
                color: t.status === 'active' ? '#166534' : '#991b1b',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {t.status || 'active'}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
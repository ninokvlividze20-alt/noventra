cat << 'EOF' > app/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LandingPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [formData, setFormData] = useState<{ [key: number]: any }>({});
  const [submitted, setSubmitted] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<number | null>(null);

  async function fetchDeals() {
    const { data } = await supabase.from('deals').select('*').eq('is_active', true);
    if (data) setDeals(data);
  }

  useEffect(() => {
    fetchDeals();
    const interval = setInterval(fetchDeals, 3000);
    const saved = localStorage.getItem('submitted_deals');
    if (saved) {
      try { setSubmitted(new Set(JSON.parse(saved))); } catch (e) {}
    }
    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(deal: any) {
    const data = formData[deal.id];
    if (!data?.name || !data?.phone || !data?.address) return alert('გთხოვთ შეავსოთ ყველა ველი!');
    setLoading(deal.id);
    await supabase.from('leads').insert([{ name: data.name, phone: data.phone, address: data.address, deal_id: deal.id }]);
    await supabase.rpc('increment_deal', { row_id: deal.id });
    const newSubmitted = new Set(submitted).add(deal.id);
    setSubmitted(newSubmitted);
    localStorage.setItem('submitted_deals', JSON.stringify(Array.from(newSubmitted)));
    await fetchDeals();
    setLoading(null);
  }

  return (
    <div style={{ backgroundColor: '#EBE7E1', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>მიმდინარე აქციები</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {deals.map(deal => {
            const progress = Math.min((deal.current_count / deal.target_count) * 100, 100);
            const isDone = submitted.has(deal.id);
            return (
              <div key={deal.id} style={{ backgroundColor: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <img src={deal.image_url} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '15px' }} />
                <h2 style={{ fontSize: '18px', margin: '15px 0' }}>{deal.title}</h2>
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold' }}>
                    <span>{deal.current_count} მონაწილე</span>
                    <span>მიზანი: {deal.target_count}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#eee', borderRadius: '4px', marginTop: '5px' }}>
                    <div style={{ width: \`\${progress}%\`, height: '100%', backgroundColor: '#10B981', borderRadius: '4px' }}></div>
                  </div>
                </div>
                {!isDone ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input placeholder="სახელი" onChange={(e) => setFormData({...formData, [deal.id]: {...formData[deal.id], name: e.target.value}})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                    <input placeholder="ტელეფონი" onChange={(e) => setFormData({...formData, [deal.id]: {...formData[deal.id], phone: e.target.value}})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                    <input placeholder="მისამართი" onChange={(e) => setFormData({...formData, [deal.id]: {...formData[deal.id], address: e.target.value}})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                    <button onClick={() => handleSubmit(deal)} style={{ padding: '12px', backgroundColor: 'black', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                      {loading === deal.id ? 'იტვირთება...' : 'მინდა მონაწილეობა'}
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f0fff4', borderRadius: '10px' }}>
                    <p style={{ color: '#10B981', fontWeight: 'bold' }}>მადლობა! დაგიკავშირდებით!</p>
                    <a href={deal.facebook_link || "#"} target="_blank" style={{ display: 'block', backgroundColor: '#0084FF', color: 'white', padding: '10px', borderRadius: '8px', textDecoration: 'none', marginTop: '10px' }}>
                      მომწერეთ მესენჯერში
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
EOF
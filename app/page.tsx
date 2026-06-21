'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LandingPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [formData, setFormData] = useState<{ [key: number]: { name: string, phone: string, address: string } }>({});
  const [submitted, setSubmitted] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<number | null>(null);

  const checkUserStatus = useCallback(async () => {
    const saved = localStorage.getItem('submitted_deals');
    if (!saved) return;

    const savedIds = JSON.parse(saved);
    const { data: leads } = await supabase.from('leads').select('deal_id');
    const activeDealIds = new Set(leads?.map(l => l.deal_id) || []);
    
    const validIds = savedIds.filter((id: number) => activeDealIds.has(id));
    setSubmitted(new Set(validIds));
    localStorage.setItem('submitted_deals', JSON.stringify(validIds));
  }, []);

  const fetchDeals = useCallback(async () => {
    const { data } = await supabase.from('deals').select('*').eq('is_active', true);
    if (data) {
      setDeals(data);
      checkUserStatus();
    }
  }, [checkUserStatus]);

  useEffect(() => {
    const saved = localStorage.getItem('submitted_deals');
    if (saved) {
      try { setSubmitted(new Set(JSON.parse(saved))); } catch (e) {}
    }
    fetchDeals();
    const interval = setInterval(fetchDeals, 5000);
    return () => clearInterval(interval);
  }, [fetchDeals]);

  const handleInputChange = (dealId: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [dealId]: { ...prev[dealId], [field]: value }
    }));
  };

  async function handleSubmit(deal: any) {
    const data = formData[deal.id];
    if (!data?.name || !data?.phone || !data?.address) return alert('გთხოვთ შეავსოთ ყველა ველი!');
    
    setLoading(deal.id);
    
    const { error: insertError } = await supabase.from('leads').insert([{ 
      name: data.name, phone: data.phone, address: data.address, deal_id: deal.id 
    }]);

    if (!insertError) {
      await supabase.rpc('increment_deal', { row_id: deal.id });
      const newSubmitted = new Set(submitted).add(deal.id);
      setSubmitted(newSubmitted);
      localStorage.setItem('submitted_deals', JSON.stringify(Array.from(newSubmitted)));
      fetchDeals();
    } else {
      alert('შეცდომა: ' + insertError.message);
    }
    setLoading(null);
  }

  return (
    <div style={{ backgroundColor: '#F3F4F6', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '40px', color: '#1F2937' }}>მიმდინარე აქციები</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {deals.map(deal => {
            const progress = Math.min((deal.current_count / deal.target_count) * 100, 100);
            const isDone = submitted.has(deal.id);
            const dealForm = formData[deal.id] || { name: '', phone: '', address: '' };

            return (
              <div key={deal.id} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                <img src={deal.image_url} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px' }} />
                <h2 style={{ fontSize: '20px', margin: '15px 0' }}>{deal.title}</h2>
                <p style={{ fontSize: '14px', color: '#6B7280', minHeight: '40px' }}>{deal.description || "დეტალური ინფორმაცია მალე დაემატება."}</p>
                
                <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#059669' }}>{deal.discounted_price} ₾</span>
                  <span style={{ fontSize: '14px', color: '#9CA3AF', textDecoration: 'line-through' }}>{deal.original_price} ₾</span>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                    <span>{deal.current_count} მონაწილე</span>
                    <span>მიზანი: {deal.target_count}</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', backgroundColor: '#E5E7EB', borderRadius: '5px' }}>
                    <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#059669', borderRadius: '5px', transition: 'width 0.5s' }}></div>
                  </div>
                </div>
                
                {!isDone ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input placeholder="სახელი" value={dealForm.name} onChange={(e) => handleInputChange(deal.id, 'name', e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                    <input placeholder="ტელეფონი" value={dealForm.phone} onChange={(e) => handleInputChange(deal.id, 'phone', e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                    <input placeholder="მისამართი" value={dealForm.address} onChange={(e) => handleInputChange(deal.id, 'address', e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                    <button disabled={loading === deal.id} onClick={() => handleSubmit(deal)} style={{ padding: '14px', backgroundColor: '#111827', color: 'white', borderRadius: '8px', border: 'none', cursor: loading === deal.id ? 'not-allowed' : 'pointer' }}>
                      {loading === deal.id ? 'იტვირთება...' : 'მინდა მონაწილეობა'}
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#ECFDF5', borderRadius: '12px' }}>
                    <p style={{ color: '#059669', fontWeight: 'bold', margin: '0 0 10px 0' }}>გილოცავთ, თქვენ უკვე ჩაერთეთ!</p>
                    <a href={deal.whatsapp_link || "#"} target="_blank" style={{ display: 'block', backgroundColor: '#25D366', color: 'white', padding: '12px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
                      შემოგვიერთდით ვოტსაპ ჯგუფში 📱
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
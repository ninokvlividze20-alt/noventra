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

  // ფუნქცია, რომელიც ამოწმებს ბაზაში, ნამდვილად არსებობს თუ არა მონაწილე
  async function checkUserStatus(dealsList: any[]) {
    const saved = localStorage.getItem('submitted_deals');
    if (!saved) return;

    const savedIds = JSON.parse(saved);
    // ვამოწმებთ, რომელი deal_id-ებია დარჩენილი ბაზაში
    const { data: leads } = await supabase
      .from('leads')
      .select('deal_id');

    const activeDealIds = new Set(leads?.map(l => l.deal_id) || []);
    
    // ვტოვებთ მხოლოდ იმ ID-ებს, რომლებიც მართლაც არის ბაზაში
    const validIds = savedIds.filter((id: number) => activeDealIds.has(id));
    
    setSubmitted(new Set(validIds));
    localStorage.setItem('submitted_deals', JSON.stringify(validIds));
  }

  async function fetchDeals() {
    const { data } = await supabase.from('deals').select('*').eq('is_active', true);
    if (data) {
      setDeals(data);
      checkUserStatus(data); // მონაცემების წამოღებისას ვამოწმებთ სტატუსსაც
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('submitted_deals');
    if (saved) {
      try {
        setSubmitted(new Set(JSON.parse(saved)));
      } catch (e) {}
    }
    fetchDeals();
    const interval = setInterval(fetchDeals, 3000);
    return () => clearInterval(interval);
  }, []);

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
                
                <h2 style={{ fontSize: '18px', margin: '15px 0 5px 0' }}>{deal.title}</h2>
                
                {deal.description ? (
                  <p style={{ fontSize: '14px', color: '#555', margin: '10px 0' }}>{deal.description}</p>
                ) : (
                  <p style={{ fontSize: '14px', color: '#999', margin: '10px 0', fontStyle: 'italic' }}>დეტალური ინფორმაცია მალე დაემატება.</p>
                )}
                
                <div style={{ margin: '15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#10B981' }}>{deal.discounted_price} ₾</span>
                  <span style={{ fontSize: '14px', color: '#9CA3AF', textDecoration: 'line-through' }}>{deal.original_price} ₾</span>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold' }}>
                    <span>{deal.current_count} მონაწილე</span>
                    <span>მიზანი: {deal.target_count}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#eee', borderRadius: '4px', marginTop: '5px' }}>
                    <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#10B981', borderRadius: '4px' }}></div>
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
                    <p style={{ color: '#10B981', fontWeight: 'bold' }}>გილოცავთ, თქვენ უკვე ჩაერთეთ აქციაში!</p>
                    <a href={deal.facebook_link || "#"} target="_blank" style={{ display: 'block', backgroundColor: '#0084FF', color: 'white', padding: '10px', borderRadius: '8px', textDecoration: 'none', marginTop: '10px' }}>
                      აუცილებლად შემოგვიერთდით მესენჯერში
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
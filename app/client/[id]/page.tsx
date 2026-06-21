'use client';
import { useEffect, useState, use } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// აქ შევცვალეთ params ტიპი Promise-ით
export default function ClientDetails({ params }: { params: Promise<{ id: string }> }) {
  // use(params) იღებს Promise-ს და გვიბრუნებს ობიექტს
  const { id } = use(params);
  
  const [tenant, setTenant] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [amountInput, setAmountInput] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      const { data: t } = await supabase.from('tenants').select('*').eq('id', id).single();
      const { data: p } = await supabase.from('payments').select('*').eq('tenant_id', id).order('payment_date', { ascending: false });
      setTenant(t);
      setPayments(p || []);
    }
    fetchData();
  }, [id]);

  async function recordPayment() {
    if (!amountInput) return;
    await supabase.from('payments').insert([{ tenant_id: id, amount: parseFloat(amountInput) }]);
    setAmountInput('');
    // განახლება
    const { data: p } = await supabase.from('payments').select('*').eq('tenant_id', id).order('payment_date', { ascending: false });
    setPayments(p || []);
  }

  if (!tenant) return <div className="p-20 text-center">იტვირთება...</div>;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-slate-400 hover:text-slate-600 mb-6 block">&larr; უკან დაბრუნება</Link>
        
        {/* 1. კლიენტის დოსიე */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 mb-6">
          <h1 className="text-3xl font-black mb-1">{tenant.name}</h1>
          <p className="text-slate-500 font-medium">📞 {tenant.phone}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 2. ფინანსური მდგომარეობა */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">ფინანსური მონაცემები</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold">შეთანხმებული გადასახადი</p>
                <p className="text-2xl font-black">{tenant.amount || 0} GEL</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold">გადახდის დღე (თვის)</p>
                <p className="text-lg font-bold">{tenant.due_date}-რიცხვი</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-slate-400 uppercase font-bold mb-2">ახალი გადახდის დაფიქსირება</p>
                <div className="flex gap-2">
                  <input type="number" placeholder="თანხა (GEL)" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} className="border p-2 rounded-lg w-full" />
                  <button onClick={recordPayment} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">დამატება</button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. ისტორია და შენიშვნები */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">ისტორია და შენიშვნები</h2>
            <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
              {payments.length === 0 ? <p className="text-slate-400 text-sm">გადახდები არ არის.</p> : 
                payments.map(p => (
                  <div key={p.id} className="flex justify-between bg-slate-50 p-2 rounded-lg text-sm">
                    <span>{new Date(p.payment_date).toLocaleDateString()}</span>
                    <span className="font-bold text-emerald-600">+{p.amount} GEL</span>
                  </div>
              ))}
            </div>
            <div className="border-t pt-4">
              <p className="text-xs text-slate-400 uppercase font-bold mb-1">შენიშვნები</p>
              <p className="text-slate-600 text-sm italic">{tenant.notes || 'შენიშვნები არ არის მითითებული.'}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
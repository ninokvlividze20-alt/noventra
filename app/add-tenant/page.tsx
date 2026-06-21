'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function AddTenant() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [due_date, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function save() {
    setLoading(true);
    const { error } = await supabase.from('tenants').insert([
      { name, phone, amount, due_date, notes, status: 'active' }
    ]);
    
    if (error) {
      alert('შეცდომა: ' + error.message);
    } else {
      router.push('/');
    }
    setLoading(false);
  }

  return (
    <main className="p-10 max-w-lg mx-auto">
      <h1 className="text-3xl font-black mb-8">ახალი კლიენტის დამატება</h1>
      <div className="space-y-4">
        <input className="w-full border p-4 rounded-xl" placeholder="სახელი" onChange={(e) => setName(e.target.value)} />
        <input className="w-full border p-4 rounded-xl" placeholder="ტელეფონის ნომერი" onChange={(e) => setPhone(e.target.value)} />
        <input type="number" className="w-full border p-4 rounded-xl" placeholder="თანხა (ლარი)" onChange={(e) => setAmount(e.target.value)} />
        <input type="number" className="w-full border p-4 rounded-xl" placeholder="გადახდის დღე (მაგ: 15)" onChange={(e) => setDueDate(e.target.value)} />
        <textarea className="w-full border p-4 rounded-xl" placeholder="შენიშვნა" onChange={(e) => setNotes(e.target.value)} />
        
        <button 
          onClick={save} 
          disabled={loading}
          className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700"
        >
          {loading ? 'იწერება...' : 'მონაცემების შენახვა'}
        </button>
      </div>
    </main>
  );
}

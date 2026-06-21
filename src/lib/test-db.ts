import { supabase } from './supabase';

async function testConnection() {
  const { data, error } = await supabase
    .from('tenants')
    .insert([{ name: 'Test Tenant', slug: 'test-tenant' }])
    .select();

  if (error) {
    console.error('შეცდომა:', error.message);
  } else {
    console.log('წარმატებით დაემატა:', data);
  }
}

testConnection();

const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ftwzrojfmczmgnecjavy.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0d3pyb2pmbWN6bWduZWNqYXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3ODc3MTEsImV4cCI6MjA5NzM2MzcxMX0.WGK0d4loqaTnkUaYPsq-l5IVF3WwII05T1n9iy8QGfQ',
  { realtime: { transport: WebSocket } }
);

async function insertTenant() {
  const { data, error } = await supabase
    .from('tenants')
    .insert([{ name: 'Test Tenant', slug: 'test-tenant-' + Date.now() }])
    .select();

  if (error) console.error('შეცდომა ჩაწერისას:', error.message);
  else console.log('წარმატებით დაემატა:', data);
}

insertTenant();
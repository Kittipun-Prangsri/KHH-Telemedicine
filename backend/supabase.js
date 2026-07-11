const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseKey === 'YOUR_SUPABASE_ANON_KEY_HERE') {
  console.error('❌ กรุณากำหนด SUPABASE_URL และ SUPABASE_ANON_KEY ใน backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    transport: ws,
  },
});

module.exports = supabase;

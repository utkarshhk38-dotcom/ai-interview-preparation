const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function tryExecSql() {
  console.log('Checking for exec_sql RPC...');
  
  const sql = `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS resume_text TEXT;`;
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('RPC Error:', error.message);
    if (error.message.includes('function "exec_sql" does not exist')) {
      console.log('CONFIRMED: exec_sql function does not exist.');
    }
  } else {
    console.log('SUCCESS! SQL executed via RPC.');
  }
}

tryExecSql();

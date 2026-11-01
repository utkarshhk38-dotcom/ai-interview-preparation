const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkSchema() {
  console.log('Checking database schema...');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error selecting from profiles:', error.message);
    } else if (data && data.length > 0) {
      console.log('✅ Successfully connected to profiles table');
      console.log('Columns found:', Object.keys(data[0]).join(', '));
      
      if (Object.keys(data[0]).includes('avatar_url')) {
        console.log('✅ avatar_url column exists');
      } else {
        console.log('❌ avatar_url column is MISSING');
      }
    } else {
      console.log('ℹ️ Table is empty, cannot verify columns through select.');
    }
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

checkSchema();

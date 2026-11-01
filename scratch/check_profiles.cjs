const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkProfilesSchema() {
  console.log('Checking Profiles Table Schema...');
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error fetching profile:', error.message);
  } else if (data && data.length > 0) {
    console.log('Columns in profiles:', Object.keys(data[0]).join(', '));
  } else {
    console.log('No profiles found.');
  }
}

checkProfilesSchema();

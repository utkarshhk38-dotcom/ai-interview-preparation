import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  console.log('🔍 Testing OpenAI API Connection...');
  console.log(`Model: ${process.env.OPENAI_MODEL || 'gpt-3.5-turbo'}`);
  console.log(`API Key starts with: ${process.env.OPENAI_API_KEY?.substring(0, 7)}...`);

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello, are you working? Please respond with a short sentence.' },
      ],
      max_tokens: 50,
    });

    console.log('\n✅ OpenAI is WORKING!');
    console.log('Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('\n❌ OpenAI is NOT working.');
    if (error.status === 401) {
      console.error('Error: Invalid API Key. Please check your .env file.');
    } else if (error.status === 429) {
      console.error('Error: Quota exceeded or Rate limited. Please check your billing at platform.openai.com.');
    } else {
      console.error('Error Details:', error.message);
    }
  }
}

testOpenAI();

const OpenAI = require('openai');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from the root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  console.log('Testing OpenAI Key...');
  console.log('Key (masked):', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'MISSING');
  
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say hello!' }],
      max_tokens: 10,
    });
    console.log('SUCCESS!');
    console.log('Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('FAILED!');
    console.error('Error Message:', error.message);
    if (error.status === 401) {
      console.error('Reason: Invalid API Key');
    } else if (error.status === 429) {
      console.error('Reason: Rate limit or insufficient quota');
    }
  }
}

testOpenAI();

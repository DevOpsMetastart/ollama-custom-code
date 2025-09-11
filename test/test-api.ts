/**
 * API Test Suite - TypeScript
 * Basic tests for the Ollama API Controller
 */

import axios from 'axios';

const BASE_URL = process.env['API_BASE_URL'] || 'http://localhost:3000';
const API_KEY = process.env['API_KEY'] || 'your-api-key-here';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json'
  }
});

/**
 * Test health endpoint
 */
async function testHealth(): Promise<void> {
  try {
    console.log('Testing health endpoint...');
    const response = await client.get('/api/ollama/health');
    console.log('✅ Health check passed:', response.data);
  } catch (error) {
    console.error('❌ Health check failed:', error);
  }
}

/**
 * Test models endpoint
 */
async function testModels(): Promise<void> {
  try {
    console.log('Testing models endpoint...');
    const response = await client.get('/api/ollama/models');
    console.log('✅ Models retrieved:', response.data);
  } catch (error) {
    console.error('❌ Models test failed:', error);
  }
}

/**
 * Test chat completion
 */
async function testChatCompletion(): Promise<void> {
  try {
    console.log('Testing chat completion...');
    const response = await client.post('/api/ollama/chat', {
      model: 'llama2',
      messages: [
        { role: 'user', content: 'Hello, how are you?' }
      ],
      temperature: 0.7,
      max_tokens: 100
    });
    console.log('✅ Chat completion successful:', response.data);
  } catch (error) {
    console.error('❌ Chat completion failed:', error);
  }
}

/**
 * Test text completion
 */
async function testTextCompletion(): Promise<void> {
  try {
    console.log('Testing text completion...');
    const response = await client.post('/api/ollama/generate', {
      model: 'llama2',
      prompt: 'Write a short story about a robot.',
      temperature: 0.7,
      max_tokens: 100
    });
    console.log('✅ Text completion successful:', response.data);
  } catch (error) {
    console.error('❌ Text completion failed:', error);
  }
}

/**
 * Run all tests
 */
async function runTests(): Promise<void> {
  console.log('🚀 Starting API tests...\n');
  
  await testHealth();
  console.log('');
  
  await testModels();
  console.log('');
  
  await testChatCompletion();
  console.log('');
  
  await testTextCompletion();
  console.log('');
  
  console.log('✅ All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { testHealth, testModels, testChatCompletion, testTextCompletion, runTests };

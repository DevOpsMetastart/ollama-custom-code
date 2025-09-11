"use strict";
/**
 * API Test Suite - TypeScript
 * Basic tests for the Ollama API Controller
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTests = exports.testTextCompletion = exports.testChatCompletion = exports.testModels = exports.testHealth = void 0;
const axios_1 = __importDefault(require("axios"));
const BASE_URL = process.env['API_BASE_URL'] || 'http://localhost:3000';
const API_KEY = process.env['API_KEY'] || 'your-api-key-here';
const client = axios_1.default.create({
    baseURL: BASE_URL,
    headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
    }
});
/**
 * Test health endpoint
 */
async function testHealth() {
    try {
        console.log('Testing health endpoint...');
        const response = await client.get('/api/ollama/health');
        console.log('✅ Health check passed:', response.data);
    }
    catch (error) {
        console.error('❌ Health check failed:', error);
    }
}
exports.testHealth = testHealth;
/**
 * Test models endpoint
 */
async function testModels() {
    try {
        console.log('Testing models endpoint...');
        const response = await client.get('/api/ollama/models');
        console.log('✅ Models retrieved:', response.data);
    }
    catch (error) {
        console.error('❌ Models test failed:', error);
    }
}
exports.testModels = testModels;
/**
 * Test chat completion
 */
async function testChatCompletion() {
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
    }
    catch (error) {
        console.error('❌ Chat completion failed:', error);
    }
}
exports.testChatCompletion = testChatCompletion;
/**
 * Test text completion
 */
async function testTextCompletion() {
    try {
        console.log('Testing text completion...');
        const response = await client.post('/api/ollama/generate', {
            model: 'llama2',
            prompt: 'Write a short story about a robot.',
            temperature: 0.7,
            max_tokens: 100
        });
        console.log('✅ Text completion successful:', response.data);
    }
    catch (error) {
        console.error('❌ Text completion failed:', error);
    }
}
exports.testTextCompletion = testTextCompletion;
/**
 * Run all tests
 */
async function runTests() {
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
exports.runTests = runTests;
// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}
//# sourceMappingURL=test-api.js.map
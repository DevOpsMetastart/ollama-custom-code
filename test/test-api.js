const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/ollama';
const API_KEY = process.env.API_KEY || 'your-secret-api-key-here';

// Test configuration
const testConfig = {
    headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
    }
};

async function testHealthCheck() {
    console.log('🏥 Testing Health Check...');
    try {
        const response = await axios.get(`${API_BASE_URL}/health`);
        console.log('✅ Health Check:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Health Check Failed:', error.response?.data || error.message);
        return false;
    }
}

async function testListModels() {
    console.log('📋 Testing List Models...');
    try {
        const response = await axios.get(`${API_BASE_URL}/models`, testConfig);
        console.log('✅ List Models:', response.data);
        return response.data.models || [];
    } catch (error) {
        console.error('❌ List Models Failed:', error.response?.data || error.message);
        return [];
    }
}

async function testChatCompletion() {
    console.log('💬 Testing Chat Completion...');
    try {
        const response = await axios.post(`${API_BASE_URL}/chat`, {
            model: 'llama2',
            messages: [
                { role: 'user', content: 'Hello! Please respond with a short greeting.' }
            ],
            temperature: 0.7,
            max_tokens: 100
        }, testConfig);
        
        console.log('✅ Chat Completion:', {
            success: response.data.success,
            model: response.data.model,
            processing_time: response.data.processing_time_ms,
            response_length: response.data.data?.message?.content?.length || 0
        });
        return true;
    } catch (error) {
        console.error('❌ Chat Completion Failed:', error.response?.data || error.message);
        return false;
    }
}

async function testTextCompletion() {
    console.log('📝 Testing Text Completion...');
    try {
        const response = await axios.post(`${API_BASE_URL}/generate`, {
            model: 'llama2',
            prompt: 'Write a one-sentence story about a robot.',
            temperature: 0.7,
            max_tokens: 100
        }, testConfig);
        
        console.log('✅ Text Completion:', {
            success: response.data.success,
            model: response.data.model,
            processing_time: response.data.processing_time_ms,
            response_length: response.data.data?.response?.length || 0
        });
        return true;
    } catch (error) {
        console.error('❌ Text Completion Failed:', error.response?.data || error.message);
        return false;
    }
}

async function testStats() {
    console.log('📊 Testing Stats...');
    try {
        const response = await axios.get(`${API_BASE_URL}/stats`, testConfig);
        console.log('✅ Stats:', {
            success: response.data.success,
            uptime: response.data.stats?.uptime,
            memory: response.data.stats?.memory?.heapUsed
        });
        return true;
    } catch (error) {
        console.error('❌ Stats Failed:', error.response?.data || error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Starting API Tests...\n');
    
    const results = {
        health: await testHealthCheck(),
        models: await testListModels(),
        chat: await testChatCompletion(),
        text: await testTextCompletion(),
        stats: await testStats()
    };
    
    console.log('\n📋 Test Results Summary:');
    console.log('========================');
    console.log(`Health Check: ${results.health ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`List Models: ${results.models.length > 0 ? '✅ PASS' : '❌ FAIL'} (${results.models.length} models found)`);
    console.log(`Chat Completion: ${results.chat ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Text Completion: ${results.text ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Stats: ${results.stats ? '✅ PASS' : '❌ FAIL'}`);
    
    const passedTests = Object.values(results).filter(r => r === true || (Array.isArray(r) && r.length > 0)).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Your API is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Please check your configuration and Ollama server.');
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    testHealthCheck,
    testListModels,
    testChatCompletion,
    testTextCompletion,
    testStats,
    runAllTests
};

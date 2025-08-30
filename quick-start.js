#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Ollama API Controller - Quick Start\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file...');
    
    const envContent = `# Ollama Server Configuration
OLLAMA_BASE_URL=https://erccjfczbqn5gr-11434.proxy.runpod.net
OLLAMA_TIMEOUT=30000
OLLAMA_MAX_RETRIES=3

# API Server Configuration
PORT=3000
NODE_ENV=development

# Security
API_KEY=your-secret-api-key-here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Model Configuration
DEFAULT_MODEL=llama2
DEFAULT_TEMPERATURE=0.7
DEFAULT_MAX_TOKENS=2048
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');
    console.log('⚠️  Please update the API_KEY in .env file before starting the server.\n');
} else {
    console.log('✅ .env file already exists.\n');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
    console.log('📦 Installing dependencies...');
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ Dependencies installed successfully!\n');
    } catch (error) {
        console.error('❌ Failed to install dependencies:', error.message);
        process.exit(1);
    }
} else {
    console.log('✅ Dependencies already installed.\n');
}

// Create logs directory
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('✅ Logs directory created.\n');
}

console.log('🎯 Setup complete! You can now:');
console.log('');
console.log('1. Update the API_KEY in .env file');
console.log('2. Start the server: npm run dev');
console.log('3. Test the API: node test/test-api.js');
console.log('4. View Swagger Documentation: http://localhost:3000/api-docs');
console.log('5. Health check: http://localhost:3000/api/ollama/health');
console.log('');
console.log('📚 For more information, see README.md');

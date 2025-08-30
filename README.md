# Ollama API Controller

A custom API controller for Ollama LLM server integration with comprehensive features for AI applications.

## 🚀 Features

- **Chat Completions**: Generate conversational AI responses
- **Text Completions**: Generate text completions from prompts
- **Model Management**: List, pull, and delete models
- **Health Monitoring**: Server health checks and statistics
- **Security**: API key authentication and rate limiting
- **Validation**: Request validation with detailed error messages
- **Logging**: Comprehensive logging with Winston
- **Error Handling**: Robust error handling and retry mechanisms
- **CORS Support**: Configurable CORS settings
- **Documentation**: Built-in API documentation

## 📋 Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn
- Ollama server running (your hosted server at `instance url`)

## 🛠️ Installation

1. **Clone or download the project**
   ```bash
   git clone <your-repo-url>
   cd ollama-api-controller
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Ollama Server Configuration
   OLLAMA_BASE_URL=you-instace-hosted-llm-url
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
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

5. **Access Swagger Documentation**
   Open your browser and go to: `http://localhost:3000/api-docs`

## 📚 API Documentation

### Swagger UI
Access the interactive API documentation at:
```
http://localhost:3000/api-docs
```

### Swagger JSON
Get the OpenAPI specification at:
```
http://localhost:3000/api-docs/swagger.json
```

### Base URL
```
http://localhost:3000/api/ollama
```

### Authentication
All endpoints (except health check) require an API key in the header:
```
x-api-key: your-secret-api-key-here
```

### Endpoints

#### 1. Health Check
```http
GET /api/ollama/health
```
**No authentication required**

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "message": "Ollama is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 2. Chat Completion
```http
POST /api/ollama/chat
```

**Request Body:**
```json
{
  "model": "llama2",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 2048,
  "stream": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": {
      "role": "assistant",
      "content": "Hello! I'm doing well, thank you for asking..."
    }
  },
  "model": "llama2",
  "usage": {
    "prompt_tokens": 8,
    "completion_tokens": 15,
    "total_tokens": 23
  },
  "processing_time_ms": 1250,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 3. Text Completion
```http
POST /api/ollama/generate
```

**Request Body:**
```json
{
  "model": "llama2",
  "prompt": "Write a short story about a robot",
  "temperature": 0.7,
  "max_tokens": 2048,
  "stream": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Once upon a time, there was a robot named...",
    "done": true
  },
  "model": "llama2",
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 150,
    "total_tokens": 162
  },
  "processing_time_ms": 3200,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 4. List Models
```http
GET /api/ollama/models
```

**Response:**
```json
{
  "success": true,
  "models": [
    {
      "name": "llama2",
      "size": 3790000000,
      "modified_at": "2024-01-01T00:00:00.000Z",
      "digest": "sha256:abc123..."
    }
  ],
  "count": 1,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 5. Get Model Info
```http
GET /api/ollama/models/:model
```

**Response:**
```json
{
  "success": true,
  "model": {
    "license": "MIT",
    "modelfile": "...",
    "parameters": "7B",
    "template": "...",
    "system": "..."
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 6. Pull Model
```http
POST /api/ollama/models/pull
```

**Request Body:**
```json
{
  "model": "llama2"
}
```

#### 7. Delete Model
```http
DELETE /api/ollama/models/delete
```

**Request Body:**
```json
{
  "model": "llama2"
}
```

#### 8. Get Statistics
```http
GET /api/ollama/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "uptime": 3600,
    "memory": {
      "rss": 50000000,
      "heapTotal": 30000000,
      "heapUsed": 20000000
    },
    "node_version": "v18.0.0",
    "platform": "linux",
    "ollama_url": "https://erccjfczbqn5gr-11434.proxy.runpod.net"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔧 Usage Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/ollama';
const API_KEY = 'your-secret-api-key-here';

// Chat completion
async function chatCompletion() {
  try {
    const response = await axios.post(`${API_BASE_URL}/chat`, {
      model: 'llama2',
      messages: [
        { role: 'user', content: 'What is artificial intelligence?' }
      ],
      temperature: 0.7,
      max_tokens: 2048
    }, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Text completion
async function textCompletion() {
  try {
    const response = await axios.post(`${API_BASE_URL}/generate`, {
      model: 'llama2',
      prompt: 'Write a poem about technology',
      temperature: 0.8,
      max_tokens: 500
    }, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
```

### Python
```python
import requests

API_BASE_URL = 'http://localhost:3000/api/ollama'
API_KEY = 'your-secret-api-key-here'

headers = {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json'
}

# Chat completion
def chat_completion():
    data = {
        'model': 'llama2',
        'messages': [
            {'role': 'user', 'content': 'What is artificial intelligence?'}
        ],
        'temperature': 0.7,
        'max_tokens': 2048
    }
    
    response = requests.post(f'{API_BASE_URL}/chat', json=data, headers=headers)
    return response.json()

# Text completion
def text_completion():
    data = {
        'model': 'llama2',
        'prompt': 'Write a poem about technology',
        'temperature': 0.8,
        'max_tokens': 500
    }
    
    response = requests.post(f'{API_BASE_URL}/generate', json=data, headers=headers)
    return response.json()
```

### cURL
```bash
# Health check
curl http://localhost:3000/api/ollama/health

# Chat completion
curl -X POST http://localhost:3000/api/ollama/chat \
  -H "x-api-key: your-secret-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama2",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ],
    "temperature": 0.7,
    "max_tokens": 2048
  }'

# List models
curl -X GET http://localhost:3000/api/ollama/models \
  -H "x-api-key: your-secret-api-key-here"
```

## 🔒 Security Features

- **API Key Authentication**: All endpoints require a valid API key
- **Rate Limiting**: Configurable rate limiting per IP address
- **CORS Protection**: Configurable CORS settings
- **Security Headers**: Helmet.js for security headers
- **Input Validation**: Joi validation for all requests
- **Error Handling**: Secure error responses without sensitive information

## 📊 Monitoring & Logging

- **Request Logging**: All requests and responses are logged
- **Error Logging**: Detailed error logging with stack traces
- **Performance Metrics**: Processing time tracking
- **Health Monitoring**: Server health checks
- **Statistics**: System statistics and usage metrics

## 🚀 Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
OLLAMA_BASE_URL=https://erccjfczbqn5gr-11434.proxy.runpod.net
API_KEY=your-production-api-key
RATE_LIMIT_MAX_REQUESTS=1000
LOG_LEVEL=warn
```

### PM2 Deployment
```bash
npm install -g pm2
pm2 start src/index.js --name "ollama-api"
pm2 save
pm2 startup
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OLLAMA_BASE_URL` | Ollama server URL | `https://erccjfczbqn5gr-11434.proxy.runpod.net` |
| `OLLAMA_TIMEOUT` | Request timeout (ms) | `30000` |
| `OLLAMA_MAX_RETRIES` | Max retry attempts | `3` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `API_KEY` | API key for authentication | Required |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `LOG_LEVEL` | Logging level | `info` |
| `LOG_FILE` | Log file path | `logs/app.log` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000` |
| `DEFAULT_MODEL` | Default model name | `llama2` |
| `DEFAULT_TEMPERATURE` | Default temperature | `0.7` |
| `DEFAULT_MAX_TOKENS` | Default max tokens | `2048` |

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run linting
npm run lint
```

## 📝 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "details": [
    {
      "field": "field_name",
      "message": "Validation error message",
      "value": "invalid_value"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔄 Fine-tuning Integration

This API controller is designed to work seamlessly with fine-tuned models. When you fine-tune your models:

1. **Pull the fine-tuned model** using the `/api/ollama/models/pull` endpoint
2. **Use the fine-tuned model** by specifying the model name in your requests
3. **Monitor performance** using the statistics and logging features

Example with fine-tuned model:
```json
{
  "model": "my-fine-tuned-model",
  "messages": [
    {"role": "user", "content": "Your prompt here"}
  ],
  "temperature": 0.3,
  "max_tokens": 1024
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Check the Swagger documentation at `/api-docs`
- Review the logs in the `logs/` directory
- Test the health endpoint at `/api/ollama/health`

## 🔗 Links

- [Ollama Documentation](https://ollama.ai/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Joi Validation](https://joi.dev/)
- [Winston Logging](https://github.com/winstonjs/winston)

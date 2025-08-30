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
| `OLLAMA_BASE_URL` | Ollama server URL | `hosted url for llm` |
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

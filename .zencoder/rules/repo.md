---
description: Repository Information Overview
alwaysApply: true
---

# Ollama API Controller Information

## Summary
A custom API controller for Ollama LLM server integration that provides a RESTful API for interacting with Ollama's language models. The project offers chat completions, text generation, model management, document processing, and comprehensive security features.

## Structure
- **src/**: Core application code
  - **config/**: Configuration files including Swagger setup
  - **controllers/**: Request handlers for Ollama and Document operations
  - **middleware/**: Authentication, rate limiting, and security middleware
  - **routes/**: API route definitions
  - **services/**: Core business logic for Ollama and Document processing
  - **validators/**: Request validation schemas
- **test/**: Test files for API functionality

## Language & Runtime
**Language**: JavaScript (Node.js)
**Version**: Node.js >=18.0.0 (specified in package.json)
**Package Manager**: npm
**Framework**: Express.js 5.1.0

## Dependencies
**Main Dependencies**:
- express: ^5.1.0 (Web framework)
- axios: ^1.6.0 (HTTP client)
- joi: ^18.0.1 (Validation)
- swagger-ui-express: ^5.0.0 (API documentation)
- multer: ^1.4.5-lts.1 (File uploads)
- pdf-parse: ^1.1.1 (PDF processing)
- mammoth: ^1.6.0 (DOCX processing)
- xlsx: ^0.18.5 (Excel processing)

**Development Dependencies**:
- nodemon: ^3.0.1 (Development server)
- jest: ^30.1.1 (Testing framework)
- eslint: ^9.34.0 (Linting)
- jsdoc: ^4.0.2 (Documentation)

## Build & Installation
```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Production mode
npm start

# Run tests
npm test

# Generate documentation
npm run docs
```

## Docker
**Dockerfile**: Dockerfile
**Base Image**: node:18-alpine
**Exposed Port**: 3000
**Build Command**:
```bash
docker build -t ollama-api-controller .
docker run -p 3000:3000 --env-file .env ollama-api-controller
```

## Configuration
**Environment Variables**:
- OLLAMA_BASE_URL: Ollama server URL
- PORT: Server port (default: 3000)
- API_KEY: Authentication key
- RATE_LIMIT_WINDOW_MS: Rate limiting window
- LOG_LEVEL: Logging level
- ALLOWED_ORIGINS: CORS allowed origins

## API Endpoints
**Main Endpoints**:
- /api/ollama/chat: Chat completions
- /api/ollama/generate: Text generation
- /api/ollama/models: Model management
- /api/ollama/health: Health check
- /api/documents/*: Document processing

## Testing
**Framework**: Jest
**Test Files**: test/test-api.js
**Run Command**:
```bash
npm test
```

## Documentation
**API Docs**: Swagger UI at /api-docs
**Code Docs**: Generated with JSDoc
**Generate Command**:
```bash
npm run docs
```
import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ollama API Controller',
      version: '1.0.0',
      description: 'Custom API controller for Ollama LLM server integration with document processing and voice capabilities',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for authentication'
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpecs = swaggerJsdoc(options);

export default swaggerSpecs;

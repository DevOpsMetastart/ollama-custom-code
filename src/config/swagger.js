const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ollama API Controller',
      version: '1.0.0',
      description: 'Custom API controller for Ollama LLM server integration with comprehensive features for AI applications.',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: '/',
        description: 'Current server (works in all environments)'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for authentication'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Error type'
            },
            message: {
              type: 'string',
              example: 'Human-readable error message'
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'field_name'
                  },
                  message: {
                    type: 'string',
                    example: 'Validation error message'
                  },
                  value: {
                    type: 'string',
                    example: 'invalid_value'
                  }
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        Message: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              enum: ['system', 'user', 'assistant'],
              example: 'user'
            },
            content: {
              type: 'string',
              example: 'Hello, how are you?'
            },
            name: {
              type: 'string',
              example: 'user_name'
            }
          },
          required: ['role', 'content']
        },
        ChatCompletionRequest: {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              default: 'llama2',
              example: 'llama2'
            },
            messages: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Message'
              },
              minItems: 1
            },
            temperature: {
              type: 'number',
              minimum: 0,
              maximum: 2,
              default: 0.7,
              example: 0.7
            },
            max_tokens: {
              type: 'integer',
              minimum: 1,
              maximum: 8192,
              default: 2048,
              example: 2048
            },
            stream: {
              type: 'boolean',
              default: false,
              example: false
            },
            top_p: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              example: 0.9
            },
            top_k: {
              type: 'integer',
              minimum: 1,
              example: 40
            },
            repeat_penalty: {
              type: 'number',
              minimum: 0,
              example: 1.1
            },
            stop: {
              oneOf: [
                {
                  type: 'string',
                  example: 'END'
                },
                {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  example: ['END', 'STOP']
                }
              ]
            }
          },
          required: ['messages']
        },
        TextCompletionRequest: {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              default: 'llama2',
              example: 'llama2'
            },
            prompt: {
              type: 'string',
              example: 'Write a short story about a robot'
            },
            temperature: {
              type: 'number',
              minimum: 0,
              maximum: 2,
              default: 0.7,
              example: 0.7
            },
            max_tokens: {
              type: 'integer',
              minimum: 1,
              maximum: 8192,
              default: 2048,
              example: 2048
            },
            stream: {
              type: 'boolean',
              default: false,
              example: false
            },
            top_p: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              example: 0.9
            },
            top_k: {
              type: 'integer',
              minimum: 1,
              example: 40
            },
            repeat_penalty: {
              type: 'number',
              minimum: 0,
              example: 1.1
            },
            stop: {
              oneOf: [
                {
                  type: 'string',
                  example: 'END'
                },
                {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  example: ['END', 'STOP']
                }
              ]
            }
          },
          required: ['prompt']
        },
        ChatCompletionResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                message: {
                  $ref: '#/components/schemas/Message'
                }
              }
            },
            model: {
              type: 'string',
              example: 'llama2'
            },
            usage: {
              type: 'object',
              properties: {
                prompt_tokens: {
                  type: 'integer',
                  example: 8
                },
                completion_tokens: {
                  type: 'integer',
                  example: 15
                },
                total_tokens: {
                  type: 'integer',
                  example: 23
                }
              }
            },
            processing_time_ms: {
              type: 'integer',
              example: 1250
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        TextCompletionResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                response: {
                  type: 'string',
                  example: 'Once upon a time, there was a robot named...'
                },
                done: {
                  type: 'boolean',
                  example: true
                }
              }
            },
            model: {
              type: 'string',
              example: 'llama2'
            },
            usage: {
              type: 'object',
              properties: {
                prompt_tokens: {
                  type: 'integer',
                  example: 12
                },
                completion_tokens: {
                  type: 'integer',
                  example: 150
                },
                total_tokens: {
                  type: 'integer',
                  example: 162
                }
              }
            },
            processing_time_ms: {
              type: 'integer',
              example: 3200
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        Model: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'llama2'
            },
            size: {
              type: 'integer',
              example: 3790000000
            },
            modified_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z'
            },
            digest: {
              type: 'string',
              example: 'sha256:abc123...'
            }
          }
        },
        ModelsResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            models: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Model'
              }
            },
            count: {
              type: 'integer',
              example: 1
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        ModelInfo: {
          type: 'object',
          properties: {
            license: {
              type: 'string',
              example: 'MIT'
            },
            modelfile: {
              type: 'string',
              example: 'FROM llama2:7b...'
            },
            parameters: {
              type: 'string',
              example: '7B'
            },
            template: {
              type: 'string',
              example: '{{ .Prompt }}'
            },
            system: {
              type: 'string',
              example: 'You are a helpful assistant.'
            }
          }
        },
        ModelInfoResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            model: {
              $ref: '#/components/schemas/ModelInfo'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        ModelOperationRequest: {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              example: 'llama2'
            }
          },
          required: ['model']
        },
        ModelOperationResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Model llama2 pulled successfully'
            },
            data: {
              type: 'object',
              example: {}
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            status: {
              type: 'string',
              enum: ['healthy', 'unhealthy'],
              example: 'healthy'
            },
            message: {
              type: 'string',
              example: 'Ollama is running'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        Stats: {
          type: 'object',
          properties: {
            uptime: {
              type: 'number',
              example: 3600
            },
            memory: {
              type: 'object',
              properties: {
                rss: {
                  type: 'integer',
                  example: 50000000
                },
                heapTotal: {
                  type: 'integer',
                  example: 30000000
                },
                heapUsed: {
                  type: 'integer',
                  example: 20000000
                }
              }
            },
            node_version: {
              type: 'string',
              example: 'v18.0.0'
            },
            platform: {
              type: 'string',
              example: 'linux'
            },
            ollama_url: {
              type: 'string',
              example: 'https://your-ollama-server.com'
            }
          }
        },
        StatsResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            stats: {
              $ref: '#/components/schemas/Stats'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        DocumentUploadResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                fileInfo: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      format: 'uuid',
                      example: '123e4567-e89b-12d3-a456-426614174000'
                    },
                    originalName: {
                      type: 'string',
                      example: 'document.pdf'
                    },
                    fileName: {
                      type: 'string',
                      example: '123e4567-e89b-12d3-a456-426614174000.pdf'
                    },
                    size: {
                      type: 'integer',
                      example: 1024000
                    },
                    mimeType: {
                      type: 'string',
                      example: 'application/pdf'
                    },
                    extension: {
                      type: 'string',
                      example: '.pdf'
                    },
                    uploadedAt: {
                      type: 'string',
                      format: 'date-time',
                      example: '2024-01-01T00:00:00.000Z'
                    }
                  }
                },
                textInfo: {
                  type: 'object',
                  properties: {
                    text: {
                      type: 'string',
                      example: 'This is the extracted text content from the document...'
                    },
                    wordCount: {
                      type: 'integer',
                      example: 150
                    },
                    characterCount: {
                      type: 'integer',
                      example: 850
                    }
                  }
                }
              }
            },
            processing_time_ms: {
              type: 'integer',
              example: 2500
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        DocumentSummaryRequest: {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              default: 'llama2',
              example: 'llama2'
            },
            maxLength: {
              type: 'integer',
              minimum: 50,
              maximum: 2000,
              default: 500,
              example: 500
            },
            temperature: {
              type: 'number',
              minimum: 0,
              maximum: 2,
              default: 0.3,
              example: 0.3
            },
            customPrompt: {
              type: 'string',
              maxLength: 1000,
              example: 'Please provide a detailed summary focusing on key findings and recommendations.'
            }
          }
        },
        DocumentSummaryResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                fileId: {
                  type: 'string',
                  format: 'uuid',
                  example: '123e4567-e89b-12d3-a456-426614174000'
                },
                summary: {
                  type: 'string',
                  example: 'This document discusses the implementation of AI technologies in modern business environments. Key findings include improved efficiency, cost reduction, and enhanced customer experience...'
                },
                model: {
                  type: 'string',
                  example: 'llama2'
                },
                originalLength: {
                  type: 'integer',
                  example: 5000
                },
                summaryLength: {
                  type: 'integer',
                  example: 450
                },
                usage: {
                  type: 'object',
                  properties: {
                    prompt_tokens: {
                      type: 'integer',
                      example: 1200
                    },
                    completion_tokens: {
                      type: 'integer',
                      example: 450
                    },
                    total_tokens: {
                      type: 'integer',
                      example: 1650
                    }
                  }
                }
              }
            },
            processing_time_ms: {
              type: 'integer',
              example: 3500
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        DocumentQuestionRequest: {
          type: 'object',
          properties: {
            question: {
              type: 'string',
              minLength: 1,
              maxLength: 1000,
              example: 'What are the main conclusions of this research?'
            },
            model: {
              type: 'string',
              default: 'llama2',
              example: 'llama2'
            },
            temperature: {
              type: 'number',
              minimum: 0,
              maximum: 2,
              default: 0.3,
              example: 0.3
            },
            max_tokens: {
              type: 'integer',
              minimum: 50,
              maximum: 2000,
              default: 1000,
              example: 1000
            }
          },
          required: ['question']
        },
        DocumentQuestionResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                fileId: {
                  type: 'string',
                  format: 'uuid',
                  example: '123e4567-e89b-12d3-a456-426614174000'
                },
                question: {
                  type: 'string',
                  example: 'What are the main conclusions of this research?'
                },
                answer: {
                  type: 'string',
                  example: 'Based on the document, the main conclusions are: 1) AI implementation leads to 30% efficiency improvement, 2) Cost reduction of 25% in operational expenses, 3) Enhanced customer satisfaction scores...'
                },
                model: {
                  type: 'string',
                  example: 'llama2'
                },
                usage: {
                  type: 'object',
                  properties: {
                    prompt_tokens: {
                      type: 'integer',
                      example: 800
                    },
                    completion_tokens: {
                      type: 'integer',
                      example: 200
                    },
                    total_tokens: {
                      type: 'integer',
                      example: 1000
                    }
                  }
                }
              }
            },
            processing_time_ms: {
              type: 'integer',
              example: 2800
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        DocumentInfo: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            fileName: {
              type: 'string',
              example: '123e4567-e89b-12d3-a456-426614174000.pdf'
            },
            size: {
              type: 'integer',
              example: 1024000
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z'
            },
            modifiedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        DocumentInfoResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              $ref: '#/components/schemas/DocumentInfo'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        DocumentListResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                documents: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/DocumentInfo'
                  }
                },
                count: {
                  type: 'integer',
                  example: 3
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        DocumentDeleteResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'File deleted successfully'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        }
      }
    },
    security: [
      {
        ApiKeyAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;

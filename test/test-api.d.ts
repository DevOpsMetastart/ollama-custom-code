/**
 * API Test Suite - TypeScript
 * Basic tests for the Ollama API Controller
 */
/**
 * Test health endpoint
 */
declare function testHealth(): Promise<void>;
/**
 * Test models endpoint
 */
declare function testModels(): Promise<void>;
/**
 * Test chat completion
 */
declare function testChatCompletion(): Promise<void>;
/**
 * Test text completion
 */
declare function testTextCompletion(): Promise<void>;
/**
 * Run all tests
 */
declare function runTests(): Promise<void>;
export { testHealth, testModels, testChatCompletion, testTextCompletion, runTests };
//# sourceMappingURL=test-api.d.ts.map
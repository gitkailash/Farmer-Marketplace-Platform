import * as fc from 'fast-check';

// **Feature: farmer-marketplace-platform, Property 34: Environment Configuration Validation**

describe('Environment Configuration Property Tests', () => {
  // Save original environment
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment for each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('Property 34: Environment Configuration Validation - For any valid environment configuration, the system should successfully validate and parse all required fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          PORT: fc.integer({ min: 1, max: 65535 }).map(String),
          NODE_ENV: fc.constantFrom('development', 'production', 'test'),
          MONGODB_URI: fc.constant('mongodb://localhost:27017/test-db'),
          JWT_SECRET: fc.string({ minLength: 32, maxLength: 64 }),
          JWT_EXPIRES_IN: fc.constantFrom('1d', '7d', '30d'),
          BCRYPT_ROUNDS: fc.integer({ min: 10, max: 15 }).map(String),
          CORS_ORIGIN: fc.constant('http://localhost:3000'),
          RATE_LIMIT_WINDOW_MS: fc.integer({ min: 1000, max: 3600000 }).map(String),
          RATE_LIMIT_MAX_REQUESTS: fc.integer({ min: 1, max: 1000 }).map(String),
        }),
        (envConfig) => {
          // Set environment variables
          Object.assign(process.env, envConfig);

          // Import and validate configuration
          const { config } = require('../environment');

          // Verify all required fields are present and correctly typed
          expect(typeof config.PORT).toBe('number');
          expect(config.PORT).toBeGreaterThanOrEqual(1);
          expect(config.PORT).toBeLessThanOrEqual(65535);

          expect(typeof config.NODE_ENV).toBe('string');
          expect(['development', 'production', 'test']).toContain(config.NODE_ENV);

          expect(typeof config.MONGODB_URI).toBe('string');
          expect(config.MONGODB_URI).toMatch(/^mongodb:\/\//);

          expect(typeof config.JWT_SECRET).toBe('string');
          expect(config.JWT_SECRET.length).toBeGreaterThanOrEqual(32);

          expect(typeof config.JWT_EXPIRES_IN).toBe('string');

          expect(typeof config.BCRYPT_ROUNDS).toBe('number');
          expect(config.BCRYPT_ROUNDS).toBeGreaterThanOrEqual(10);
          expect(config.BCRYPT_ROUNDS).toBeLessThanOrEqual(15);

          expect(typeof config.CORS_ORIGIN).toBe('string');
          expect(config.CORS_ORIGIN).toMatch(/^https?:\/\//);

          expect(typeof config.RATE_LIMIT_WINDOW_MS).toBe('number');
          expect(config.RATE_LIMIT_WINDOW_MS).toBeGreaterThan(0);

          expect(typeof config.RATE_LIMIT_MAX_REQUESTS).toBe('number');
          expect(config.RATE_LIMIT_MAX_REQUESTS).toBeGreaterThan(0);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('Property 34b: Invalid Environment Rejection - For any invalid environment configuration, the system should reject it with appropriate error messages', () => {
    fc.assert(
      fc.property(
        fc.record({
          PORT: fc.oneof(
            fc.constant('0'), // Invalid: port 0
            fc.constant('70000'), // Invalid: port too high
            fc.constant('invalid'), // Invalid: not a number
          ),
          NODE_ENV: fc.constant('invalid-env'), // Invalid environment
          MONGODB_URI: fc.constant('invalid-uri'), // Invalid URI
          JWT_SECRET: fc.string({ maxLength: 31 }), // Invalid: too short
          BCRYPT_ROUNDS: fc.oneof(
            fc.constant('5'), // Invalid: too low
            fc.constant('20'), // Invalid: too high
          ),
          CORS_ORIGIN: fc.constant('invalid-url'), // Invalid URL
        }),
        (invalidEnvConfig) => {
          // Set invalid environment variables
          Object.assign(process.env, invalidEnvConfig);

          // Expect validation to throw an error
          expect(() => {
            // Clear module cache to force re-evaluation
            delete require.cache[require.resolve('../environment')];
            require('../environment');
          }).toThrow();
        }
      ),
      { numRuns: 5 }
    );
  });
});
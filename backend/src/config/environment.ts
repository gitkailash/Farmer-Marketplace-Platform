import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  MONGODB_URI: z.string().url('Invalid MongoDB URI'),
  MONGODB_TEST_URI: z.string().url('Invalid MongoDB test URI').optional(),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).pipe(z.number().min(10).max(15)).default('12'),
  
  // CORS
  CORS_ORIGIN: z.string().url('Invalid CORS origin URL').default('http://localhost:3000'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).default('100'),
  
  // Health Check
  HEALTH_CHECK_ENABLED: z.string().transform(val => val === 'true').default('true'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['combined', 'common', 'dev', 'short', 'tiny']).default('combined'),
  
  // Cache
  CACHE_TTL: z.string().transform(Number).pipe(z.number().positive()).default('300'),
  ENABLE_RESPONSE_CACHE: z.string().transform(val => val === 'true').default('false'),
  
  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).pipe(z.number().positive()).default('5242880'),
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/webp'),
  
  // Database Connection Pool
  DB_MAX_POOL_SIZE: z.string().transform(Number).pipe(z.number().positive()).default('10'),
  DB_SERVER_SELECTION_TIMEOUT: z.string().transform(Number).pipe(z.number().positive()).default('5000'),
  DB_SOCKET_TIMEOUT: z.string().transform(Number).pipe(z.number().positive()).default('45000'),
});

// Validate environment variables
const validateEnvironment = () => {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('\n');
      
      throw new Error(`Environment validation failed:\n${errorMessages}`);
    }
    throw error;
  }
};

// Export validated environment configuration
export const config = validateEnvironment();

// Type for environment configuration
export type Config = typeof config;
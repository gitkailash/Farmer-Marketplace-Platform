import { config } from '../environment';

describe('Environment Configuration', () => {
  it('should load and validate environment variables', () => {
    expect(config).toBeDefined();
    expect(config.NODE_ENV).toBeDefined();
    expect(config.PORT).toBeGreaterThan(0);
    expect(config.MONGODB_URI).toBeDefined();
    expect(config.JWT_SECRET).toBeDefined();
  });

  it('should have required configuration properties', () => {
    expect(typeof config.PORT).toBe('number');
    expect(typeof config.NODE_ENV).toBe('string');
    expect(typeof config.MONGODB_URI).toBe('string');
    expect(typeof config.JWT_SECRET).toBe('string');
    expect(typeof config.BCRYPT_ROUNDS).toBe('number');
  });

  it('should have valid port range', () => {
    expect(config.PORT).toBeGreaterThanOrEqual(1);
    expect(config.PORT).toBeLessThanOrEqual(65535);
  });

  it('should have secure bcrypt rounds', () => {
    expect(config.BCRYPT_ROUNDS).toBeGreaterThanOrEqual(10);
    expect(config.BCRYPT_ROUNDS).toBeLessThanOrEqual(15);
  });
});
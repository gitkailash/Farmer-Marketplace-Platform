import { Request, Response, NextFunction } from 'express';
import { config } from '../config/environment';

// Simple in-memory cache implementation
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly defaultTTL: number;

  constructor(defaultTTL: number = 300) { // 5 minutes default
    this.defaultTTL = defaultTTL;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 300000);
  }

  set(key: string, data: any, ttl?: number): void {
    const expirationTime = ttl || this.defaultTTL;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: expirationTime * 1000 // Convert to milliseconds
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create cache instance
const cache = new MemoryCache(config.CACHE_TTL);

// Cache key generator
const generateCacheKey = (req: Request): string => {
  const { method, originalUrl, query, user } = req;
  const userId = user?.userId || 'anonymous';
  const queryString = JSON.stringify(query);
  return `${method}:${originalUrl}:${queryString}:${userId}`;
};

// Cache middleware factory
export const cacheMiddleware = (ttl?: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip caching if disabled or for non-GET requests
    if (!config.ENABLE_RESPONSE_CACHE || req.method !== 'GET') {
      return next();
    }

    const cacheKey = generateCacheKey(req);
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      // Add cache headers
      res.set({
        'X-Cache': 'HIT',
        'X-Cache-Key': cacheKey,
        'Cache-Control': `public, max-age=${ttl || config.CACHE_TTL}`
      });
      
      res.json(cachedData);
      return;
    }

    // Store original json method
    const originalJson = res.json;

    // Override json method to cache response
    res.json = function(data: any) {
      // Cache successful responses only
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, data, ttl);
      }

      // Add cache headers
      res.set({
        'X-Cache': 'MISS',
        'X-Cache-Key': cacheKey,
        'Cache-Control': `public, max-age=${ttl || config.CACHE_TTL}`
      });

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

// Cache invalidation middleware
export const invalidateCache = (patterns: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Store original json method
    const originalJson = res.json;

    res.json = function(data: any) {
      // Invalidate cache on successful mutations
      if (res.statusCode >= 200 && res.statusCode < 300 && 
          ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        
        if (patterns.length > 0) {
          // Invalidate specific patterns
          const stats = cache.getStats();
          patterns.forEach(pattern => {
            stats.keys.forEach(key => {
              if (key.includes(pattern)) {
                cache.delete(key);
              }
            });
          });
        } else {
          // Clear all cache for safety
          cache.clear();
        }
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

// Cache statistics endpoint
export const getCacheStats = (req: Request, res: Response): void => {
  const stats = cache.getStats();
  res.json({
    success: true,
    data: {
      ...stats,
      enabled: config.ENABLE_RESPONSE_CACHE,
      defaultTTL: config.CACHE_TTL
    }
  });
};

// Manual cache control
export const cacheControl = {
  get: (key: string) => cache.get(key),
  set: (key: string, data: any, ttl?: number) => cache.set(key, data, ttl),
  delete: (key: string) => cache.delete(key),
  clear: () => cache.clear(),
  stats: () => cache.getStats()
};

export default cache;
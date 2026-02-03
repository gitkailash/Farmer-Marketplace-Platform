// Performance optimization utilities

// Debounce function for search inputs and API calls
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle function for scroll events and frequent updates
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Memoization for expensive calculations
export const memoize = <T extends (...args: any[]) => any>(
  func: T,
  getKey?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// Image optimization utilities
export const optimizeImageUrl = (url: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
} = {}): string => {
  const { width = 800, quality = 80, format = 'auto' } = options;
  
  // Handle Cloudinary URLs
  if (url.includes('cloudinary.com')) {
    const transformations = [
      `w_${width}`,
      `q_${quality}`,
      `f_${format}`
    ].join(',');
    
    return url.replace('/upload/', `/upload/${transformations}/`);
  }
  
  // Handle other CDN services (placeholder for future implementation)
  // if (url.includes('imagekit.io')) {
  //   return `${url}?tr=w-${width},q-${quality},f-${format}`;
  // }
  
  return url;
};

import React from 'react';

// Lazy loading utility for components
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) => {
  return React.lazy(importFunc);
};

// Bundle size analyzer (development only)
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    // This would integrate with webpack-bundle-analyzer in a real setup
    console.log('Bundle analysis would run here in development');
  }
};

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTiming(label: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-start`);
    }
  }

  endTiming(label: string): number {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      
      const measure = performance.getEntriesByName(label)[0];
      const duration = measure.duration;
      
      // Store metric
      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }
      this.metrics.get(label)!.push(duration);
      
      // Clean up
      performance.clearMarks(`${label}-start`);
      performance.clearMarks(`${label}-end`);
      performance.clearMeasures(label);
      
      return duration;
    }
    return 0;
  }

  getMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const [label, times] of this.metrics.entries()) {
      const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      
      result[label] = { avg, min, max, count: times.length };
    }
    
    return result;
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

// React performance hooks
export const usePerformanceMonitor = (label: string) => {
  const monitor = PerformanceMonitor.getInstance();
  
  React.useEffect(() => {
    monitor.startTiming(label);
    
    return () => {
      monitor.endTiming(label);
    };
  }, [label, monitor]);
};

// Virtual scrolling utility for large lists
export const useVirtualScrolling = (
  items: any[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  };
};

// Memory usage monitoring (development only)
export const monitorMemoryUsage = () => {
  if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
    const memInfo = (performance as any).memory;
    console.log('Memory Usage:', {
      used: `${Math.round(memInfo.usedJSHeapSize / 1024 / 1024)} MB`,
      total: `${Math.round(memInfo.totalJSHeapSize / 1024 / 1024)} MB`,
      limit: `${Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024)} MB`
    });
  }
};

export default {
  debounce,
  throttle,
  memoize,
  optimizeImageUrl,
  PerformanceMonitor,
  usePerformanceMonitor,
  useVirtualScrolling,
  monitorMemoryUsage
};
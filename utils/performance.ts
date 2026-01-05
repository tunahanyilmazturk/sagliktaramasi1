import React from 'react';

// Performance monitoring utilities

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance() {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure render time
  measureRender(componentName: string) {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (!this.metrics.has(componentName)) {
        this.metrics.set(componentName, []);
      }
      
      this.metrics.get(componentName)!.push(renderTime);
      
      // Keep only last 10 measurements
      const measurements = this.metrics.get(componentName)!;
      if (measurements.length > 10) {
        measurements.shift();
      }
      
      // Log warning if render is slow
      if (renderTime > 16.67) { // 60fps threshold
        console.warn(`⚠️ Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
      }
      
      return renderTime;
    };
  }

  // Get average render time
  getAverageRenderTime(componentName: string) {
    const measurements = this.metrics.get(componentName);
    if (!measurements || measurements.length === 0) return 0;
    
    const sum = measurements.reduce((a, b) => a + b, 0);
    return sum / measurements.length;
  }

  // Get performance report
  getReport() {
    const report: Record<string, { avg: number; min: number; max: number; samples: number }> = {};
    
    this.metrics.forEach((measurements, component) => {
      const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const min = Math.min(...measurements);
      const max = Math.max(...measurements);
      
      report[component] = { avg, min, max, samples: measurements.length };
    });
    
    return report;
  }

  // Log performance report
  logReport() {
    console.group('🚀 Performance Report');
    const report = this.getReport();
    
    Object.entries(report).forEach(([component, metrics]) => {
      const status = metrics.avg < 16.67 ? '✅' : metrics.avg < 33 ? '⚠️' : '❌';
      console.log(`${status} ${component}: avg ${metrics.avg.toFixed(2)}ms (min: ${metrics.min.toFixed(2)}ms, max: ${metrics.max.toFixed(2)}ms)`);
    });
    
    console.groupEnd();
  }
}

// React hook for performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const monitor = PerformanceMonitor.getInstance();
  
  return React.useCallback(() => {
    return monitor.measureRender(componentName);
  }, [componentName, monitor]);
};

// FPS counter
export class FPSCounter {
  private frames = 0;
  private lastTime = performance.now();
  private fps = 0;
  private callback: (fps: number) => void;

  constructor(callback: (fps: number) => void) {
    this.callback = callback;
    this.tick();
  }

  private tick = () => {
    this.frames++;
    const currentTime = performance.now();
    
    if (currentTime >= this.lastTime + 1000) {
      this.fps = Math.round((this.frames * 1000) / (currentTime - this.lastTime));
      this.frames = 0;
      this.lastTime = currentTime;
      this.callback(this.fps);
    }
    
    requestAnimationFrame(this.tick);
  };
}

// Memory usage tracker
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
    };
  }
  return null;
};

// Debounced resize observer
export const createResizeObserver = (callback: (entries: ResizeObserverEntry[]) => void, debounceMs = 100) => {
  let timeoutId: NodeJS.Timeout;
  
  return new ResizeObserver((entries) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(entries), debounceMs);
  });
};

// Intersection observer with root margin optimization
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) => {
  const defaultOptions = {
    rootMargin: '50px', // Start loading 50px before element comes into view
    threshold: 0.01,
    ...options
  };
  
  return new IntersectionObserver(callback, defaultOptions);
};

// Bundle size analyzer
export const analyzeBundleSize = () => {
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  const jsResources = resources.filter(r => r.name.endsWith('.js'));
  const cssResources = resources.filter(r => r.name.endsWith('.css'));
  const imageResources = resources.filter(r => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(r.name));
  
  const totalJS = jsResources.reduce((sum, r) => sum + r.transferSize, 0);
  const totalCSS = cssResources.reduce((sum, r) => sum + r.transferSize, 0);
  const totalImages = imageResources.reduce((sum, r) => sum + r.transferSize, 0);
  
  return {
    js: (totalJS / 1024 / 1024).toFixed(2) + ' MB',
    css: (totalCSS / 1024 / 1024).toFixed(2) + ' MB',
    images: (totalImages / 1024 / 1024).toFixed(2) + ' MB',
    total: ((totalJS + totalCSS + totalImages) / 1024 / 1024).toFixed(2) + ' MB'
  };
};

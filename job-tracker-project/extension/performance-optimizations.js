// Performance Optimizations for Job Tracker Extension
// Apply these optimizations to improve extension performance and memory usage

class PerformanceOptimizer {
  constructor() {
    this.debounceTimers = new Map();
    this.throttleTimers = new Map();
    this.cachedElements = new Map();
    this.observerInstances = new Set();
    
    this.init();
  }

  init() {
    // Memory management
    this.setupMemoryManagement();
    
    // Optimize DOM operations
    this.setupDOMOptimizations();
    
    // Background script optimizations
    this.setupBackgroundOptimizations();
  }

  // Debounce utility to prevent excessive function calls
  debounce(func, delay, key) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }
    
    const timerId = setTimeout(() => {
      func();
      this.debounceTimers.delete(key);
    }, delay);
    
    this.debounceTimers.set(key, timerId);
  }

  // Throttle utility for limiting function execution frequency
  throttle(func, delay, key) {
    if (this.throttleTimers.has(key)) {
      return;
    }
    
    func();
    
    const timerId = setTimeout(() => {
      this.throttleTimers.delete(key);
    }, delay);
    
    this.throttleTimers.set(key, timerId);
  }

  // Optimized element selector with caching
  getCachedElement(selector, ttl = 5000) {
    const cacheKey = selector;
    const cached = this.cachedElements.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.element;
    }
    
    const element = document.querySelector(selector);
    if (element) {
      this.cachedElements.set(cacheKey, {
        element: element,
        timestamp: Date.now()
      });
    }
    
    return element;
  }

  // Clear stale cached elements
  clearStaleCache() {
    const now = Date.now();
    for (const [key, cached] of this.cachedElements.entries()) {
      if (now - cached.timestamp > 10000) { // 10 seconds
        this.cachedElements.delete(key);
      }
    }
  }

  // Memory management for event listeners and observers
  setupMemoryManagement() {
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Periodic cleanup
    setInterval(() => {
      this.clearStaleCache();
      this.cleanupOrphanedObservers();
    }, 30000); // Every 30 seconds
  }

  // DOM optimization techniques
  setupDOMOptimizations() {
    // Use document fragments for multiple DOM insertions
    this.createDocumentFragment = () => document.createDocumentFragment();
    
    // Batch DOM operations
    this.batchDOMOperations = (operations) => {
      const fragment = document.createDocumentFragment();
      operations.forEach(op => {
        if (typeof op === 'function') {
          op(fragment);
        }
      });
      return fragment;
    };

    // Efficient event delegation
    this.setupEventDelegation();
  }

  setupEventDelegation() {
    // Single event listener for all tracked buttons
    document.addEventListener('click', (event) => {
      if (event.target.matches('.job-tracker-btn, .job-tracker-btn *')) {
        event.preventDefault();
        event.stopPropagation();
        
        const button = event.target.closest('.job-tracker-btn');
        if (button && !button.disabled) {
          this.handleTrackButtonClick(button);
        }
      }
    }, { passive: false });
  }

  // Background script optimizations
  setupBackgroundOptimizations() {
    // Lazy load heavy operations
    this.lazyLoadModules = new Map();
    
    // Request batching
    this.requestQueue = [];
    this.requestBatchTimer = null;
  }

  // Lazy loading utility
  async lazyLoad(moduleName, loader) {
    if (this.lazyLoadModules.has(moduleName)) {
      return this.lazyLoadModules.get(moduleName);
    }
    
    const module = await loader();
    this.lazyLoadModules.set(moduleName, module);
    return module;
  }

  // Batch API requests to reduce network overhead
  batchAPIRequests(request) {
    this.requestQueue.push(request);
    
    if (this.requestBatchTimer) {
      clearTimeout(this.requestBatchTimer);
    }
    
    this.requestBatchTimer = setTimeout(() => {
      this.processBatchedRequests();
    }, 100); // Batch requests over 100ms
  }

  async processBatchedRequests() {
    if (this.requestQueue.length === 0) return;
    
    const requests = [...this.requestQueue];
    this.requestQueue = [];
    
    try {
      // Process similar requests together
      const groupedRequests = this.groupRequestsByType(requests);
      
      for (const [type, reqs] of groupedRequests.entries()) {
        await this.processSimilarRequests(type, reqs);
      }
    } catch (error) {
      console.error('Batch request processing failed:', error);
    }
  }

  groupRequestsByType(requests) {
    const groups = new Map();
    
    requests.forEach(req => {
      const type = req.type || 'default';
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type).push(req);
    });
    
    return groups;
  }

  // Optimized MutationObserver usage
  createOptimizedObserver(callback, options = {}) {
    const defaultOptions = {
      childList: true,
      subtree: false,
      attributes: false,
      attributeOldValue: false,
      characterData: false,
      characterDataOldValue: false
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    const observer = new MutationObserver(
      this.debounce(callback, 250, `observer_${Date.now()}`)
    );
    
    this.observerInstances.add(observer);
    return observer;
  }

  cleanupOrphanedObservers() {
    // Clean up disconnected observers
    this.observerInstances.forEach(observer => {
      // Check if observer is still connected
      try {
        observer.takeRecords(); // This will throw if disconnected
      } catch (e) {
        this.observerInstances.delete(observer);
      }
    });
  }

  // Memory-efficient data storage
  createMemoryEfficientCache(maxSize = 100) {
    return new Map([...Array(maxSize)].map((_, i) => [i, null]));
  }

  // Cleanup function
  cleanup() {
    // Clear all timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.throttleTimers.forEach(timer => clearTimeout(timer));
    
    if (this.requestBatchTimer) {
      clearTimeout(this.requestBatchTimer);
    }
    
    // Clear caches
    this.cachedElements.clear();
    this.lazyLoadModules.clear();
    
    // Disconnect observers
    this.observerInstances.forEach(observer => {
      try {
        observer.disconnect();
      } catch (e) {
        // Observer already disconnected
      }
    });
    this.observerInstances.clear();
    
    // Clear request queue
    this.requestQueue = [];
  }

  // Performance monitoring
  measurePerformance(name, func) {
    const start = performance.now();
    const result = func();
    const end = performance.now();
    
    if (end - start > 16) { // Slower than 60fps
      console.warn(`Slow operation detected: ${name} took ${end - start}ms`);
    }
    
    return result;
  }

  // Resource usage monitoring
  monitorResourceUsage() {
    if ('memory' in performance) {
      const memInfo = performance.memory;
      const memUsage = {
        used: Math.round(memInfo.usedJSHeapSize / 1048576), // MB
        total: Math.round(memInfo.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memInfo.jsHeapSizeLimit / 1048576) // MB
      };
      
      if (memUsage.used / memUsage.limit > 0.8) {
        console.warn('High memory usage detected:', memUsage);
        this.triggerMemoryCleanup();
      }
    }
  }

  triggerMemoryCleanup() {
    // Force garbage collection of caches
    this.cachedElements.clear();
    this.lazyLoadModules.clear();
    
    // Clear old timers
    this.debounceTimers.clear();
    this.throttleTimers.clear();
    
    // Suggest browser GC (if available)
    if (window.gc) {
      window.gc();
    }
  }
}

// Export optimization utilities
window.JobTrackerOptimizer = PerformanceOptimizer;

// Auto-initialize if in content script context
if (typeof chrome !== 'undefined' && chrome.runtime) {
  const optimizer = new PerformanceOptimizer();
  
  // Monitor performance every minute
  setInterval(() => {
    optimizer.monitorResourceUsage();
  }, 60000);
}
/**
 * Circuit Breaker
 * Epic 4.2: RE-002 Circuit Breakers
 * 
 * Graceful degradation for external services:
 * - GitHub API
 * - LLM API
 * - External webhooks
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening
  successThreshold: number;      // Number of successes to close from half-open
  timeout: number;               // Time in ms before trying half-open
  resetTimeout?: number;         // Time to reset failure count
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  nextAttemptTime?: number;
}

/**
 * Circuit Breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;
  private nextAttemptTime?: number;
  
  constructor(
    private name: string,
    private config: CircuitBreakerConfig
  ) {}
  
  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < (this.nextAttemptTime || 0)) {
        throw new Error(`Circuit breaker [${this.name}] is OPEN`);
      }
      
      // Try half-open
      this.state = CircuitState.HALF_OPEN;
      this.successes = 0;
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.lastSuccessTime = Date.now();
    this.failures = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      
      if (this.successes >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successes = 0;
        // console.log(`Circuit breaker [${this.name}] closed`);
      }
    }
  }
  
  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.lastFailureTime = Date.now();
    this.failures++;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.timeout;
      console.error(`Circuit breaker [${this.name}] opened (half-open failure)`);
      return;
    }
    
    if (this.failures >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.timeout;
      console.error(`Circuit breaker [${this.name}] opened (threshold reached: ${this.failures})`);
    }
  }
  
  /**
   * Get current stats
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }
  
  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.nextAttemptTime = undefined;
    // console.log(`Circuit breaker [${this.name}] reset`);
  }
  
  /**
   * Force open (for testing/maintenance)
   */
  forceOpen(): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.config.timeout;
    // console.log(`Circuit breaker [${this.name}] forced open`);
  }
  
  /**
   * Force close (for testing/maintenance)
   */
  forceClose(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    // console.log(`Circuit breaker [${this.name}] forced closed`);
  }
}

// ═══════════════════════════════════════════════════════════
// Pre-configured Circuit Breakers
// ═══════════════════════════════════════════════════════════

/**
 * GitHub API circuit breaker
 */
export const githubCircuitBreaker = new CircuitBreaker('GitHub API', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000, // 1 minute
});

/**
 * LLM API circuit breaker
 */
export const llmCircuitBreaker = new CircuitBreaker('LLM API', {
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 30000, // 30 seconds
});

/**
 * Webhook circuit breaker
 */
export const webhookCircuitBreaker = new CircuitBreaker('Webhooks', {
  failureThreshold: 10,
  successThreshold: 3,
  timeout: 120000, // 2 minutes
});

/**
 * Database circuit breaker
 */
export const databaseCircuitBreaker = new CircuitBreaker('Database', {
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 10000, // 10 seconds
});

// ═══════════════════════════════════════════════════════════
// Circuit Breaker Registry
// ═══════════════════════════════════════════════════════════

const circuitBreakers = new Map<string, CircuitBreaker>();

/**
 * Register a circuit breaker
 */
export function registerCircuitBreaker(name: string, breaker: CircuitBreaker): void {
  circuitBreakers.set(name, breaker);
}

/**
 * Get circuit breaker by name
 */
export function getCircuitBreaker(name: string): CircuitBreaker | undefined {
  return circuitBreakers.get(name);
}

/**
 * Get all circuit breaker stats
 */
export function getAllCircuitBreakerStats(): Record<string, CircuitBreakerStats> {
  const stats: Record<string, CircuitBreakerStats> = {};
  
  // Add pre-configured breakers
  stats['GitHub API'] = githubCircuitBreaker.getStats();
  stats['LLM API'] = llmCircuitBreaker.getStats();
  stats['Webhooks'] = webhookCircuitBreaker.getStats();
  stats['Database'] = databaseCircuitBreaker.getStats();
  
  // Add registered breakers
  circuitBreakers.forEach((breaker, name) => {
    stats[name] = breaker.getStats();
  });
  
  return stats;
}

/**
 * Reset all circuit breakers
 */
export function resetAllCircuitBreakers(): void {
  githubCircuitBreaker.reset();
  llmCircuitBreaker.reset();
  webhookCircuitBreaker.reset();
  databaseCircuitBreaker.reset();
  
  circuitBreakers.forEach(breaker => breaker.reset());
}

// ═══════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════

/**
 * Execute with circuit breaker and fallback
 */
export async function executeWithFallback<T>(
  breaker: CircuitBreaker,
  fn: () => Promise<T>,
  fallback: () => T | Promise<T>
): Promise<T> {
  try {
    return await breaker.execute(fn);
  } catch (error) {
    console.warn(`Circuit breaker triggered, using fallback:`, error);
    return await fallback();
  }
}

/**
 * Execute with timeout and circuit breaker
 */
export async function executeWithTimeout<T>(
  breaker: CircuitBreaker,
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  return breaker.execute(async () => {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      ),
    ]);
  });
}

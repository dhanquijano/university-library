/**
 * Utility functions for handling retries and error recovery
 */

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

export class RetryError extends Error {
  constructor(
    message: string,
    public attempts: number,
    public lastError: Error
  ) {
    super(message);
    this.name = "RetryError";
  }
}

/**
 * Retry an async function with exponential backoff
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    onRetry
  } = options;

  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        throw new RetryError(
          `Failed after ${maxAttempts} attempts: ${lastError.message}`,
          attempt,
          lastError
        );
      }

      onRetry?.(attempt, lastError);

      // Calculate delay with exponential backoff
      const currentDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay;
      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }

  throw lastError!;
}

/**
 * Retry fetch requests with specific handling for network errors
 */
export async function retryFetch(
  url: string,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  return retryAsync(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Don't retry on client errors (4xx), only server errors (5xx) and network errors
      if (!response.ok && response.status >= 400 && response.status < 500) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        // Handle specific error types
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        }
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Network error - please check your connection');
        }
      }
      
      throw error;
    }
  }, options);
}

/**
 * Create a debounced version of a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Create a throttled version of a function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: Error): boolean {
  return (
    error.message.includes('Failed to fetch') ||
    error.message.includes('Network error') ||
    error.message.includes('Request timeout') ||
    error.name === 'AbortError' ||
    error.name === 'NetworkError'
  );
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  // Retry network errors and 5xx server errors
  if (isNetworkError(error)) return true;
  
  // Check for HTTP status codes in error message
  const statusMatch = error.message.match(/HTTP (\d+):/);
  if (statusMatch) {
    const status = parseInt(statusMatch[1]);
    return status >= 500; // Only retry server errors
  }
  
  return false;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: Error): string {
  if (isNetworkError(error)) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }
  
  if (error.message.includes('HTTP 401')) {
    return "You are not authorized to perform this action. Please log in again.";
  }
  
  if (error.message.includes('HTTP 403')) {
    return "You don't have permission to perform this action.";
  }
  
  if (error.message.includes('HTTP 404')) {
    return "The requested resource was not found.";
  }
  
  if (error.message.includes('HTTP 409')) {
    return "This action conflicts with the current state. Please refresh and try again.";
  }
  
  if (error.message.includes('HTTP 5')) {
    return "A server error occurred. Please try again in a moment.";
  }
  
  // Return the original message for other errors, but sanitize it
  return error.message || "An unexpected error occurred. Please try again.";
}
/**
 * API Client - Centralized API communication utility
 *
 * Features:
 * - Environment-based configuration
 * - Automatic retry with exponential backoff
 * - Request/response interceptors
 * - Timeout handling
 * - Error standardization
 * - Request cancellation
 * - Request queuing for rate limiting
 */

import logger from './logger';

class APIClient {
  constructor() {
    this.baseURL = this.getBaseURL();
    this.timeout = 30000; // 30 seconds
    this.retryAttempts = 3;
    this.retryDelay = 1000; // Initial delay in ms
    this.activeRequests = new Map();

    // Interceptors
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  /**
   * Get base URL based on environment
   * @returns {string}
   */
  getBaseURL() {
    // Check if we're in browser
    if (typeof window !== 'undefined') {
      // Try to get from environment variables (Vite/Astro)
      if (import.meta.env?.PUBLIC_API_URL) {
        return import.meta.env.PUBLIC_API_URL;
      }

      // Fallback based on hostname
      const hostname = window.location.hostname;

      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // In dev: backend runs on 8000, frontend on 5173/3000
        // Always use port 8000 for backend to avoid hitting Astro routes
        return 'http://localhost:8000';
      }

      // Production - use separate backend domain if available
      const backendUrl = import.meta.env?.PUBLIC_BACKEND_URL;
      if (backendUrl) {
        return backendUrl;
      }

      // Fallback: assume API is on same domain with /api path
      return `${window.location.protocol}//${window.location.host}`;
    }

    // SSR fallback
    return process.env.PUBLIC_API_URL || 'http://localhost:8000';
  }

  /**
   * Add request interceptor
   * @param {Function} interceptor
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   * @param {Function} interceptor
   */
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Apply request interceptors
   * @param {Object} config
   * @returns {Object}
   */
  async applyRequestInterceptors(config) {
    let modifiedConfig = { ...config };

    for (const interceptor of this.requestInterceptors) {
      try {
        modifiedConfig = await interceptor(modifiedConfig);
      } catch (error) {
        logger.error('Request interceptor error:', error);
      }
    }

    return modifiedConfig;
  }

  /**
   * Apply response interceptors
   * @param {Response} response
   * @returns {Response}
   */
  async applyResponseInterceptors(response) {
    let modifiedResponse = response;

    for (const interceptor of this.responseInterceptors) {
      try {
        modifiedResponse = await interceptor(modifiedResponse);
      } catch (error) {
        logger.error('Response interceptor error:', error);
      }
    }

    return modifiedResponse;
  }

  /**
   * Build full URL
   * @param {string} endpoint
   * @returns {string}
   */
  buildURL(endpoint) {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    // Remove trailing slash from baseURL if present
    const cleanBaseURL = this.baseURL.endsWith('/')
      ? this.baseURL.slice(0, -1)
      : this.baseURL;

    return `${cleanBaseURL}/${cleanEndpoint}`;
  }

  /**
   * Build query string from params
   * @param {Object} params
   * @returns {string}
   */
  buildQueryString(params) {
    if (!params || Object.keys(params).length === 0) return '';

    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return searchParams.toString();
  }

  /**
   * Create abort controller with timeout
   * @param {number} timeout
   * @returns {AbortController}
   */
  createAbortController(timeout) {
    const controller = new AbortController();

    setTimeout(() => {
      controller.abort();
    }, timeout);

    return controller;
  }

  /**
   * Sleep utility for retry delay
   * @param {number} ms
   * @returns {Promise}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate exponential backoff delay
   * @param {number} attempt
   * @returns {number}
   */
  calculateBackoff(attempt) {
    return this.retryDelay * Math.pow(2, attempt - 1);
  }

  /**
   * Check if error is retryable
   * @param {Error} error
   * @param {Response} response
   * @returns {boolean}
   */
  isRetryableError(error, response) {
    // Network errors
    if (error.name === 'TypeError' || error.name === 'AbortError') {
      return true;
    }

    // Server errors (5xx)
    if (response && response.status >= 500) {
      return true;
    }

    // Too Many Requests
    if (response && response.status === 429) {
      return true;
    }

    return false;
  }

  /**
   * Make HTTP request with retry logic
   * @param {string} endpoint
   * @param {Object} options
   * @returns {Promise<any>}
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      params = null,
      body = null,
      headers = {},
      timeout = this.timeout,
      retry = true,
      retryAttempts = this.retryAttempts,
      signal = null,
      ...restOptions
    } = options;

    // Build URL with query params
    let url = this.buildURL(endpoint);
    if (params) {
      const queryString = this.buildQueryString(params);
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    // Prepare request config
    let config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...restOptions,
    };

    // Add body if present
    if (body) {
      if (config.headers['Content-Type'] === 'application/json') {
        config.body = JSON.stringify(body);
      } else {
        config.body = body;
      }
    }

    // Apply request interceptors
    config = await this.applyRequestInterceptors(config);

    // Create request ID for tracking
    const requestId = `${method}-${endpoint}-${Date.now()}`;

    // Attempt request with retry logic
    let lastError = null;
    let lastResponse = null;

    for (let attempt = 1; attempt <= (retry ? retryAttempts : 1); attempt++) {
      try {
        logger.debug(`API Request [${requestId}] Attempt ${attempt}:`, {
          url,
          method,
          params,
        });

        // Create abort controller (use provided signal or create new one)
        const controller = signal ? { signal } : this.createAbortController(timeout);
        config.signal = controller.signal;

        // Store active request
        this.activeRequests.set(requestId, controller);

        // Make request
        const startTime = Date.now();
        const response = await fetch(url, config);
        const duration = Date.now() - startTime;

        // Remove from active requests
        this.activeRequests.delete(requestId);

        logger.debug(`API Response [${requestId}]:`, {
          status: response.status,
          duration: `${duration}ms`,
        });

        // Apply response interceptors
        const interceptedResponse = await this.applyResponseInterceptors(response);

        // Check if response is ok
        if (!interceptedResponse.ok) {
          lastResponse = interceptedResponse;

          // Check if retryable
          if (retry && attempt < retryAttempts && this.isRetryableError(null, interceptedResponse)) {
            const backoffDelay = this.calculateBackoff(attempt);
            logger.warn(`API request failed, retrying in ${backoffDelay}ms...`, {
              attempt,
              status: interceptedResponse.status,
            });
            await this.sleep(backoffDelay);
            continue;
          }

          // Not retryable or max attempts reached
          const errorData = await this.parseErrorResponse(interceptedResponse);
          throw this.createError(interceptedResponse.status, errorData, url);
        }

        // Success - parse and return data
        return await this.parseSuccessResponse(interceptedResponse);

      } catch (error) {
        lastError = error;
        this.activeRequests.delete(requestId);

        // If it's already our custom error, don't retry
        if (error.isAPIError) {
          throw error;
        }

        // Check if retryable
        if (retry && attempt < retryAttempts && this.isRetryableError(error, lastResponse)) {
          const backoffDelay = this.calculateBackoff(attempt);
          logger.warn(`API request failed, retrying in ${backoffDelay}ms...`, {
            attempt,
            error: error.message,
          });
          await this.sleep(backoffDelay);
          continue;
        }

        // Not retryable or max attempts reached
        throw this.createError(0, { message: error.message }, url, error);
      }
    }

    // All retries failed
    if (lastResponse) {
      const errorData = await this.parseErrorResponse(lastResponse);
      throw this.createError(lastResponse.status, errorData, url);
    } else if (lastError) {
      throw this.createError(0, { message: lastError.message }, url, lastError);
    }
  }

  /**
   * Parse success response
   * @param {Response} response
   * @returns {Promise<any>}
   */
  async parseSuccessResponse(response) {
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return await response.text();
  }

  /**
   * Parse error response
   * @param {Response} response
   * @returns {Promise<Object>}
   */
  async parseErrorResponse(response) {
    try {
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      const text = await response.text();
      return { message: text || response.statusText };
    } catch (error) {
      return { message: response.statusText || 'Unknown error' };
    }
  }

  /**
   * Create standardized error object
   * @param {number} status
   * @param {Object} data
   * @param {string} url
   * @param {Error} originalError
   * @returns {Error}
   */
  createError(status, data, url, originalError = null) {
    const error = new Error(data.message || data.detail || 'API request failed');
    error.isAPIError = true;
    error.status = status;
    error.data = data;
    error.url = url;
    error.timestamp = new Date().toISOString();

    if (originalError) {
      error.originalError = originalError;
    }

    // Add user-friendly message
    if (status === 0 || originalError?.name === 'AbortError') {
      error.userMessage = 'Network error. Please check your connection.';
    } else if (status === 400) {
      error.userMessage = 'Invalid request. Please check your input.';
    } else if (status === 401) {
      error.userMessage = 'Authentication required. Please log in.';
    } else if (status === 403) {
      error.userMessage = 'Access denied.';
    } else if (status === 404) {
      error.userMessage = 'Resource not found.';
    } else if (status === 429) {
      error.userMessage = 'Too many requests. Please wait a moment.';
    } else if (status >= 500) {
      error.userMessage = 'Server error. Please try again later.';
    } else {
      error.userMessage = data.message || 'An error occurred.';
    }

    logger.error('API Error:', {
      status,
      url,
      message: error.message,
      data,
    });

    return error;
  }

  /**
   * Cancel all active requests
   */
  cancelAllRequests() {
    this.activeRequests.forEach((controller, requestId) => {
      controller.abort();
      logger.debug(`Cancelled request: ${requestId}`);
    });
    this.activeRequests.clear();
  }

  /**
   * GET request
   * @param {string} endpoint
   * @param {Object} options
   * @returns {Promise<any>}
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   * @param {string} endpoint
   * @param {Object} body
   * @param {Object} options
   * @returns {Promise<any>}
   */
  async post(endpoint, body = null, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   * @param {string} endpoint
   * @param {Object} body
   * @param {Object} options
   * @returns {Promise<any>}
   */
  async put(endpoint, body = null, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * PATCH request
   * @param {string} endpoint
   * @param {Object} body
   * @param {Object} options
   * @returns {Promise<any>}
   */
  async patch(endpoint, body = null, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  /**
   * DELETE request
   * @param {string} endpoint
   * @param {Object} options
   * @returns {Promise<any>}
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create singleton instance
const apiClient = new APIClient();

// Export singleton and class
export default apiClient;
export { APIClient };

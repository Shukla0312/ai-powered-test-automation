/**
 * API Service Layer
 * Handles all HTTP communication with external APIs
 * Provides reliability features: retries, timeout handling, request/response logging
 * 
 * Purpose: Abstract HTTP complexity, provide consistent error handling,
 * centralize API communication and monitoring
 */

import axios from 'axios';
import config from '../config/index.js';

/**
 * APIServiceError - Custom error for API-related failures
 */
export class APIServiceError extends Error {
  constructor(message, statusCode = null, response = null, request = null) {
    super(message);
    this.name = 'APIServiceError';
    this.statusCode = statusCode;
    this.response = response;
    this.request = request;
  }
}

/**
 * API Service - Handles all API interactions
 * Implements retry logic, logging, and error handling
 */
export class APIService {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || config.api.baseUrl;
    this.timeout = options.timeout || config.api.timeout;
    this.retryAttempts = options.retryAttempts || config.api.retryAttempts;
    this.requestHistory = [];
    this.axiosInstance = this._createAxiosInstance();
  }

  /**
   * Create axios instance with default configuration
   * @private
   */
  _createAxiosInstance() {
    return axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ai-powered-test-automation/1.0',
      },
    });
  }

  /**
   * Perform GET request with retry logic
   * 
   * @param {string} endpoint - API endpoint (relative to baseUrl)
   * @param {Object} options - Request options
   * @param {Object} options.params - Query parameters
   * @param {Object} options.headers - Additional headers
   * @param {number} options.timeout - Request timeout in ms
   * 
   * @returns {Promise<Object>} Response data
   * @throws {APIServiceError} If request fails
   */
  async get(endpoint, options = {}) {
    return this._request('GET', endpoint, null, options);
  }

  /**
   * Perform POST request with retry logic
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @param {Object} options - Request options
   * 
   * @returns {Promise<Object>} Response data
   * @throws {APIServiceError}
   */
  async post(endpoint, data, options = {}) {
    return this._request('POST', endpoint, data, options);
  }

  /**
   * Perform PUT request with retry logic
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @param {Object} options - Request options
   * 
   * @returns {Promise<Object>} Response data
   * @throws {APIServiceError}
   */
  async put(endpoint, data, options = {}) {
    return this._request('PUT', endpoint, data, options);
  }

  /**
   * Perform PATCH request with retry logic
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @param {Object} options - Request options
   * 
   * @returns {Promise<Object>} Response data
   * @throws {APIServiceError}
   */
  async patch(endpoint, data, options = {}) {
    return this._request('PATCH', endpoint, data, options);
  }

  /**
   * Perform DELETE request with retry logic
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * 
   * @returns {Promise<Object>} Response data
   * @throws {APIServiceError}
   */
  async delete(endpoint, options = {}) {
    return this._request('DELETE', endpoint, null, options);
  }

  /**
   * Internal method that handles all HTTP requests with retry logic
   * Implements exponential backoff for transient failures
   * 
   * @private
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body (null for GET/DELETE)
   * @param {Object} options - Request options
   * @param {number} retryCount - Current retry attempt (internal)
   * 
   * @returns {Promise<Object>} Response data
   * @throws {APIServiceError}
   */
  async _request(method, endpoint, data = null, options = {}, retryCount = 0) {
    const requestConfig = {
      method,
      url: endpoint,
      timeout: options.timeout || this.timeout,
      headers: options.headers || {},
      params: options.params || {},
    };

    if (data) {
      requestConfig.data = data;
    }

    const startTime = Date.now();

    try {
      const response = await this.axiosInstance(requestConfig);

      // Log successful request
      this._logRequest({
        method,
        endpoint,
        statusCode: response.status,
        duration: Date.now() - startTime,
        success: true,
      });

      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      const isRetryable = this._isRetryableError(error);
      const shouldRetry = isRetryable && retryCount < this.retryAttempts;

      // Log the error
      this._logRequest({
        method,
        endpoint,
        statusCode: error.response?.status,
        duration,
        success: false,
        expectedFailure: options.expectedStatus === error.response?.status,
        errorMessage: error.message,
        retryCount,
        willRetry: shouldRetry,
      });

      // Retry with exponential backoff
      if (shouldRetry) {
        const backoffDelay = Math.pow(2, retryCount) * config.api.retryDelay;
        console.warn(
          `Retrying ${method} ${endpoint} in ${backoffDelay}ms (attempt ${retryCount + 1}/${this.retryAttempts})`
        );
        await this._sleep(backoffDelay);
        return this._request(method, endpoint, data, options, retryCount + 1);
      }

      // All retries exhausted or non-retryable error
      throw new APIServiceError(
        `${method} ${endpoint} failed: ${error.message}`,
        error.response?.status,
        error.response?.data,
        {
          method,
          endpoint,
          params: requestConfig.params,
        }
      );
    }
  }

  /**
   * Determine if error is retryable
   * Retries on 5xx errors (server issues) and timeouts, not 4xx (client issues)
   * 
   * @private
   */
  _isRetryableError(error) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return true; // Retry on timeout
    }

    const status = error.response?.status;
    if (status >= 500) {
      return true; // Retry on server errors
    }

    if (status === 429) {
      return true; // Retry on rate limit
    }

    return false; // Don't retry on 4xx client errors
  }

  /**
   * Log request details for debugging and analysis
   * @private
   */
  _logRequest(log) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...log,
    };

    this.requestHistory.push(logEntry);

    if (log.success) {
      console.log(`✓ ${log.method} ${log.endpoint} [${log.statusCode}] ${log.duration}ms`);
    } else if (log.expectedFailure) {
      console.log(
        `✓ ${log.method} ${log.endpoint} [${log.statusCode}] ${log.duration}ms - expected negative response`
      );
    } else {
      console.error(
        `✗ ${log.method} ${log.endpoint} [${log.statusCode || 'timeout'}] ${log.duration}ms - ${log.errorMessage}`
      );
    }
  }

  /**
   * Utility: Sleep for specified milliseconds
   * @private
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get request history for debugging
   * 
   * @param {Object} filter - Filter options
   * @param {boolean} filter.errorsOnly - Only return failed requests
   * @param {string} filter.endpoint - Filter by endpoint
   * 
   * @returns {Array} Request history
   */
  getRequestHistory(filter = {}) {
    let history = [...this.requestHistory];

    if (filter.errorsOnly) {
      history = history.filter((log) => !log.success);
    }

    if (filter.endpoint) {
      history = history.filter((log) => log.endpoint.includes(filter.endpoint));
    }

    return history;
  }

  /**
   * Clear request history
   */
  clearHistory() {
    this.requestHistory = [];
  }
}

export default APIService;

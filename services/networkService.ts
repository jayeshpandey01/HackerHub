// Network Service for handling API requests with proper error handling
import { config } from '../config/environment';
import { monitoringService } from './monitoringService';
import { mockApiService } from './mockApiService';

export interface NetworkResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

class NetworkService {
  private static instance: NetworkService;
  private baseURL: string;
  private defaultTimeout: number;
  private isOnline: boolean = true;

  private constructor() {
    this.baseURL = config.API_BASE_URL;
    this.defaultTimeout = config.BACKEND_TIMEOUT;
    this.setupNetworkMonitoring();
  }

  static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  private setupNetworkMonitoring(): void {
    // In a real React Native app, you would use @react-native-community/netinfo
    // For now, we'll assume online status
    this.isOnline = true;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<NetworkResponse<T>> {
    const startTime = Date.now();
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout,
      retries = 1
    } = options;

    // Check if mock API should handle this request
    const mockResponse = await mockApiService.getMockResponse(endpoint, method, body);
    if (mockResponse) {
      monitoringService.recordNetworkMetric(
        endpoint,
        method,
        Date.now() - startTime,
        mockResponse.status,
        mockResponse.success
      );
      
      return {
        success: mockResponse.success,
        data: mockResponse.data,
        error: mockResponse.error,
        status: mockResponse.status
      };
    }

    // Check if we're in offline mode
    if (!this.isOnline) {
      monitoringService.logWarn('network', 'Request attempted while offline', { endpoint });
      return {
        success: false,
        error: 'No internet connection available'
      };
    }

    // Skip requests to localhost in production or if backend is not available
    if (this.baseURL.includes('localhost') && !config.DEBUG_MODE) {
      monitoringService.logInfo('network', 'Skipping localhost request in production mode', { endpoint });
      return {
        success: false,
        error: 'Backend not available in current environment'
      };
    }

    const url = `${this.baseURL}${endpoint}`;
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...(body && { body: JSON.stringify(body) }),
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        // Record network metric
        monitoringService.recordNetworkMetric(
          endpoint,
          method,
          responseTime,
          response.status,
          response.ok
        );

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          return {
            success: false,
            error: `HTTP ${response.status}: ${errorText}`,
            status: response.status
          };
        }

        const data = await response.json().catch(() => null);
        return {
          success: true,
          data,
          status: response.status
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        const responseTime = Date.now() - startTime;

        // Record failed network metric
        monitoringService.recordNetworkMetric(
          endpoint,
          method,
          responseTime,
          0,
          false
        );

        // Handle specific error types
        if (lastError.name === 'AbortError') {
          monitoringService.logWarn('network', 'Request timeout', { endpoint, timeout });
          return {
            success: false,
            error: 'Request timeout'
          };
        }

        if (lastError.message.includes('Network request failed')) {
          monitoringService.logInfo('network', 'Network request failed, possibly offline', { endpoint });
          this.isOnline = false;
          
          // Don't retry network failures
          return {
            success: false,
            error: 'Network connection failed'
          };
        }

        // If this is not the last attempt, wait before retrying
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          monitoringService.logInfo('network', `Retrying request (attempt ${attempt + 2}/${retries + 1})`, { endpoint });
        }
      }
    }

    // All retries failed
    monitoringService.logError('network', 'All request attempts failed', lastError);
    return {
      success: false,
      error: lastError?.message || 'Request failed after all retries'
    };
  }

  // Public API methods
  async get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<NetworkResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>): Promise<NetworkResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>): Promise<NetworkResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<NetworkResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async patch<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>): Promise<NetworkResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  // Utility methods
  setOnlineStatus(isOnline: boolean): void {
    this.isOnline = isOnline;
    monitoringService.logInfo('network', `Network status changed: ${isOnline ? 'online' : 'offline'}`);
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  // Health check method
  async healthCheck(): Promise<NetworkResponse> {
    return this.get('/health', { timeout: 5000, retries: 0 });
  }
}

export const networkService = NetworkService.getInstance();

// Export types for use in other services
export type { NetworkResponse, RequestOptions };
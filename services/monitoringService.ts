// Monitoring and Logging Service for Fitness Backend Integration
import { config } from '../config/environment';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
  error?: Error;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: string;
  category: 'video_processing' | 'pose_analysis' | 'network' | 'ui' | 'camera';
  metadata?: Record<string, any>;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

export interface ErrorReport {
  id: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context: {
    screen: string;
    action: string;
    deviceInfo: any;
    appVersion: string;
  };
  breadcrumbs: LogEntry[];
}

class MonitoringService {
  private static instance: MonitoringService;
  private logs: LogEntry[] = [];
  private metrics: PerformanceMetric[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();
  private breadcrumbs: LogEntry[] = [];
  private currentSessionId: string;
  private currentUserId?: string;

  private readonly MAX_LOGS = 1000;
  private readonly MAX_METRICS = 500;
  private readonly MAX_BREADCRUMBS = 50;

  private constructor() {
    this.currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    this.initializeMonitoring();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private initializeMonitoring(): void {
    // Set up global error handler
    this.setupGlobalErrorHandler();

    // Start health check monitoring
    this.startHealthCheckMonitoring();

    console.log('📊 Monitoring service initialized');
  }

  private setupGlobalErrorHandler(): void {
    // In a real React Native app, you'd use libraries like:
    // - @react-native-async-storage/async-storage for persistence
    // - react-native-exception-handler for error handling
    // - Flipper or Reactotron for debugging

    const originalConsoleError = console.error;
    const self = this;
    console.error = (...args) => {
      self.logError('global', 'Unhandled error', args[0]);
      originalConsoleError.apply(console, args);
    };
  }

  private startHealthCheckMonitoring(): void {
    // Only start health monitoring if not in development mode or if backend is configured
    if (config.DEBUG_MODE && config.API_BASE_URL.includes('localhost')) {
      this.logInfo('monitoring', 'Health check monitoring disabled for localhost development');
      return;
    }

    // Check backend health every 5 minutes
    setInterval(() => {
      this.checkBackendHealth();
    }, 5 * 60 * 1000);

    // Initial health check with delay to allow app to fully initialize
    setTimeout(() => {
      this.checkBackendHealth();
    }, 2000);
  }

  private async checkBackendHealth(): Promise<void> {
    const startTime = Date.now();

    try {
      // Skip health check if no API URL is configured or in development mode without backend
      if (!config.API_BASE_URL || (config.API_BASE_URL.includes('localhost') && !config.DEBUG_MODE)) {
        this.healthChecks.set('backend', {
          service: 'backend',
          status: 'healthy',
          responseTime: 0,
          lastCheck: new Date().toISOString(),
          error: 'Backend health check skipped - no backend configured'
        });
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${config.API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;

      this.healthChecks.set('backend', {
        service: 'backend',
        status: response.ok ? 'healthy' : 'degraded',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: response.ok ? undefined : `HTTP ${response.status}`
      });

      this.recordMetric({
        name: 'backend_health_check',
        value: responseTime,
        unit: 'ms',
        timestamp: new Date().toISOString(),
        category: 'network',
        metadata: { status: response.status }
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Handle specific network errors gracefully
      let status: 'unhealthy' | 'degraded' = 'unhealthy';
      let friendlyError = errorMessage;

      if (errorMessage.includes('Network request failed') || errorMessage.includes('fetch')) {
        status = 'degraded';
        friendlyError = 'Backend not accessible - running in offline mode';
      } else if (errorMessage.includes('AbortError')) {
        friendlyError = 'Backend health check timeout';
      }

      this.healthChecks.set('backend', {
        service: 'backend',
        status,
        responseTime,
        lastCheck: new Date().toISOString(),
        error: friendlyError
      });

      // Only log as error if it's not a network connectivity issue
      if (!errorMessage.includes('Network request failed')) {
        this.logError('health_check', 'Backend health check failed', error);
      } else {
        this.logInfo('health_check', 'Backend not accessible, continuing in offline mode');
      }
    }
  }

  // Logging methods
  log(level: LogLevel, category: string, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      userId: this.currentUserId,
      sessionId: this.currentSessionId
    };

    this.logs.push(entry);
    this.breadcrumbs.push(entry);

    // Maintain log size limits
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.splice(0, this.logs.length - this.MAX_LOGS);
    }

    if (this.breadcrumbs.length > this.MAX_BREADCRUMBS) {
      this.breadcrumbs.splice(0, this.breadcrumbs.length - this.MAX_BREADCRUMBS);
    }

    // Console output in debug mode
    if (config.DEBUG_MODE) {
      const logMethod = level === 'error' || level === 'fatal' ? console.error :
        level === 'warn' ? console.warn : console.log;

      logMethod(`[${level.toUpperCase()}] ${category}: ${message}`, data || '');
    }
  }

  logDebug(category: string, message: string, data?: any): void {
    this.log('debug', category, message, data);
  }

  logInfo(category: string, message: string, data?: any): void {
    this.log('info', category, message, data);
  }

  logWarn(category: string, message: string, data?: any): void {
    this.log('warn', category, message, data);
  }

  logError(category: string, message: string, error?: any): void {
    this.log('error', category, message, {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    });
  }

  logFatal(category: string, message: string, error?: any): void {
    this.log('fatal', category, message, {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    });

    // In production, this might trigger immediate error report
    this.reportError(error, category, message);
  }

  // Performance monitoring
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Maintain metrics size limit
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.splice(0, this.metrics.length - this.MAX_METRICS);
    }

    this.logDebug('performance', `Metric recorded: ${metric.name}`, metric);
  }

  startTimer(name: string, category: PerformanceMetric['category']): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.recordMetric({
        name,
        value: duration,
        unit: 'ms',
        timestamp: new Date().toISOString(),
        category
      });
    };
  }

  // Video processing specific metrics
  recordVideoProcessingMetric(
    operation: 'upload' | 'analysis' | 'compression',
    duration: number,
    fileSize?: number,
    success?: boolean
  ): void {
    this.recordMetric({
      name: `video_${operation}`,
      value: duration,
      unit: 'ms',
      timestamp: new Date().toISOString(),
      category: 'video_processing',
      metadata: {
        fileSize,
        success,
        operation
      }
    });
  }

  // Pose analysis specific metrics
  recordPoseAnalysisMetric(
    type: 'frame' | 'video',
    processingTime: number,
    accuracy?: number,
    keypoints?: number,
    warnings?: string[]
  ): void {
    this.recordMetric({
      name: `pose_analysis_${type}`,
      value: processingTime,
      unit: 'ms',
      timestamp: new Date().toISOString(),
      category: 'pose_analysis',
      metadata: {
        accuracy,
        keypoints,
        type,
        warnings: warnings?.length || 0,
        hasWarnings: warnings && warnings.length > 0
      }
    });

    // Log TensorFlow warnings separately for debugging
    if (warnings && warnings.length > 0) {
      const tfWarnings = warnings.filter(w =>
        w.includes('inference_feedback_manager') ||
        w.includes('Feedback manager requires')
      );

      if (tfWarnings.length > 0) {
        this.logDebug('tensorflow', 'TensorFlow model warnings detected', {
          warnings: tfWarnings,
          exercise_type: type,
          processing_time: processingTime
        });
      }
    }
  }

  // Network monitoring
  recordNetworkMetric(
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number,
    success: boolean
  ): void {
    this.recordMetric({
      name: 'network_request',
      value: responseTime,
      unit: 'ms',
      timestamp: new Date().toISOString(),
      category: 'network',
      metadata: {
        endpoint,
        method,
        statusCode,
        success
      }
    });
  }

  // Error reporting
  private reportError(error: any, context: string, action: string): void {
    const errorReport: ErrorReport = {
      id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      userId: this.currentUserId,
      sessionId: this.currentSessionId,
      error: {
        name: error?.name || 'Unknown Error',
        message: error?.message || 'No error message',
        stack: error?.stack
      },
      context: {
        screen: context,
        action,
        deviceInfo: this.getDeviceInfo(),
        appVersion: '1.0.0' // In real app, get from package.json or build config
      },
      breadcrumbs: [...this.breadcrumbs]
    };

    // Store error report locally for debugging
    this.sendErrorReport(errorReport);

    this.logError('error_report', 'Error report generated', errorReport);
  }

  private async sendErrorReport(report: ErrorReport): Promise<void> {
    try {
      // In a real app, you could send to local logging service or file system
      console.log('📤 Storing error report:', report.id);

      // Store locally for debugging purposes
      // await localStorageService.storeErrorReport(report);

    } catch (error) {
      this.logError('error_reporting', 'Failed to store error report', error);
    }
  }

  private getDeviceInfo(): any {
    // In a real React Native app, use react-native-device-info
    return {
      platform: 'unknown',
      version: 'unknown',
      model: 'unknown',
      memory: 'unknown'
    };
  }

  // Analytics (if enabled)
  trackEvent(event: string, properties?: Record<string, any>): void {
    if (!config.ANALYTICS_ENABLED) return;

    this.logInfo('analytics', `Event: ${event}`, properties);

    // In production, send to analytics service
    // analyticsService.track(event, properties);
  }

  trackScreen(screenName: string, properties?: Record<string, any>): void {
    if (!config.ANALYTICS_ENABLED) return;

    this.logInfo('analytics', `Screen: ${screenName}`, properties);

    // In production, send to analytics service
    // analyticsService.screen(screenName, properties);
  }

  // User context
  setUserId(userId: string): void {
    this.currentUserId = userId;
    this.logInfo('monitoring', 'User ID set', { userId });
  }

  clearUserId(): void {
    this.currentUserId = undefined;
    this.logInfo('monitoring', 'User ID cleared');
  }

  // Data retrieval
  getLogs(level?: LogLevel, category?: string, limit?: number): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }

    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }

    return filteredLogs;
  }

  getMetrics(category?: PerformanceMetric['category'], limit?: number): PerformanceMetric[] {
    let filteredMetrics = [...this.metrics];

    if (category) {
      filteredMetrics = filteredMetrics.filter(metric => metric.category === category);
    }

    if (limit) {
      filteredMetrics = filteredMetrics.slice(-limit);
    }

    return filteredMetrics;
  }

  getHealthChecks(): HealthCheck[] {
    return Array.from(this.healthChecks.values());
  }

  // Statistics
  getPerformanceStats(): {
    averageVideoProcessingTime: number;
    averagePoseAnalysisTime: number;
    averageNetworkResponseTime: number;
    errorRate: number;
    errorReportCount: number;
  } {
    const videoMetrics = this.metrics.filter(m => m.category === 'video_processing');
    const poseMetrics = this.metrics.filter(m => m.category === 'pose_analysis');
    const networkMetrics = this.metrics.filter(m => m.category === 'network');
    const errorLogs = this.logs.filter(l => l.level === 'error' || l.level === 'fatal');
    const errorReportLogs = this.logs.filter(l => l.category === 'error_report');

    return {
      averageVideoProcessingTime: videoMetrics.length > 0
        ? videoMetrics.reduce((sum, m) => sum + m.value, 0) / videoMetrics.length
        : 0,
      averagePoseAnalysisTime: poseMetrics.length > 0
        ? poseMetrics.reduce((sum, m) => sum + m.value, 0) / poseMetrics.length
        : 0,
      averageNetworkResponseTime: networkMetrics.length > 0
        ? networkMetrics.reduce((sum, m) => sum + m.value, 0) / networkMetrics.length
        : 0,
      errorRate: this.logs.length > 0 ? (errorLogs.length / this.logs.length) * 100 : 0,
      errorReportCount: errorReportLogs.length
    };
  }

  // Cleanup
  clearLogs(): void {
    this.logs = [];
    this.breadcrumbs = [];
    this.logInfo('monitoring', 'Logs cleared');
  }

  clearMetrics(): void {
    this.metrics = [];
    this.logInfo('monitoring', 'Metrics cleared');
  }

  // Export data (for debugging or support)
  exportData() {
    return {
      sessionId: this.currentSessionId,
      userId: this.currentUserId,
      logs: this.logs,
      metrics: this.metrics,
      healthChecks: this.getHealthChecks(),
      stats: this.getPerformanceStats()
    };
  }
}

export const monitoringService = MonitoringService.getInstance();
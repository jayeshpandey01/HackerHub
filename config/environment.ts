// Environment Configuration for Fitness Backend Integration
import { Platform } from 'react-native';

export interface EnvironmentConfig {
  API_BASE_URL: string;
  BACKEND_TIMEOUT: number;
  ENABLE_POSE_ESTIMATION: boolean;
  ENABLE_VIDEO_ANALYSIS: boolean;
  ENABLE_REAL_TIME_FEEDBACK: boolean;
  MAX_VIDEO_SIZE_MB: number;
  MAX_VIDEO_DURATION_SECONDS: number;
  CAMERA_QUALITY: 'low' | 'medium' | 'high' | 'ultra';
  FRAME_RATE: number;
  DEBUG_MODE: boolean;
  ANALYTICS_ENABLED: boolean;
  ERROR_LOGGING_ENABLED: boolean;
  // AI Chatbot Configuration
  HUGGING_FACE_API_KEY?: string;
  AI_CHATBOT_ENABLED: boolean;
  AI_FALLBACK_MODE: boolean;
}

// Development configuration
const developmentConfig: EnvironmentConfig = {
  API_BASE_URL: __DEV__ ? 'http://localhost:8000' : 'https://api-dev.swaphealth.com',
  BACKEND_TIMEOUT: 30000, // 30 seconds
  ENABLE_POSE_ESTIMATION: true,
  ENABLE_VIDEO_ANALYSIS: true,
  ENABLE_REAL_TIME_FEEDBACK: true,
  MAX_VIDEO_SIZE_MB: 100,
  MAX_VIDEO_DURATION_SECONDS: 300, // 5 minutes
  CAMERA_QUALITY: 'medium',
  FRAME_RATE: 30,
  DEBUG_MODE: true,
  ANALYTICS_ENABLED: false,
  ERROR_LOGGING_ENABLED: true,
  // AI Chatbot Configuration
  HUGGING_FACE_API_KEY: process.env.HUGGING_FACE_API_KEY,
  AI_CHATBOT_ENABLED: true,
  AI_FALLBACK_MODE: true,
};

// Production configuration
const productionConfig: EnvironmentConfig = {
  API_BASE_URL: 'https://api.swaphealth.com',
  BACKEND_TIMEOUT: 60000, // 60 seconds
  ENABLE_POSE_ESTIMATION: true,
  ENABLE_VIDEO_ANALYSIS: true,
  ENABLE_REAL_TIME_FEEDBACK: true,
  MAX_VIDEO_SIZE_MB: 200,
  MAX_VIDEO_DURATION_SECONDS: 600, // 10 minutes
  CAMERA_QUALITY: 'high',
  FRAME_RATE: 30,
  DEBUG_MODE: false,
  ANALYTICS_ENABLED: true,
  CRASH_REPORTING_ENABLED: true,
  // AI Chatbot Configuration
  HUGGING_FACE_API_KEY: process.env.HUGGING_FACE_API_KEY,
  AI_CHATBOT_ENABLED: true,
  AI_FALLBACK_MODE: true,
};

// Staging configuration
const stagingConfig: EnvironmentConfig = {
  API_BASE_URL: 'https://api-staging.swaphealth.com',
  BACKEND_TIMEOUT: 45000, // 45 seconds
  ENABLE_POSE_ESTIMATION: true,
  ENABLE_VIDEO_ANALYSIS: true,
  ENABLE_REAL_TIME_FEEDBACK: true,
  MAX_VIDEO_SIZE_MB: 150,
  MAX_VIDEO_DURATION_SECONDS: 450, // 7.5 minutes
  CAMERA_QUALITY: 'high',
  FRAME_RATE: 30,
  DEBUG_MODE: false,
  ANALYTICS_ENABLED: true,
  CRASH_REPORTING_ENABLED: true,
  // AI Chatbot Configuration
  HUGGING_FACE_API_KEY: process.env.HUGGING_FACE_API_KEY,
  AI_CHATBOT_ENABLED: true,
  AI_FALLBACK_MODE: true,
};

// Feature flags for gradual rollout
export interface FeatureFlags {
  POSE_ESTIMATION_V2: boolean;
  ADVANCED_ANALYTICS: boolean;
  PROVIDER_DASHBOARD: boolean;
  EXERCISE_PRESCRIPTIONS: boolean;
  REAL_TIME_COACHING: boolean;
  OFFLINE_MODE: boolean;
  BETA_FEATURES: boolean;
  AI_HEALTH_CHATBOT: boolean;
}

const featureFlags: FeatureFlags = {
  POSE_ESTIMATION_V2: __DEV__ || false, // Enable in dev, controlled rollout in prod
  ADVANCED_ANALYTICS: true,
  PROVIDER_DASHBOARD: true,
  EXERCISE_PRESCRIPTIONS: true,
  REAL_TIME_COACHING: true,
  OFFLINE_MODE: true,
  BETA_FEATURES: __DEV__,
  AI_HEALTH_CHATBOT: true, // New AI chatbot feature
};

// Get current environment
function getCurrentEnvironment(): 'development' | 'staging' | 'production' {
  if (__DEV__) {
    return 'development';
  }
  
  // In a real app, you might check for environment variables or build configurations
  // For now, we'll assume production if not in dev mode
  return 'production';
}

// Get configuration based on environment
function getEnvironmentConfig(): EnvironmentConfig {
  const environment = getCurrentEnvironment();
  
  switch (environment) {
    case 'development':
      return developmentConfig;
    case 'staging':
      return stagingConfig;
    case 'production':
      return productionConfig;
    default:
      return developmentConfig;
  }
}

// Export current configuration
export const config = getEnvironmentConfig();
export const flags = featureFlags;
export const environment = getCurrentEnvironment();

// Validation function
export function validateConfiguration(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate API URL
  if (!config.API_BASE_URL || !config.API_BASE_URL.startsWith('http')) {
    errors.push('Invalid API_BASE_URL: must be a valid HTTP/HTTPS URL');
  }
  
  // Validate timeout
  if (config.BACKEND_TIMEOUT < 5000 || config.BACKEND_TIMEOUT > 120000) {
    errors.push('Invalid BACKEND_TIMEOUT: must be between 5000ms and 120000ms');
  }
  
  // Validate video constraints
  if (config.MAX_VIDEO_SIZE_MB < 10 || config.MAX_VIDEO_SIZE_MB > 500) {
    errors.push('Invalid MAX_VIDEO_SIZE_MB: must be between 10MB and 500MB');
  }
  
  if (config.MAX_VIDEO_DURATION_SECONDS < 30 || config.MAX_VIDEO_DURATION_SECONDS > 1800) {
    errors.push('Invalid MAX_VIDEO_DURATION_SECONDS: must be between 30s and 1800s');
  }
  
  // Validate frame rate
  if (config.FRAME_RATE < 15 || config.FRAME_RATE > 60) {
    errors.push('Invalid FRAME_RATE: must be between 15fps and 60fps');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Platform-specific adjustments
export function getPlatformConfig(): Partial<EnvironmentConfig> {
  const platformConfig: Partial<EnvironmentConfig> = {};
  
  if (Platform.OS === 'ios') {
    // iOS-specific optimizations
    platformConfig.CAMERA_QUALITY = config.CAMERA_QUALITY === 'ultra' ? 'high' : config.CAMERA_QUALITY;
    platformConfig.FRAME_RATE = Math.min(config.FRAME_RATE, 30); // iOS camera limitations
  } else if (Platform.OS === 'android') {
    // Android-specific optimizations
    platformConfig.MAX_VIDEO_SIZE_MB = Math.min(config.MAX_VIDEO_SIZE_MB, 150); // Android memory constraints
  }
  
  return platformConfig;
}

// Configuration logging (for debugging)
export function logConfiguration(): void {
  if (config.DEBUG_MODE) {
    console.log('🔧 Environment Configuration:', {
      environment,
      config: {
        ...config,
        ...getPlatformConfig()
      },
      flags,
      platform: Platform.OS,
      validation: validateConfiguration()
    });
  }
}

// Initialize configuration on app start
export function initializeConfiguration(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Log configuration in debug mode
      logConfiguration();
      
      // Validate configuration
      const validation = validateConfiguration();
      if (!validation.isValid) {
        console.error('❌ Configuration validation failed:', validation.errors);
        resolve(false);
        return;
      }
      
      console.log('✅ Configuration initialized successfully');
      resolve(true);
    } catch (error) {
      console.error('❌ Failed to initialize configuration:', error);
      resolve(false);
    }
  });
}

// Export utility functions
export const ConfigUtils = {
  getCurrentEnvironment,
  getEnvironmentConfig,
  validateConfiguration,
  getPlatformConfig,
  logConfiguration,
  initializeConfiguration
};
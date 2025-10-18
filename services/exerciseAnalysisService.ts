/**
 * Exercise Analysis Service
 * Handles pose analysis with improved error handling and warning management
 */

import { monitoringService } from './monitoringService';
import { config } from '../config/environment';

export interface PoseKeypoint {
  x: number;
  y: number;
  z: number;
  visibility: number;
  name?: string;
}

export interface PoseAnalysisResult {
  keypoints: PoseKeypoint[];
  confidence: number;
  formScore: number;
  currentRep: number;
  stage: string;
  warnings: string[];
  processingTime: number;
  success: boolean;
}

export interface ExerciseAnalysisConfig {
  exerciseType: string;
  confidenceThreshold: number;
  enableRealTimeFeedback: boolean;
  suppressWarnings: boolean;
}

class ExerciseAnalysisService {
  private static instance: ExerciseAnalysisService;
  private analysisCount = 0;
  private lastAnalysisTime = 0;
  private warningsSuppressed = false;

  private constructor() {
    this.initializeService();
  }

  static getInstance(): ExerciseAnalysisService {
    if (!ExerciseAnalysisService.instance) {
      ExerciseAnalysisService.instance = new ExerciseAnalysisService();
    }
    return ExerciseAnalysisService.instance;
  }

  private initializeService(): void {
    monitoringService.logInfo('exercise_analysis', 'Exercise analysis service initialized');
    
    // Check if we should suppress TensorFlow warnings
    this.warningsSuppressed = config.DEBUG_MODE === false;
    
    if (this.warningsSuppressed) {
      monitoringService.logInfo('exercise_analysis', 'TensorFlow warnings suppression enabled');
    }
  }

  /**
   * Analyze exercise frame with improved error handling
   */
  async analyzeFrame(
    frameData: string,
    exerciseType: string,
    config?: Partial<ExerciseAnalysisConfig>
  ): Promise<PoseAnalysisResult> {
    const startTime = Date.now();
    this.analysisCount++;

    const analysisConfig: ExerciseAnalysisConfig = {
      exerciseType,
      confidenceThreshold: 0.7,
      enableRealTimeFeedback: true,
      suppressWarnings: this.warningsSuppressed,
      ...config
    };

    try {
      monitoringService.logDebug('exercise_analysis', `Starting frame analysis for ${exerciseType}`, {
        analysisCount: this.analysisCount,
        frameSize: frameData.length
      });

      // Call backend API with improved error handling
      const response = await this.callBackendAnalysis(frameData, analysisConfig);
      
      const processingTime = Date.now() - startTime;
      this.lastAnalysisTime = processingTime;

      // Filter out TensorFlow warnings if suppression is enabled
      const filteredWarnings = this.filterWarnings(response.warnings, analysisConfig.suppressWarnings);

      const result: PoseAnalysisResult = {
        ...response,
        warnings: filteredWarnings,
        processingTime,
        success: true
      };

      // Record metrics
      monitoringService.recordPoseAnalysisMetric(
        'frame',
        processingTime,
        response.confidence,
        response.keypoints?.length,
        response.warnings
      );

      monitoringService.logDebug('exercise_analysis', 'Frame analysis completed', {
        confidence: response.confidence,
        formScore: response.formScore,
        stage: response.stage,
        processingTime
      });

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      monitoringService.logError('exercise_analysis', 'Frame analysis failed', error);
      
      // Return fallback result
      return this.getFallbackResult(exerciseType, processingTime);
    }
  }

  /**
   * Call backend analysis API with retry logic
   */
  private async callBackendAnalysis(
    frameData: string,
    config: ExerciseAnalysisConfig
  ): Promise<any> {
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`${config.API_BASE_URL || 'http://localhost:8000'}/api/analyze-frame`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            frame: frameData,
            exercise_type: config.exerciseType,
            confidence_threshold: config.confidenceThreshold
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Log successful analysis
        if (attempt > 1) {
          monitoringService.logInfo('exercise_analysis', `Analysis succeeded on attempt ${attempt}`);
        }

        return result;

      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          monitoringService.logWarn('exercise_analysis', `Analysis attempt ${attempt} failed, retrying in ${delay}ms`, error);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Analysis failed after all retries');
  }

  /**
   * Filter out unwanted warnings
   */
  private filterWarnings(warnings: string[], suppressWarnings: boolean): string[] {
    if (!warnings || !Array.isArray(warnings)) {
      return [];
    }

    if (!suppressWarnings) {
      return warnings;
    }

    // Filter out TensorFlow and MediaPipe warnings
    const filteredWarnings = warnings.filter(warning => {
      const warningLower = warning.toLowerCase();
      
      // Skip TensorFlow inference feedback manager warnings
      if (warningLower.includes('inference_feedback_manager')) {
        return false;
      }
      
      if (warningLower.includes('feedback manager requires')) {
        return false;
      }
      
      // Skip other TensorFlow warnings
      if (warningLower.includes('tensorflow') && warningLower.includes('warning')) {
        return false;
      }
      
      // Skip MediaPipe warnings
      if (warningLower.includes('mediapipe') && warningLower.includes('warning')) {
        return false;
      }

      return true;
    });

    return filteredWarnings;
  }

  /**
   * Get fallback result when analysis fails
   */
  private getFallbackResult(exerciseType: string, processingTime: number): PoseAnalysisResult {
    monitoringService.logWarn('exercise_analysis', 'Using fallback analysis result');

    return {
      keypoints: [],
      confidence: 0.5,
      formScore: 75,
      currentRep: 0,
      stage: 'rest',
      warnings: ['Analysis temporarily unavailable - using fallback mode'],
      processingTime,
      success: false
    };
  }

  /**
   * Get analysis statistics
   */
  getAnalysisStats(): {
    totalAnalyses: number;
    lastProcessingTime: number;
    averageProcessingTime: number;
    successRate: number;
  } {
    const metrics = monitoringService.getMetrics('pose_analysis', 100);
    const successfulAnalyses = metrics.filter(m => m.metadata?.success !== false);
    
    const averageProcessingTime = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length
      : 0;

    return {
      totalAnalyses: this.analysisCount,
      lastProcessingTime: this.lastAnalysisTime,
      averageProcessingTime,
      successRate: metrics.length > 0 ? (successfulAnalyses.length / metrics.length) * 100 : 0
    };
  }

  /**
   * Reset analysis statistics
   */
  resetStats(): void {
    this.analysisCount = 0;
    this.lastAnalysisTime = 0;
    monitoringService.clearMetrics();
    monitoringService.logInfo('exercise_analysis', 'Analysis statistics reset');
  }

  /**
   * Configure warning suppression
   */
  setWarningSuppression(suppress: boolean): void {
    this.warningsSuppressed = suppress;
    monitoringService.logInfo('exercise_analysis', `Warning suppression ${suppress ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if backend is available
   */
  async checkBackendHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${config.API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;

    } catch (error) {
      monitoringService.logWarn('exercise_analysis', 'Backend health check failed', error);
      return false;
    }
  }
}

export const exerciseAnalysisService = ExerciseAnalysisService.getInstance();
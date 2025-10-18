/**
 * Squat Analysis Service
 * Provides comprehensive squat tracking and form analysis
 */

import { monitoringService } from './monitoringService';
import { config } from '../config/environment';

export interface SquatMetrics {
  repCount: number;
  currentStage: 'up' | 'down' | 'transition';
  formScore: number;
  leftLegAngle: number;
  rightLegAngle: number;
  averageAngle: number;
  depth: 'shallow' | 'good' | 'excellent';
  warnings: string[];
  feedback: string[];
}

export interface SquatSessionStats {
  totalReps: number;
  averageFormScore: number;
  bestFormScore: number;
  totalDuration: number;
  caloriesBurned: number;
  improvements: string[];
}

export interface SquatAnalysisResult {
  success: boolean;
  metrics: SquatMetrics;
  processingTime: number;
  confidence: number;
  timestamp: string;
}

class SquatAnalysisService {
  private static instance: SquatAnalysisService;
  private sessionStartTime: number = 0;
  private sessionStats: SquatSessionStats = this.getDefaultStats();
  private lastAnalysisTime: number = 0;
  private analysisHistory: SquatAnalysisResult[] = [];
  private readonly MAX_HISTORY = 100;

  private constructor() {
    this.initializeService();
  }

  static getInstance(): SquatAnalysisService {
    if (!SquatAnalysisService.instance) {
      SquatAnalysisService.instance = new SquatAnalysisService();
    }
    return SquatAnalysisService.instance;
  }

  private initializeService(): void {
    monitoringService.logInfo('squat_analysis', 'Squat analysis service initialized');
  }

  private getDefaultStats(): SquatSessionStats {
    return {
      totalReps: 0,
      averageFormScore: 0,
      bestFormScore: 0,
      totalDuration: 0,
      caloriesBurned: 0,
      improvements: []
    };
  }

  /**
   * Start a new squat session
   */
  startSession(): void {
    this.sessionStartTime = Date.now();
    this.sessionStats = this.getDefaultStats();
    this.analysisHistory = [];
    
    monitoringService.logInfo('squat_analysis', 'New squat session started');
  }

  /**
   * End the current squat session
   */
  endSession(): SquatSessionStats {
    if (this.sessionStartTime > 0) {
      this.sessionStats.totalDuration = Date.now() - this.sessionStartTime;
      this.sessionStats.caloriesBurned = this.calculateCalories();
      this.sessionStats.improvements = this.generateImprovements();
    }

    monitoringService.logInfo('squat_analysis', 'Squat session ended', this.sessionStats);
    return { ...this.sessionStats };
  }

  /**
   * Analyze squat frame with comprehensive form checking
   */
  async analyzeSquatFrame(frameData: string): Promise<SquatAnalysisResult> {
    const startTime = Date.now();

    try {
      // Call backend for pose analysis
      const response = await this.callBackendAnalysis(frameData);
      
      const processingTime = Date.now() - startTime;
      this.lastAnalysisTime = processingTime;

      // Process the response into squat-specific metrics
      const metrics = this.processSquatMetrics(response);
      
      // Update session statistics
      this.updateSessionStats(metrics);

      const result: SquatAnalysisResult = {
        success: true,
        metrics,
        processingTime,
        confidence: response.confidence || 0.8,
        timestamp: new Date().toISOString()
      };

      // Store in history
      this.addToHistory(result);

      // Record monitoring metrics
      monitoringService.recordPoseAnalysisMetric(
        'frame',
        processingTime,
        metrics.formScore,
        33, // MediaPipe keypoints
        metrics.warnings
      );

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      monitoringService.logError('squat_analysis', 'Squat analysis failed', error);
      
      return {
        success: false,
        metrics: this.getFallbackMetrics(),
        processingTime,
        confidence: 0.0,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Call backend analysis API
   */
  private async callBackendAnalysis(frameData: string): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/analyze-frame`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frame: frameData,
          exercise_type: 'squat',
          confidence_threshold: 0.7
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Process backend response into squat-specific metrics
   */
  private processSquatMetrics(response: any): SquatMetrics {
    const keypoints = response.keypoints || [];
    
    // Calculate leg angles if keypoints are available
    let leftLegAngle = 90;
    let rightLegAngle = 90;
    
    if (keypoints.length >= 33) {
      // Calculate angles using hip-knee-ankle points
      leftLegAngle = this.calculateLegAngle(
        keypoints[23], // left hip
        keypoints[25], // left knee
        keypoints[27]  // left ankle
      );
      
      rightLegAngle = this.calculateLegAngle(
        keypoints[24], // right hip
        keypoints[26], // right knee
        keypoints[28]  // right ankle
      );
    }

    const averageAngle = (leftLegAngle + rightLegAngle) / 2;
    const depth = this.categorizeDepth(averageAngle);
    
    // Process warnings and feedback
    const warnings = this.processWarnings(response.warnings || []);
    const feedback = this.generateFeedback(averageAngle, response.stage, response.formScore);

    return {
      repCount: response.currentRep || 0,
      currentStage: this.mapStage(response.stage),
      formScore: response.formScore || 75,
      leftLegAngle,
      rightLegAngle,
      averageAngle,
      depth,
      warnings,
      feedback
    };
  }

  /**
   * Calculate leg angle from three keypoints
   */
  private calculateLegAngle(hip: any, knee: any, ankle: any): number {
    try {
      if (!hip || !knee || !ankle) return 90;

      // Vector from knee to hip
      const v1 = {
        x: hip.x - knee.x,
        y: hip.y - knee.y
      };

      // Vector from knee to ankle
      const v2 = {
        x: ankle.x - knee.x,
        y: ankle.y - knee.y
      };

      // Calculate angle using dot product
      const dot = v1.x * v2.x + v1.y * v2.y;
      const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
      const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

      if (mag1 === 0 || mag2 === 0) return 90;

      const cosAngle = dot / (mag1 * mag2);
      const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
      
      return Math.round(angle * (180 / Math.PI));

    } catch (error) {
      return 90; // Default angle
    }
  }

  /**
   * Categorize squat depth based on angle
   */
  private categorizeDepth(angle: number): 'shallow' | 'good' | 'excellent' {
    if (angle <= 70) return 'excellent';
    if (angle <= 90) return 'good';
    return 'shallow';
  }

  /**
   * Map backend stage to our stage format
   */
  private mapStage(stage: string): 'up' | 'down' | 'transition' {
    if (!stage) return 'up';
    
    const stageMap: { [key: string]: 'up' | 'down' | 'transition' } = {
      'up': 'up',
      'down': 'down',
      'hold': 'down',
      'transition': 'transition',
      'middle': 'transition',
      'descent': 'transition',
      'ascent': 'transition'
    };

    return stageMap[stage.toLowerCase()] || 'up';
  }

  /**
   * Process and filter warnings
   */
  private processWarnings(warnings: string[]): string[] {
    if (!Array.isArray(warnings)) return [];

    // Filter out technical warnings and keep only form-related ones
    return warnings.filter(warning => {
      const warningLower = warning.toLowerCase();
      return !warningLower.includes('tensorflow') &&
             !warningLower.includes('mediapipe') &&
             !warningLower.includes('inference') &&
             warning.length > 0;
    }).slice(0, 3); // Limit to 3 warnings
  }

  /**
   * Generate contextual feedback based on squat metrics
   */
  private generateFeedback(angle: number, stage: string, formScore: number): string[] {
    const feedback: string[] = [];

    // Depth feedback
    if (angle <= 70) {
      feedback.push("🎯 Excellent depth!");
    } else if (angle <= 90) {
      feedback.push("👍 Good depth!");
    } else if (stage === 'down') {
      feedback.push("Go deeper - aim for 90° knee angle");
    }

    // Stage-specific feedback
    if (stage === 'up' && angle > 160) {
      feedback.push("Ready position - start your squat");
    } else if (stage === 'down') {
      feedback.push("Hold the position - control the movement");
    }

    // Form score feedback
    if (formScore >= 90) {
      feedback.push("🔥 Perfect form!");
    } else if (formScore >= 80) {
      feedback.push("💪 Great form!");
    } else if (formScore < 70) {
      feedback.push("Focus on form improvements");
    }

    return feedback.slice(0, 2); // Limit to 2 feedback messages
  }

  /**
   * Update session statistics
   */
  private updateSessionStats(metrics: SquatMetrics): void {
    // Update rep count
    if (metrics.repCount > this.sessionStats.totalReps) {
      this.sessionStats.totalReps = metrics.repCount;
    }

    // Update form scores
    if (metrics.formScore > this.sessionStats.bestFormScore) {
      this.sessionStats.bestFormScore = metrics.formScore;
    }

    // Calculate running average of form scores
    const validAnalyses = this.analysisHistory.filter(a => a.success);
    if (validAnalyses.length > 0) {
      const totalScore = validAnalyses.reduce((sum, a) => sum + a.metrics.formScore, 0);
      this.sessionStats.averageFormScore = Math.round(totalScore / validAnalyses.length);
    }
  }

  /**
   * Calculate calories burned based on session data
   */
  private calculateCalories(): number {
    const durationMinutes = this.sessionStats.totalDuration / (1000 * 60);
    const baseCaloriesPerMinute = 8; // Approximate calories per minute for squats
    const repBonus = this.sessionStats.totalReps * 0.5; // Bonus calories per rep
    
    return Math.round(durationMinutes * baseCaloriesPerMinute + repBonus);
  }

  /**
   * Generate improvement suggestions
   */
  private generateImprovements(): string[] {
    const improvements: string[] = [];
    
    if (this.sessionStats.averageFormScore < 80) {
      improvements.push("Focus on maintaining proper form throughout the movement");
    }
    
    if (this.sessionStats.totalReps < 10) {
      improvements.push("Try to increase the number of reps gradually");
    }
    
    const depthAnalysis = this.analysisHistory.filter(a => a.metrics.depth === 'shallow');
    if (depthAnalysis.length > this.analysisHistory.length * 0.5) {
      improvements.push("Work on achieving greater squat depth");
    }

    if (improvements.length === 0) {
      improvements.push("Great session! Keep up the excellent work!");
    }

    return improvements;
  }

  /**
   * Get fallback metrics when analysis fails
   */
  private getFallbackMetrics(): SquatMetrics {
    return {
      repCount: 0,
      currentStage: 'up',
      formScore: 50,
      leftLegAngle: 90,
      rightLegAngle: 90,
      averageAngle: 90,
      depth: 'shallow',
      warnings: ['Analysis temporarily unavailable'],
      feedback: ['Please ensure full body is visible in camera']
    };
  }

  /**
   * Add result to analysis history
   */
  private addToHistory(result: SquatAnalysisResult): void {
    this.analysisHistory.push(result);
    
    // Maintain history size limit
    if (this.analysisHistory.length > this.MAX_HISTORY) {
      this.analysisHistory.shift();
    }
  }

  /**
   * Get current session statistics
   */
  getSessionStats(): SquatSessionStats {
    return { ...this.sessionStats };
  }

  /**
   * Get analysis history
   */
  getAnalysisHistory(): SquatAnalysisResult[] {
    return [...this.analysisHistory];
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    averageProcessingTime: number;
    successRate: number;
    totalAnalyses: number;
  } {
    const totalAnalyses = this.analysisHistory.length;
    const successfulAnalyses = this.analysisHistory.filter(a => a.success).length;
    const averageProcessingTime = totalAnalyses > 0
      ? this.analysisHistory.reduce((sum, a) => sum + a.processingTime, 0) / totalAnalyses
      : 0;

    return {
      averageProcessingTime: Math.round(averageProcessingTime),
      successRate: totalAnalyses > 0 ? Math.round((successfulAnalyses / totalAnalyses) * 100) : 0,
      totalAnalyses
    };
  }

  /**
   * Reset all data
   */
  reset(): void {
    this.sessionStartTime = 0;
    this.sessionStats = this.getDefaultStats();
    this.analysisHistory = [];
    this.lastAnalysisTime = 0;
    
    monitoringService.logInfo('squat_analysis', 'Squat analysis service reset');
  }
}

export const squatAnalysisService = SquatAnalysisService.getInstance();
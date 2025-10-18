// Example usage of Fitness Backend Service
import { fitnessBackendService, AnalysisResult, PoseData, ExerciseConfig } from './fitnessBackendService';

export class FitnessBackendServiceExample {
  
  // Example: Initialize and check backend health
  static async initializeService(): Promise<boolean> {
    console.log('🚀 Initializing Fitness Backend Service...');
    
    try {
      const initialized = await fitnessBackendService.initialize();
      
      if (initialized) {
        const isHealthy = await fitnessBackendService.checkBackendHealth();
        console.log(`Backend health status: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
        return isHealthy;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to initialize service:', error);
      return false;
    }
  }

  // Example: Upload video for analysis
  static async analyzeExerciseVideo(videoPath: string, exerciseType: string): Promise<AnalysisResult | null> {
    console.log(`📹 Analyzing ${exerciseType} video: ${videoPath}`);
    
    try {
      const result = await fitnessBackendService.uploadVideo(
        videoPath,
        exerciseType,
        (progress) => {
          console.log(`Upload progress: ${progress.percentage}%`);
        }
      );
      
      console.log('Analysis Results:');
      console.log(`- Session ID: ${result.sessionId}`);
      console.log(`- Total Reps: ${result.totalReps}`);
      console.log(`- Accuracy: ${result.accuracy}%`);
      console.log(`- Duration: ${result.duration}s`);
      console.log(`- Calories: ${result.calories}`);
      console.log(`- Recommendations: ${result.recommendations.join(', ')}`);
      
      return result;
      
    } catch (error) {
      console.error('Video analysis failed:', error);
      return null;
    }
  }

  // Example: Real-time frame analysis
  static async analyzeRealTimeFrame(frameData: string, exerciseType: string): Promise<PoseData | null> {
    try {
      const poseData = await fitnessBackendService.analyzeFrame(frameData, exerciseType);
      
      console.log('Real-time Analysis:');
      console.log(`- Confidence: ${poseData.confidence}`);
      console.log(`- Form Score: ${poseData.formScore}`);
      console.log(`- Current Rep: ${poseData.currentRep}`);
      console.log(`- Stage: ${poseData.stage}`);
      console.log(`- Warnings: ${poseData.warnings.join(', ')}`);
      
      return poseData;
      
    } catch (error) {
      console.error('Frame analysis failed:', error);
      return null;
    }
  }

  // Example: Get exercise configuration
  static async getExerciseSetup(exerciseType: string): Promise<ExerciseConfig | null> {
    console.log(`⚙️ Getting configuration for ${exerciseType}`);
    
    try {
      const config = await fitnessBackendService.getExerciseConfig(exerciseType);
      
      console.log('Exercise Configuration:');
      console.log(`- Target Keypoints: ${config.targetKeypoints.join(', ')}`);
      console.log(`- Min Confidence: ${config.thresholds.minConfidence}`);
      console.log(`- Form Accuracy: ${config.thresholds.formAccuracy}`);
      console.log(`- Frame Rate: ${config.parameters.frameRate}`);
      console.log(`- Real-time Feedback: ${config.feedback.realTimeEnabled}`);
      
      return config;
      
    } catch (error) {
      console.error('Failed to get exercise config:', error);
      return null;
    }
  }

  // Example: Submit session summary
  static async submitWorkoutSession(sessionData: {
    exerciseType: string;
    duration: number;
    totalReps: number;
    averageAccuracy: number;
    userId: string;
  }): Promise<boolean> {
    console.log('📊 Submitting workout session...');
    
    try {
      const result = await fitnessBackendService.submitSessionSummary(sessionData);
      
      console.log(`Session submitted with ID: ${result.sessionId}`);
      return true;
      
    } catch (error) {
      console.error('Failed to submit session:', error);
      return false;
    }
  }

  // Example: Monitor network status and queue
  static monitorServiceStatus(): void {
    console.log('📶 Monitoring service status...');
    
    // Check network status
    const networkStatus = fitnessBackendService.getNetworkStatus();
    console.log('Network Status:', networkStatus);
    
    // Check queued requests
    const queueCount = fitnessBackendService.getQueuedRequestsCount();
    console.log(`Queued requests: ${queueCount}`);
    
    // Check cache stats
    const cacheStats = fitnessBackendService.getCacheStats();
    console.log(`Cache: ${cacheStats.size} entries (${cacheStats.entries.join(', ')})`);
  }

  // Example: Complete workout flow
  static async completeWorkoutFlow(
    exerciseType: string,
    videoPath: string,
    userId: string
  ): Promise<void> {
    console.log(`🏋️ Starting complete workout flow for ${exerciseType}`);
    
    try {
      // 1. Initialize service
      const initialized = await this.initializeService();
      if (!initialized) {
        throw new Error('Failed to initialize backend service');
      }
      
      // 2. Get exercise configuration
      const config = await this.getExerciseSetup(exerciseType);
      if (!config) {
        throw new Error('Failed to get exercise configuration');
      }
      
      // 3. Analyze the workout video
      const analysis = await this.analyzeExerciseVideo(videoPath, exerciseType);
      if (!analysis) {
        throw new Error('Failed to analyze workout video');
      }
      
      // 4. Submit session summary
      const sessionSubmitted = await this.submitWorkoutSession({
        exerciseType,
        duration: analysis.duration,
        totalReps: analysis.totalReps,
        averageAccuracy: analysis.accuracy,
        userId
      });
      
      if (sessionSubmitted) {
        console.log('✅ Complete workout flow finished successfully!');
      } else {
        console.log('⚠️ Workout analyzed but session submission failed');
      }
      
    } catch (error) {
      console.error('❌ Workout flow failed:', error);
    }
  }
}

// Export for easy testing
export default FitnessBackendServiceExample;
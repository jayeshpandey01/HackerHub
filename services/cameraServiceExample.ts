/**
 * Example usage of CameraService for fitness backend integration
 * This file demonstrates how to use the camera service in components
 */

import { cameraService } from './cameraService';

export class CameraServiceExample {
  private cameraRef: any = null;
  private frameProcessor: any = null;
  private recordingStateManager: any = null;

  /**
   * Initialize camera service example
   */
  async initialize(cameraRef: any) {
    this.cameraRef = cameraRef;
    
    // Initialize camera service
    const initialized = await cameraService.initialize();
    if (!initialized) {
      throw new Error('Failed to initialize camera service');
    }

    // Create frame processor for real-time analysis
    this.frameProcessor = cameraService.createFrameProcessor();
    
    // Create recording state manager
    this.recordingStateManager = cameraService.createRecordingStateManager();

    console.log('CameraServiceExample: Initialized successfully');
  }

  /**
   * Example: Request permissions with user-friendly handling
   */
  async requestPermissionsWithFeedback(): Promise<boolean> {
    const result = await cameraService.requestPermissions();
    
    if (result.granted) {
      console.log('✅ Camera permissions granted');
      return true;
    } else {
      console.log('❌ Camera permissions denied:', result.message);
      
      if (!result.canAskAgain) {
        console.log('💡 Fallback options:', cameraService.getFallbackOptions());
      }
      
      return false;
    }
  }

  /**
   * Example: Start video recording with exercise-specific settings
   */
  async startExerciseRecording(exerciseType: string): Promise<boolean> {
    try {
      const config = {
        quality: 'medium' as const,
        maxDuration: 300, // 5 minutes
        enableAudio: true,
        frameRate: 30
      };

      const result = await cameraService.startVideoRecording(
        this.cameraRef,
        config,
        exerciseType
      );

      if (result.success && result.recordingId) {
        this.recordingStateManager.startRecording(result.recordingId);
        
        // Set up recording timer
        this.recordingStateManager.setRecordingTimer((duration: number) => {
          console.log(`Recording duration: ${duration}s`);
        });

        console.log('✅ Exercise recording started');
        return true;
      } else {
        console.log('❌ Failed to start recording:', result.message);
        return false;
      }
    } catch (error) {
      console.error('Error starting exercise recording:', error);
      return false;
    }
  }

  /**
   * Example: Stop recording and get video file
   */
  async stopExerciseRecording(): Promise<string | null> {
    try {
      const result = await cameraService.stopVideoRecording(this.cameraRef);
      
      if (result.success && result.filePath) {
        this.recordingStateManager.stopRecording();
        console.log('✅ Exercise recording completed:', result.message);
        return result.filePath;
      } else {
        console.log('❌ Failed to stop recording:', result.message);
        return null;
      }
    } catch (error) {
      console.error('Error stopping exercise recording:', error);
      return null;
    }
  }

  /**
   * Example: Start real-time pose analysis
   */
  async startRealTimePoseAnalysis(
    onPoseData: (frameData: string) => void
  ): Promise<{ stop: () => void } | null> {
    try {
      if (!this.frameProcessor) {
        throw new Error('Frame processor not initialized');
      }

      // Start continuous frame capture at 5 FPS for pose analysis
      const captureControl = this.frameProcessor.startContinuousCapture(
        this.cameraRef,
        (frameData: string) => {
          console.log('Frame captured for pose analysis');
          onPoseData(frameData);
        },
        5 // 5 FPS for real-time analysis
      );

      // Set up automatic frame processing
      const processingControl = this.frameProcessor.setupAutoProcessing(
        async (frameData: string) => {
          // This would typically send frame to backend for pose analysis
          console.log('Processing frame for pose analysis...');
          // await backendService.analyzeFrame(frameData, exerciseType);
        },
        1000 // Process every second
      );

      console.log('✅ Real-time pose analysis started');

      return {
        stop: () => {
          captureControl.stop();
          processingControl.stop();
          console.log('✅ Real-time pose analysis stopped');
        }
      };
    } catch (error) {
      console.error('Error starting real-time pose analysis:', error);
      return null;
    }
  }

  /**
   * Example: Capture single frame for analysis
   */
  async captureFrameForAnalysis(): Promise<string | null> {
    try {
      if (!this.frameProcessor) {
        throw new Error('Frame processor not initialized');
      }

      const result = await this.frameProcessor.captureFrame(this.cameraRef);
      
      if (result.success && result.frameData) {
        console.log('✅ Frame captured for analysis');
        return result.frameData;
      } else {
        console.log('❌ Failed to capture frame:', result.message);
        return null;
      }
    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    }
  }

  /**
   * Example: Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      // Clear frame processor queue
      if (this.frameProcessor) {
        this.frameProcessor.clearQueue();
      }

      // Stop any ongoing recording
      if (this.recordingStateManager?.isCurrentlyRecording()) {
        await this.stopExerciseRecording();
      }

      // Clean up temporary files
      await cameraService.cleanup();

      console.log('✅ Camera service cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Example: Get service status and statistics
   */
  getServiceStatus() {
    return {
      initialized: cameraService.isInitialized,
      permissions: cameraService.currentPermissions,
      capabilities: cameraService.currentCapabilities,
      hasRequiredPermissions: cameraService.hasRequiredPermissions,
      frameProcessorStats: this.frameProcessor?.getStats(),
      isRecording: this.recordingStateManager?.isCurrentlyRecording(),
      recordingDuration: this.recordingStateManager?.getRecordingDuration()
    };
  }
}

export const cameraServiceExample = new CameraServiceExample();
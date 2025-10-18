import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { CameraView, Camera } from 'expo-camera';
import { ExerciseType } from '../../services/simpleFitnessService';
import { cameraService } from '../../services/cameraService';
import { fitnessBackendService, PoseData, AnalysisResult } from '../../services/fitnessBackendService';
import PoseOverlay from './PoseOverlay';
import FeedbackSystem from './FeedbackSystem';
import SessionAnalysis from './SessionAnalysis';

const { width, height } = Dimensions.get('window');

interface CameraExerciseTrackerProps {
  exercise: ExerciseType;
  sets: number;
  reps: number;
  onComplete: (workoutData: any) => void;
  onCancel: () => void;
  poseEstimationEnabled?: boolean;
  userId?: string;
}

const CameraExerciseTracker: React.FC<CameraExerciseTrackerProps> = ({
  exercise,
  sets,
  reps,
  onComplete,
  onCancel,
  poseEstimationEnabled = false,
  userId = 'default'
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState('front');
  const [isRecording, setIsRecording] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentReps, setCurrentReps] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [exerciseTimer, setExerciseTimer] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  
  // Pose estimation state with smoothing and stability
  const [poseData, setPoseData] = useState<PoseData | null>(null);
  const [smoothedPoseData, setSmoothedPoseData] = useState<PoseData | null>(null);
  const [stableFrameCount, setStableFrameCount] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [frameProcessor, setFrameProcessor] = useState<any>(null);
  const [sessionData, setSessionData] = useState<any[]>([]);
  const [exerciseConfig, setExerciseConfig] = useState<any>(null);
  const [showPoseOverlay, setShowPoseOverlay] = useState(true);
  const [feedbackEnabled, setFeedbackEnabled] = useState(true);
  
  // Session recording state
  const [isRecordingSession, setIsRecordingSession] = useState(false);
  const [recordedVideoPath, setRecordedVideoPath] = useState<string | null>(null);
  const [showSessionAnalysis, setShowSessionAnalysis] = useState(false);
  const [finalAnalysisResult, setFinalAnalysisResult] = useState<AnalysisResult | null>(null);
  
  const cameraRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Pulsing animation for recording indicator
  useEffect(() => {
    if (isRecordingSession) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isRecordingSession, pulseAnim]);
  const frameProcessorRef = useRef<any>(null);

  useEffect(() => {
    requestCameraPermission();
    setWorkoutStartTime(new Date());
    
    // Start exercise timer
    timerRef.current = setInterval(() => {
      setExerciseTimer(prev => prev + 1);
    }, 1000);

    // Initialize pose estimation if enabled
    if (poseEstimationEnabled) {
      initializePoseEstimation();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (frameProcessorRef.current) {
        frameProcessorRef.current.stop();
      }
    };
  }, []);

  const initializePoseEstimation = async () => {
    try {
      console.log('Initializing pose estimation for exercise:', exercise.type);
      
      // Get exercise configuration from backend
      const config = await fitnessBackendService.getExerciseConfig(exercise.type);
      console.log('Exercise config loaded:', config);
      setExerciseConfig(config);
      
      // Initialize frame processor
      const processor = cameraService.createFrameProcessor();
      setFrameProcessor(processor);
      frameProcessorRef.current = processor;
      
      // Configure feedback settings
      setShowPoseOverlay(config.feedback.visualEnabled);
      setFeedbackEnabled(config.feedback.realTimeEnabled);
      
      // Start real-time frame analysis if enabled
      if (config.feedback.realTimeEnabled) {
        startRealTimeAnalysis(processor);
      }
      
    } catch (error) {
      console.error('Failed to initialize pose estimation:', error);
      Alert.alert(
        'Pose Analysis Unavailable',
        'Could not connect to pose estimation service. Using manual tracking.',
        [{ text: 'OK' }]
      );
    }
  };

  const startRealTimeAnalysis = (processor: any) => {
    if (!cameraRef.current) return;
    
    try {
      const continuousCapture = processor.startContinuousCapture(
        cameraRef.current,
        async (frameData: string) => {
          if (!isAnalyzing && poseEstimationEnabled) {
            await analyzeFrame(frameData);
          }
        },
        3 // 3 FPS for real-time analysis
      );
      
      // Store the stop function
      frameProcessorRef.current = {
        ...processor,
        stop: continuousCapture.stop
      };
    } catch (error) {
      console.log('Real-time analysis not available, continuing with basic tracking');
      // Continue without real-time analysis - the main functionality still works
      frameProcessorRef.current = {
        ...processor,
        stop: () => console.log('No continuous capture to stop')
      };
    }
  };

  const startSessionRecording = async () => {
    if (!cameraRef.current || isRecordingSession) return;
    
    try {
      const recordingResult = await cameraService.startVideoRecording(
        cameraRef.current,
        {
          quality: 'medium',
          maxDuration: 1800, // 30 minutes max
          enableAudio: false, // Disable audio for privacy
          frameRate: 30
        },
        exercise.type
      );
      
      if (recordingResult.success) {
        setIsRecordingSession(true);
        console.log('Session recording started');
      } else {
        Alert.alert('Recording Error', recordingResult.message);
      }
    } catch (error) {
      console.error('Failed to start session recording:', error);
      Alert.alert('Recording Error', 'Failed to start session recording');
    }
  };

  const stopSessionRecording = async () => {
    if (!cameraRef.current || !isRecordingSession) return;
    
    try {
      const recordingResult = await cameraService.stopVideoRecording(cameraRef.current);
      
      if (recordingResult.success && recordingResult.filePath) {
        setRecordedVideoPath(recordingResult.filePath);
        setIsRecordingSession(false);
        console.log('Session recording stopped:', recordingResult.filePath);
        
        // Optionally upload video for full analysis
        if (poseEstimationEnabled) {
          await uploadSessionVideo(recordingResult.filePath);
        }
      } else {
        Alert.alert('Recording Error', recordingResult.message);
      }
    } catch (error) {
      console.error('Failed to stop session recording:', error);
      Alert.alert('Recording Error', 'Failed to stop session recording');
    }
  };

  const uploadSessionVideo = async (videoPath: string) => {
    try {
      console.log('Uploading session video for analysis...');
      
      const analysisResult = await fitnessBackendService.uploadVideo(
        videoPath,
        exercise.type,
        (progress) => {
          console.log(`Upload progress: ${progress.percentage}%`);
        }
      );
      
      setFinalAnalysisResult(analysisResult);
      console.log('Video analysis completed:', analysisResult);
      
    } catch (error) {
      console.error('Failed to upload session video:', error);
      // Don't show error to user - they can still see real-time analysis
    }
  };

  // Enhanced smooth pose data with stability buffer
  const smoothPoseData = (newData: PoseData, prevData: PoseData | null): PoseData => {
    if (!prevData) {
      setStableFrameCount(1);
      return newData;
    }
    
    // Check if data is stable (similar to previous frame)
    const isStable = Math.abs(newData.formScore - prevData.formScore) < 10 && 
                    newData.stage === prevData.stage;
    
    if (isStable) {
      setStableFrameCount(prev => Math.min(prev + 1, 10));
    } else {
      setStableFrameCount(0);
    }
    
    // Only apply changes if we have stable frames or high confidence
    const shouldUpdate = stableFrameCount >= 2 || newData.confidence > 0.85;
    
    // Smooth form score changes (max 5 point change per frame)
    const maxScoreChange = shouldUpdate ? 5 : 2;
    const scoreDiff = newData.formScore - prevData.formScore;
    const smoothedScore = prevData.formScore + Math.max(-maxScoreChange, Math.min(maxScoreChange, scoreDiff));
    
    // Only change stage if confidence is high and change makes sense
    let smoothedStage = newData.stage;
    if (newData.confidence < 0.7 || !shouldUpdate) {
      smoothedStage = prevData.stage; // Keep previous stage if low confidence or unstable
    }
    
    // Prevent rapid stage oscillation with valid transitions
    const stageTransitions: Record<string, string[]> = {
      'rest': ['up', 'down'],
      'up': ['down', 'rest'],
      'down': ['hold', 'up'],
      'hold': ['up', 'rest']
    };
    
    if (!stageTransitions[prevData.stage]?.includes(newData.stage)) {
      smoothedStage = prevData.stage; // Invalid transition, keep previous
    }
    
    return {
      ...newData,
      formScore: Math.round(smoothedScore),
      stage: smoothedStage,
      confidence: Math.max(0.6, Math.min(0.95, newData.confidence)), // Clamp confidence
      warnings: stableFrameCount >= 3 ? newData.warnings : prevData.warnings // Only update warnings when stable
    };
  };

  const analyzeFrame = async (frameData: string) => {
    if (isAnalyzing || isResting) return;
    
    try {
      setIsAnalyzing(true);
      
      const result = await fitnessBackendService.analyzeFrame(frameData, exercise.type);
      
      // Apply smoothing to prevent jumpy UI updates
      const smoothedResult = smoothPoseData(result, poseData);
      setPoseData(smoothedResult);
      setSmoothedPoseData(smoothedResult);
      
      // Update rep count based on pose analysis (only increase, never decrease)
      if (result.currentRep > currentReps) {
        setCurrentReps(result.currentRep);
      }
      
      // Store session data for analysis
      setSessionData(prev => [...prev, {
        timestamp: Date.now(),
        poseData: result,
        set: currentSet,
        rep: currentReps
      }]);
      
    } catch (error) {
      console.error('Frame analysis failed:', error);
      // Don't show error to user for real-time analysis failures
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    // Handle rest timer
    let restInterval: NodeJS.Timeout;
    if (isResting && restTimer > 0) {
      restInterval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (restInterval) {
        clearInterval(restInterval);
      }
    };
  }, [isResting, restTimer]);

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'This app needs camera access to track your exercises. Please enable camera permissions in your device settings.',
          [
            { text: 'Cancel', onPress: onCancel },
            { text: 'Settings', onPress: () => {
              // In a real app, you might open device settings
              Alert.alert('Please enable camera permissions in your device settings');
            }}
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
    }
  };

  const toggleCameraType = () => {
    setCameraType(current => 
      current === 'back' ? 'front' : 'back'
    );
  };

  const handleRepComplete = () => {
    if (currentReps < reps) {
      setCurrentReps(prev => prev + 1);
    } else {
      // Set complete
      if (currentSet < sets) {
        setCurrentSet(prev => prev + 1);
        setCurrentReps(0);
        startRestPeriod();
      } else {
        // Workout complete
        completeWorkout();
      }
    }
  };

  const startRestPeriod = () => {
    setIsResting(true);
    setRestTimer(30); // 30 second rest
    
    Alert.alert(
      'Set Complete!',
      `Great job! Rest for 30 seconds before starting set ${currentSet}.`,
      [{ text: 'OK' }]
    );
  };

  const completeWorkout = async () => {
    // Stop session recording if active
    if (isRecordingSession) {
      await stopSessionRecording();
    }
    
    // Stop frame processing
    if (frameProcessorRef.current) {
      frameProcessorRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    let workoutData = {
      exercise: exercise,
      sets: sets,
      reps: reps,
      duration: exerciseTimer,
      calories: Math.round((exercise.calories * exerciseTimer) / (exercise.duration * 60)),
      completedAt: new Date(),
      startedAt: workoutStartTime,
      poseAnalysis: finalAnalysisResult,
      sessionData: sessionData,
      recordedVideoPath: recordedVideoPath
    };

    // If pose estimation was enabled, submit session summary
    if (poseEstimationEnabled && sessionData.length > 0) {
      try {
        const averageAccuracy = sessionData.reduce((acc, data) => acc + (data.poseData?.formScore || 0), 0) / sessionData.length;
        
        const sessionSummary = await fitnessBackendService.submitSessionSummary({
          exerciseType: exercise.type,
          duration: exerciseTimer,
          totalReps: currentReps + (currentSet - 1) * reps,
          averageAccuracy,
          userId
        });
        
        if (!finalAnalysisResult) {
          workoutData.poseAnalysis = sessionSummary;
        }
        console.log('Session summary submitted:', sessionSummary);
        
      } catch (error) {
        console.error('Failed to submit session summary:', error);
      }
    }

    // Show session analysis before completing
    if (poseEstimationEnabled && (sessionData.length > 0 || finalAnalysisResult)) {
      setShowSessionAnalysis(true);
    } else {
      onComplete(workoutData);
    }
  };

  const handleSessionAnalysisClose = () => {
    setShowSessionAnalysis(false);
    
    const workoutData = {
      exercise: exercise,
      sets: sets,
      reps: reps,
      duration: exerciseTimer,
      calories: Math.round((exercise.calories * exerciseTimer) / (exercise.duration * 60)),
      completedAt: new Date(),
      startedAt: workoutStartTime,
      poseAnalysis: finalAnalysisResult,
      sessionData: sessionData,
      recordedVideoPath: recordedVideoPath
    };
    
    onComplete(workoutData);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getExerciseInstructions = () => {
    switch (exercise.type) {
      case 'squat':
        return 'Stand with feet shoulder-width apart. Lower down as if sitting in a chair, then stand back up.';
      case 'push_up':
        return 'Start in plank position. Lower your chest to the ground, then push back up.';
      case 'hammer_curl':
        return 'Hold weights with palms facing each other. Curl up towards shoulders, then lower.';
      case 'chair_yoga':
        return 'Sit comfortably and follow the gentle stretching movements.';
      case 'breathing_exercise':
        return 'Breathe slowly and deeply. Focus on expanding your diaphragm.';
      default:
        return 'Follow the exercise form and count your repetitions.';
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <FontAwesome5 name="camera" size={60} color="#667eea" />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <FontAwesome5 name="camera" size={60} color="#F44336" style={{ opacity: 0.5 }} />
        <Text style={styles.permissionText}>Camera access denied</Text>
        <Text style={styles.permissionSubtext}>
          Enable camera permissions to use exercise tracking
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={requestCameraPermission}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraType}
        />
        
        {/* Camera Overlay - Now positioned absolutely */}
        <View style={styles.cameraOverlay}>
            {/* Enhanced Top Bar */}
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <FontAwesome5 name="times" size={20} color="#fff" />
              </TouchableOpacity>
              
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <View style={styles.timerContainer}>
                  <Text style={styles.exerciseTimer}>{formatTime(exerciseTimer)}</Text>
                  {isRecordingSession && (
                    <View style={styles.recordingIndicator}>
                      <Animated.View 
                        style={[
                          styles.recordingDot, 
                          styles.recordingPulse,
                          { transform: [{ scale: pulseAnim }] }
                        ]} 
                      />
                      <Text style={styles.recordingText}>RECORDING</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.topRightControls}>
                {poseEstimationEnabled && (
                  <>
                    <TouchableOpacity 
                      style={[styles.controlButton, styles.enhancedControlButton, { 
                        backgroundColor: showPoseOverlay ? '#4CAF50' : 'rgba(255, 255, 255, 0.2)',
                        borderWidth: showPoseOverlay ? 2 : 0,
                        borderColor: '#4CAF50'
                      }]} 
                      onPress={() => setShowPoseOverlay(!showPoseOverlay)}
                    >
                      <FontAwesome5 name="eye" size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.controlButton, styles.enhancedControlButton, { 
                        backgroundColor: isRecordingSession ? '#F44336' : 'rgba(255, 255, 255, 0.2)',
                        borderWidth: isRecordingSession ? 2 : 0,
                        borderColor: '#F44336'
                      }]} 
                      onPress={isRecordingSession ? stopSessionRecording : startSessionRecording}
                    >
                      <FontAwesome5 name={isRecordingSession ? "stop" : "video"} size={16} color="#fff" />
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity style={[styles.controlButton, styles.enhancedControlButton]} onPress={toggleCameraType}>
                  <FontAwesome5 name="sync-alt" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Recording Status Banner */}
            {isRecordingSession && (
              <View style={styles.recordingBanner}>
                <View style={styles.recordingBannerContent}>
                  <Animated.View 
                    style={[
                      styles.recordingDot, 
                      styles.recordingPulse,
                      { transform: [{ scale: pulseAnim }] }
                    ]} 
                  />
                  <View style={styles.recordingBannerTextContainer}>
                    <Text style={styles.recordingBannerText}>Recording in progress...</Text>
                    <Text style={styles.recordingBannerSubtext}>Your workout is being captured</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Pose Estimation Overlay */}
            {poseEstimationEnabled && showPoseOverlay && smoothedPoseData && (
              <PoseOverlay
                poseData={smoothedPoseData}
                exerciseType={exercise.type}
                isVisible={!isResting}
              />
            )}

            {/* Real-time Feedback System */}
            {poseEstimationEnabled && feedbackEnabled && smoothedPoseData && (
              <FeedbackSystem
                poseData={smoothedPoseData}
                exerciseType={exercise.type}
                isEnabled={!isResting}
                audioEnabled={exerciseConfig?.feedback?.audioEnabled}
                visualEnabled={exerciseConfig?.feedback?.visualEnabled}
                hapticEnabled={true}
              />
            )}

            {/* Center Instructions */}
            <View style={styles.centerInstructions}>
              {isResting ? (
                <View style={styles.restContainer}>
                  <Text style={styles.restTitle}>Rest Time</Text>
                  <Text style={styles.restTimer}>{restTimer}s</Text>
                  <Text style={styles.restSubtitle}>Get ready for set {currentSet}</Text>
                </View>
              ) : (
                <View style={styles.instructionsContainer}>
                  <Text style={styles.instructions}>{getExerciseInstructions()}</Text>
                  {poseEstimationEnabled && (
                    <View style={styles.poseStatusContainer}>
                      <FontAwesome5 
                        name={isAnalyzing ? "spinner" : "brain"} 
                        size={16} 
                        color={isAnalyzing ? "#FF9800" : "#4CAF50"} 
                      />
                      <Text style={styles.poseStatusText}>
                        {isAnalyzing ? "Analyzing..." : "AI Analysis Active"}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Enhanced Bottom Controls */}
            <View style={styles.bottomControls}>
              {/* Progress Indicators */}
              <View style={styles.progressContainer}>
                <View style={styles.progressItem}>
                  <View style={styles.progressCircle}>
                    <Text style={styles.progressValue}>{currentSet}</Text>
                    <Text style={styles.progressTotal}>/{sets}</Text>
                  </View>
                  <Text style={styles.progressLabel}>Sets</Text>
                </View>
                
                {/* Enhanced Rep Button */}
                <TouchableOpacity 
                  style={[
                    styles.repButton, 
                    styles.enhancedRepButton,
                    isResting && styles.repButtonDisabled,
                    poseEstimationEnabled && styles.repButtonAI
                  ]} 
                  onPress={handleRepComplete}
                  disabled={isResting}
                >
                  <View style={styles.repButtonInner}>
                    <FontAwesome5 
                      name={poseEstimationEnabled ? "brain" : "plus"} 
                      size={28} 
                      color="#fff" 
                    />
                    <Text style={styles.repButtonText}>
                      {poseEstimationEnabled ? "AI Count" : "Count Rep"}
                    </Text>
                    {poseEstimationEnabled && (
                      <View style={styles.aiIndicator}>
                        <Text style={styles.aiIndicatorText}>AI</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                
                <View style={styles.progressItem}>
                  <View style={styles.progressCircle}>
                    <Text style={styles.progressValue}>{currentReps}</Text>
                    <Text style={styles.progressTotal}>/{reps}</Text>
                  </View>
                  <Text style={styles.progressLabel}>Reps</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.overallProgressContainer}>
                <View style={styles.progressBarBackground}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${((currentSet - 1) * reps + currentReps) / (sets * reps) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(((currentSet - 1) * reps + currentReps) / (sets * reps) * 100)}% Complete
                </Text>
              </View>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.pauseButton} onPress={() => {
                  Alert.alert(
                    'Pause Workout',
                    'Take a break? Your progress will be saved.',
                    [
                      { text: 'Continue', style: 'cancel' },
                      { text: 'End Workout', onPress: completeWorkout }
                    ]
                  );
                }}>
                  <FontAwesome5 name="pause" size={16} color="#fff" />
                  <Text style={styles.pauseButtonText}>Pause</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
      </View>

      {/* Session Analysis Modal */}
      <SessionAnalysis
        isVisible={showSessionAnalysis}
        onClose={handleSessionAnalysisClose}
        analysisResult={finalAnalysisResult}
        sessionData={sessionData}
        exercise={exercise}
        workoutDuration={exerciseTimer}
        totalReps={currentReps + (currentSet - 1) * reps}
        sets={sets}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  permissionSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseInfo: {
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timerContainer: {
    alignItems: 'center',
  },
  exerciseTimer: {
    fontSize: 14,
    color: '#fff',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F44336',
    marginRight: 6,
  },
  recordingPulse: {
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  recordingText: {
    fontSize: 11,
    color: '#F44336',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  enhancedControlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  recordingBanner: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    borderRadius: 12,
    padding: 12,
    zIndex: 10,
  },
  recordingBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingBannerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  recordingBannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  recordingBannerSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  centerInstructions: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    padding: 20,
    maxWidth: width * 0.8,
  },
  instructions: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },
  poseStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 12,
  },
  poseStatusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 6,
  },

  restContainer: {
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    minWidth: 200,
  },
  restTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  restTimer: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  restSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  bottomControls: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingBottom: 50,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  progressTotal: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  repButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  enhancedRepButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#667eea',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  repButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  repButtonDisabled: {
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
  },
  repButtonAI: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
  },
  repButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
    textAlign: 'center',
  },
  aiIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#fff',
  },
  aiIndicatorText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: '700',
  },
  overallProgressContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  pauseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default CameraExerciseTracker;
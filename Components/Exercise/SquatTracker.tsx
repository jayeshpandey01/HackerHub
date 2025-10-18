import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import { squatAnalysisService, SquatMetrics, SquatSessionStats } from '../../services/squatAnalysisService';
import { monitoringService } from '../../services/monitoringService';

const { width, height } = Dimensions.get('window');

interface SquatTrackerProps {
  onWorkoutComplete?: (stats: SquatSessionStats) => void;
  onBack?: () => void;
}

const SquatTracker: React.FC<SquatTrackerProps> = ({ onWorkoutComplete, onBack }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [metrics, setMetrics] = useState<SquatMetrics>({
    repCount: 0,
    currentStage: 'up',
    formScore: 100,
    leftLegAngle: 90,
    rightLegAngle: 90,
    averageAngle: 90,
    depth: 'shallow',
    warnings: [],
    feedback: []
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);

  const cameraRef = useRef<Camera>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    requestCameraPermission();
    return () => {
      stopAnalysis();
      stopSessionTimer();
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission to use squat tracking.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      monitoringService.logError('squat_tracker', 'Camera permission error', error);
      setHasPermission(false);
    }
  };

  const startSession = () => {
    squatAnalysisService.startSession();
    setSessionStarted(true);
    setSessionTime(0);
    setIsActive(true);
    
    // Start session timer
    sessionTimerRef.current = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    // Start analysis
    startAnalysis();
    
    monitoringService.logInfo('squat_tracker', 'Squat session started');
  };

  const stopSession = () => {
    setIsActive(false);
    setSessionStarted(false);
    stopAnalysis();
    stopSessionTimer();
    
    const stats = squatAnalysisService.endSession();
    
    monitoringService.logInfo('squat_tracker', 'Squat session ended', stats);
    
    if (onWorkoutComplete) {
      onWorkoutComplete(stats);
    }
  };

  const startAnalysis = () => {
    if (analysisIntervalRef.current) return;

    analysisIntervalRef.current = setInterval(async () => {
      await captureAndAnalyze();
    }, 1000); // Analyze every second
  };

  const stopAnalysis = () => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
  };

  const stopSessionTimer = () => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  };

  const captureAndAnalyze = async () => {
    if (!cameraRef.current || isAnalyzing) return;

    try {
      setIsAnalyzing(true);

      // Capture frame
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
        skipProcessing: true,
      });

      if (photo.base64) {
        // Analyze the frame
        const result = await squatAnalysisService.analyzeSquatFrame(photo.base64);
        
        if (result.success) {
          setMetrics(result.metrics);
        }
      }

    } catch (error) {
      monitoringService.logError('squat_tracker', 'Frame analysis error', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStageColor = (stage: string): string => {
    switch (stage) {
      case 'up': return '#4CAF50';
      case 'down': return '#FF9800';
      case 'transition': return '#2196F3';
      default: return '#666';
    }
  };

  const getDepthColor = (depth: string): string => {
    switch (depth) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#FF9800';
      case 'shallow': return '#F44336';
      default: return '#666';
    }
  };

  const getFormScoreColor = (score: number): string => {
    if (score >= 90) return '#4CAF50';
    if (score >= 80) return '#FF9800';
    if (score >= 70) return '#FFC107';
    return '#F44336';
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <FontAwesome5 name="camera" size={48} color="#ccc" />
        <Text style={styles.errorText}>Camera permission denied</Text>
        <TouchableOpacity style={styles.retryButton} onPress={requestCameraPermission}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <FontAwesome5 name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Squat Tracker</Text>
        <View style={styles.headerRight}>
          <Text style={styles.timerText}>{formatTime(sessionTime)}</Text>
        </View>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={Camera.Constants.Type.front}
          ratio="16:9"
        >
          {/* Overlay with pose guidance */}
          <View style={styles.overlay}>
            {/* Rep Counter */}
            <View style={styles.repCounter}>
              <Text style={styles.repCountText}>{metrics.repCount}</Text>
              <Text style={styles.repLabel}>REPS</Text>
            </View>

            {/* Stage Indicator */}
            <View style={[styles.stageIndicator, { backgroundColor: getStageColor(metrics.currentStage) }]}>
              <Text style={styles.stageText}>{metrics.currentStage.toUpperCase()}</Text>
            </View>

            {/* Analysis Indicator */}
            {isAnalyzing && (
              <View style={styles.analysisIndicator}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.analysisText}>Analyzing...</Text>
              </View>
            )}
          </View>
        </Camera>
      </View>

      {/* Metrics Panel */}
      <View style={styles.metricsPanel}>
        <View style={styles.metricsRow}>
          {/* Form Score */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Form Score</Text>
            <Text style={[styles.metricValue, { color: getFormScoreColor(metrics.formScore) }]}>
              {Math.round(metrics.formScore)}%
            </Text>
          </View>

          {/* Depth */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Depth</Text>
            <Text style={[styles.metricValue, { color: getDepthColor(metrics.depth) }]}>
              {metrics.depth.toUpperCase()}
            </Text>
          </View>

          {/* Average Angle */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Angle</Text>
            <Text style={styles.metricValue}>{Math.round(metrics.averageAngle)}°</Text>
          </View>
        </View>

        {/* Feedback */}
        <View style={styles.feedbackContainer}>
          {metrics.feedback.length > 0 ? (
            metrics.feedback.map((feedback, index) => (
              <Text key={index} style={styles.feedbackText}>
                {feedback}
              </Text>
            ))
          ) : (
            <Text style={styles.feedbackText}>Position yourself in front of the camera</Text>
          )}
        </View>

        {/* Warnings */}
        {metrics.warnings.length > 0 && (
          <View style={styles.warningsContainer}>
            {metrics.warnings.map((warning, index) => (
              <Text key={index} style={styles.warningText}>
                ⚠️ {warning}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {!sessionStarted ? (
          <TouchableOpacity style={styles.startButton} onPress={startSession}>
            <FontAwesome5 name="play" size={20} color="#fff" />
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopButton} onPress={stopSession}>
            <FontAwesome5 name="stop" size={20} color="#fff" />
            <Text style={styles.stopButtonText}>End Workout</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    position: 'relative',
  },
  repCounter: {
    position: 'absolute',
    top: 20,
    left: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    padding: 15,
  },
  repCountText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4CAF50',
  },
  repLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
  },
  stageIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  stageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  analysisIndicator: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  analysisText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 8,
  },
  metricsPanel: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  feedbackContainer: {
    marginBottom: 10,
  },
  feedbackText: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 4,
  },
  warningsContainer: {
    marginTop: 5,
  },
  warningText: {
    fontSize: 12,
    color: '#FF9800',
    textAlign: 'center',
    marginBottom: 2,
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 15,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 10,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    borderRadius: 25,
    paddingVertical: 15,
  },
  stopButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 10,
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 20,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default SquatTracker;
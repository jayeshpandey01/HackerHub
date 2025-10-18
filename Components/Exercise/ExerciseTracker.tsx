import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Dimensions,
  Switch,
} from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { simpleFitnessService, ExerciseType } from '../../services/simpleFitnessService';
import MockCameraTracker from './MockCameraTracker';
import CameraExerciseTracker from './CameraExerciseTracker';
import { cameraService } from '../../services/cameraService';
import { fitnessBackendService } from '../../services/fitnessBackendService';

const { width, height } = Dimensions.get('window');

interface ExerciseTrackerProps {
  userId: string;
  medicalProfile: any;
  onWorkoutComplete?: (workoutData: any) => void;
}

const ExerciseTracker: React.FC<ExerciseTrackerProps> = ({
  userId,
  medicalProfile,
  onWorkoutComplete
}) => {
  const [exercises, setExercises] = useState<ExerciseType[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType | null>(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showCameraTracker, setShowCameraTracker] = useState(false);
  const [workoutSettings, setWorkoutSettings] = useState({
    sets: 3,
    reps: 10
  });
  
  // Camera mode state
  const [cameraMode, setCameraMode] = useState(false);
  const [poseEstimationEnabled, setPoseEstimationEnabled] = useState(false);
  const [cameraPermissions, setCameraPermissions] = useState<any>(null);
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    loadExercises();
    initializeServices();
  }, []);

  const initializeServices = async () => {
    try {
      setIsInitializing(true);
      
      // Check camera permissions
      const permissions = await cameraService.checkPermissions();
      setCameraPermissions(permissions);
      
      // Initialize fitness backend service
      const backendInitialized = await fitnessBackendService.initialize();
      if (backendInitialized) {
        const healthCheck = await fitnessBackendService.checkBackendHealth();
        setBackendAvailable(healthCheck);
      }
      
      // Enable pose estimation if both camera and backend are available
      const canUsePoseEstimation = permissions.camera && permissions.microphone && backendInitialized;
      setPoseEstimationEnabled(canUsePoseEstimation);
      setCameraMode(canUsePoseEstimation);
      
      console.log('ExerciseTracker: Services initialized', {
        cameraPermissions: permissions,
        backendAvailable: backendInitialized,
        poseEstimationEnabled: canUsePoseEstimation
      });
      
    } catch (error) {
      console.error('ExerciseTracker: Error initializing services:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const loadExercises = () => {
    const availableExercises = simpleFitnessService.getAvailableExercises();
    setExercises(availableExercises);
  };

  const handleExerciseSelect = (exercise: ExerciseType) => {
    setSelectedExercise(exercise);
    setShowExerciseModal(true);
  };

  const startExercise = async () => {
    if (!selectedExercise) return;

    // If camera mode is enabled, check permissions first
    if (cameraMode) {
      const hasPermissions = await requestCameraPermissionsIfNeeded();
      if (!hasPermissions) {
        Alert.alert(
          'Camera Permissions Required',
          'Camera access is needed for pose estimation. You can still use manual tracking mode.',
          [
            { text: 'Use Manual Mode', onPress: () => startManualMode() },
            { text: 'Grant Permissions', onPress: () => requestCameraPermissions() }
          ]
        );
        return;
      }
    }

    setShowExerciseModal(false);
    setShowCameraTracker(true);
  };

  const startManualMode = () => {
    setCameraMode(false);
    setPoseEstimationEnabled(false);
    setShowExerciseModal(false);
    setShowCameraTracker(true);
  };

  const requestCameraPermissionsIfNeeded = async (): Promise<boolean> => {
    if (!cameraPermissions?.camera || !cameraPermissions?.microphone) {
      return await requestCameraPermissions();
    }
    return true;
  };

  const requestCameraPermissions = async (): Promise<boolean> => {
    try {
      const result = await cameraService.requestPermissions();
      
      if (result.granted) {
        // Re-initialize services to update all states
        await initializeServices();
        Alert.alert('Success!', 'Camera permissions granted. You can now use pose analysis features.');
        return true;
      } else {
        setCameraPermissions(cameraService.currentPermissions);
        Alert.alert(
          'Permissions Required', 
          result.message + '\n\nIf you denied permissions, you can enable them manually in device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openDeviceSettings }
          ]
        );
        return false;
      }
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      Alert.alert('Error', 'Failed to request camera permissions');
      return false;
    }
  };

  const openDeviceSettings = () => {
    Alert.alert(
      'Enable Camera Permissions',
      'To enable camera permissions:\n\n' +
      '1. Go to your device Settings\n' +
      '2. Find this app in the app list\n' +
      '3. Tap on Permissions\n' +
      '4. Enable Camera and Microphone\n' +
      '5. Return to the app and try again',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'I Enabled Them', onPress: refreshPermissions }
      ]
    );
  };

  const refreshPermissions = async () => {
    console.log('Refreshing permissions...');
    await initializeServices();
  };

  const stopExercise = () => {
    setShowCameraTracker(false);

    if (onWorkoutComplete) {
      onWorkoutComplete({
        exercise: selectedExercise,
        sets: workoutSettings.sets,
        reps: workoutSettings.reps,
        completed: true
      });
    }

    Alert.alert(
      'Workout Complete!',
      'Great job! Your workout has been logged.',
      [{ text: 'OK' }]
    );
  };

  const handleCameraWorkoutComplete = (workoutData: any) => {
    setShowCameraTracker(false);

    // Log the workout
    simpleFitnessService.logWorkout({
      userId,
      exerciseType: workoutData.exercise.type,
      sets: workoutData.sets,
      reps: workoutData.totalReps || workoutData.sets * workoutSettings.reps,
      duration: workoutData.duration,
      calories: workoutData.exercise.calories,
      date: new Date().toISOString(),
      completed: true
    });

    if (onWorkoutComplete) {
      onWorkoutComplete(workoutData);
    }

    Alert.alert(
      'Workout Complete!',
      `Great job! You completed ${workoutData.sets} sets of ${workoutData.exercise.name}. Duration: ${Math.floor(workoutData.duration / 60)}:${(workoutData.duration % 60).toString().padStart(2, '0')}`,
      [{ text: 'OK' }]
    );
  };

  const handleCameraWorkoutCancel = () => {
    setShowCameraTracker(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#667eea';
    }
  };

  const getExerciseIcon = (type: string) => {
    switch (type) {
      case 'squat': return 'user-friends';
      case 'push_up': return 'hand-paper';
      case 'hammer_curl': return 'dumbbell';
      case 'chair_yoga': return 'leaf';
      case 'breathing_exercise': return 'wind';
      default: return 'running';
    }
  };

  const renderExerciseCard = (exercise: ExerciseType) => (
    <TouchableOpacity
      key={exercise.id}
      style={styles.exerciseCard}
      onPress={() => handleExerciseSelect(exercise)}
    >
      <View style={styles.exerciseHeader}>
        <View style={[styles.exerciseIcon, { backgroundColor: `${getDifficultyColor(exercise.difficulty)}20` }]}>
          <FontAwesome5 
            name={getExerciseIcon(exercise.type)} 
            size={24} 
            color={getDifficultyColor(exercise.difficulty)} 
          />
        </View>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseTitle}>{exercise.name}</Text>
          <Text style={styles.exerciseDifficulty}>{exercise.difficulty}</Text>
        </View>
        <View style={styles.exerciseStats}>
          <Text style={styles.exerciseDuration}>{exercise.duration}min</Text>
          <Text style={styles.exerciseCalories}>{exercise.calories} cal</Text>
        </View>
      </View>
      <Text style={styles.exerciseDescription}>{exercise.description}</Text>
      <View style={styles.exerciseMuscles}>
        {exercise.targetMuscles.slice(0, 3).map((muscle, index) => (
          <View key={index} style={styles.muscleTag}>
            <Text style={styles.muscleText}>{muscle}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  const renderExerciseModal = () => (
    <Modal
      visible={showExerciseModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowExerciseModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedExercise?.name}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowExerciseModal(false)}
            >
              <FontAwesome5 name="times" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.modalDescription}>{selectedExercise?.description}</Text>
            
            <View style={styles.exerciseDetails}>
              <View style={styles.detailRow}>
                <FontAwesome5 name="clock" size={16} color="#667eea" />
                <Text style={styles.detailText}>Duration: {selectedExercise?.duration} minutes</Text>
              </View>
              <View style={styles.detailRow}>
                <FontAwesome5 name="fire" size={16} color="#FF9800" />
                <Text style={styles.detailText}>Calories: {selectedExercise?.calories}</Text>
              </View>
              <View style={styles.detailRow}>
                <FontAwesome5 name="signal" size={16} color={getDifficultyColor(selectedExercise?.difficulty || 'beginner')} />
                <Text style={styles.detailText}>Difficulty: {selectedExercise?.difficulty}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Instructions:</Text>
            {selectedExercise?.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>{index + 1}</Text>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Exercise Mode:</Text>
            <View style={styles.settingsContainer}>
              <View style={styles.settingItem}>
                <View style={styles.settingLabelContainer}>
                  <FontAwesome5 name="camera" size={16} color={cameraMode ? "#4CAF50" : "rgba(255, 255, 255, 0.5)"} />
                  <Text style={styles.settingLabel}>Camera Mode</Text>
                </View>
                <Switch
                  value={cameraMode}
                  onValueChange={(value) => {
                    setCameraMode(value);
                    if (value && !cameraPermissions?.camera) {
                      Alert.alert(
                        'Camera Permissions Required',
                        'Enable camera permissions to use pose estimation features.',
                        [
                          { text: 'Cancel', onPress: () => setCameraMode(false) },
                          { text: 'Grant Permissions', onPress: requestCameraPermissions }
                        ]
                      );
                    }
                  }}
                  trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#4CAF50' }}
                  thumbColor={cameraMode ? '#fff' : '#f4f3f4'}
                />
              </View>

              {cameraMode && (
                <View style={styles.settingItem}>
                  <View style={styles.settingLabelContainer}>
                    <FontAwesome5 name="brain" size={16} color={poseEstimationEnabled ? "#667eea" : "rgba(255, 255, 255, 0.5)"} />
                    <Text style={styles.settingLabel}>Pose Analysis</Text>
                  </View>
                  <View style={styles.poseEstimationStatus}>
                    <Text style={[styles.statusText, { color: poseEstimationEnabled ? "#4CAF50" : "#FF9800" }]}>
                      {poseEstimationEnabled ? "Available" : backendAvailable ? "Camera Required" : "Backend Offline"}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <Text style={styles.sectionTitle}>Workout Settings:</Text>
            <View style={styles.settingsContainer}>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Sets:</Text>
                <View style={styles.settingControls}>
                  <TouchableOpacity
                    style={styles.settingButton}
                    onPress={() => setWorkoutSettings(prev => ({ ...prev, sets: Math.max(1, prev.sets - 1) }))}
                  >
                    <FontAwesome5 name="minus" size={12} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.settingValue}>{workoutSettings.sets}</Text>
                  <TouchableOpacity
                    style={styles.settingButton}
                    onPress={() => setWorkoutSettings(prev => ({ ...prev, sets: Math.min(10, prev.sets + 1) }))}
                  >
                    <FontAwesome5 name="plus" size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Reps:</Text>
                <View style={styles.settingControls}>
                  <TouchableOpacity
                    style={styles.settingButton}
                    onPress={() => setWorkoutSettings(prev => ({ ...prev, reps: Math.max(5, prev.reps - 5) }))}
                  >
                    <FontAwesome5 name="minus" size={12} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.settingValue}>{workoutSettings.reps}</Text>
                  <TouchableOpacity
                    style={styles.settingButton}
                    onPress={() => setWorkoutSettings(prev => ({ ...prev, reps: Math.min(50, prev.reps + 5) }))}
                  >
                    <FontAwesome5 name="plus" size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.startButton} onPress={startExercise}>
            <FontAwesome5 
              name={cameraMode ? (poseEstimationEnabled ? "brain" : "camera") : "play"} 
              size={16} 
              color="#fff" 
            />
            <Text style={styles.startButtonText}>
              {cameraMode 
                ? (poseEstimationEnabled ? "Start Pose Analysis" : "Start Camera Exercise")
                : "Start Manual Exercise"
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );



  // Render Camera Tracker
  if (showCameraTracker && selectedExercise) {
    // Use real camera tracker if camera mode is enabled and permissions are granted
    if (cameraMode && cameraPermissions?.camera && cameraPermissions?.microphone) {
      return (
        <CameraExerciseTracker
          exercise={selectedExercise}
          sets={workoutSettings.sets}
          reps={workoutSettings.reps}
          onComplete={handleCameraWorkoutComplete}
          onCancel={handleCameraWorkoutCancel}
          poseEstimationEnabled={poseEstimationEnabled}
          userId={userId}
        />
      );
    } else {
      // Fallback to mock camera tracker
      return (
        <MockCameraTracker
          exercise={selectedExercise}
          sets={workoutSettings.sets}
          reps={workoutSettings.reps}
          onComplete={handleCameraWorkoutComplete}
          onCancel={handleCameraWorkoutCancel}
        />
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Exercise Tracker</Text>
        {!isInitializing && (
          <View style={styles.modeIndicator}>
            <FontAwesome5 
              name={cameraMode ? (poseEstimationEnabled ? "brain" : "camera") : "hand-paper"} 
              size={16} 
              color={cameraMode ? (poseEstimationEnabled ? "#667eea" : "#4CAF50") : "#FF9800"} 
            />
            <Text style={[styles.modeText, { 
              color: cameraMode ? (poseEstimationEnabled ? "#667eea" : "#4CAF50") : "#FF9800" 
            }]}>
              {cameraMode 
                ? (poseEstimationEnabled ? "AI Analysis" : "Camera Mode")
                : "Manual Mode"
              }
            </Text>
          </View>
        )}
      </View>

      {isInitializing && (
        <View style={styles.loadingContainer}>
          <FontAwesome5 name="spinner" size={24} color="#667eea" />
          <Text style={styles.loadingText}>Initializing services...</Text>
        </View>
      )}

      {!isInitializing && !backendAvailable && (
        <View style={styles.infoCard}>
          <FontAwesome5 name="exclamation-triangle" size={20} color="#FF9800" />
          <Text style={styles.infoText}>
            Pose estimation backend is offline. Camera mode will use manual rep counting.
          </Text>
        </View>
      )}

      {!isInitializing && !cameraPermissions?.camera && (
        <View style={styles.infoCard}>
          <FontAwesome5 name="camera" size={20} color="#F44336" style={{ opacity: 0.5 }} />
          <Text style={styles.infoText}>
            Camera permissions not granted. Tap below to request permissions for pose analysis.
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.permissionButton}
              onPress={requestCameraPermissions}
            >
              <Text style={styles.permissionButtonText}>Request Permissions</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.permissionButton, styles.refreshButton]}
              onPress={refreshPermissions}
            >
              <Text style={styles.permissionButtonText}>Refresh Status</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!isInitializing && !backendAvailable && (
        <View style={styles.infoCard}>
          <FontAwesome5 name="server" size={20} color="#FF9800" />
          <Text style={styles.infoText}>
            Running in offline mode. Start the Python backend server for advanced pose analysis features.
          </Text>
        </View>
      )}

      <ScrollView style={styles.exerciseList} showsVerticalScrollIndicator={false}>
        {exercises.map(renderExerciseCard)}
      </ScrollView>

      {renderExerciseModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.2)',
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  refreshButton: {
    backgroundColor: '#34C759',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  exerciseList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  exerciseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  exerciseDifficulty: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'capitalize',
  },
  exerciseStats: {
    alignItems: 'flex-end',
  },
  exerciseDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  exerciseCalories: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  exerciseDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    lineHeight: 20,
  },
  exerciseMuscles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  muscleTag: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  muscleText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.8,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
    marginBottom: 20,
  },
  exerciseDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    marginTop: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#667eea',
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  settingsContainer: {
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  settingControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: 'center',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poseEstimationStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default ExerciseTracker;
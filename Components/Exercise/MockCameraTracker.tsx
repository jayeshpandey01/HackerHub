import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { ExerciseType } from '../../services/simpleFitnessService';

const { width, height } = Dimensions.get('window');

interface MockCameraTrackerProps {
  exercise: ExerciseType;
  sets: number;
  reps: number;
  onComplete: (workoutData: any) => void;
  onCancel: () => void;
}

const MockCameraTracker: React.FC<MockCameraTrackerProps> = ({
  exercise,
  sets,
  reps,
  onComplete,
  onCancel
}) => {
  const [currentSet, setCurrentSet] = useState(1);
  const [currentReps, setCurrentReps] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [exerciseTimer, setExerciseTimer] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [isActive, setIsActive] = useState(true);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setWorkoutStartTime(new Date());
    
    // Start exercise timer
    timerRef.current = setInterval(() => {
      if (isActive) {
        setExerciseTimer(prev => prev + 1);
      }
    }, 1000);

    // Start pulse animation for rep button
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      pulseAnimation.stop();
    };
  }, [isActive]);

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

  const handleRepComplete = () => {
    if (currentReps < reps) {
      setCurrentReps(prev => prev + 1);
      
      // Haptic feedback simulation
      // In a real app, you might use Haptics.impactAsync()
      
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
      'Set Complete! 🎉',
      `Great job! Rest for 30 seconds before starting set ${currentSet}.`,
      [{ text: 'OK' }]
    );
  };

  const completeWorkout = () => {
    const workoutData = {
      exercise: exercise,
      sets: sets,
      reps: reps,
      duration: exerciseTimer,
      calories: Math.round((exercise.calories * exerciseTimer) / (exercise.duration * 60)),
      completedAt: new Date(),
      startedAt: workoutStartTime
    };

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    onComplete(workoutData);
  };

  const togglePause = () => {
    setIsActive(!isActive);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getExerciseInstructions = () => {
    switch (exercise.type) {
      case 'squat':
        return 'Stand with feet shoulder-width apart. Lower down as if sitting in a chair, then stand back up. Tap the rep button after each squat.';
      case 'push_up':
        return 'Start in plank position. Lower your chest to the ground, then push back up. Tap the rep button after each push-up.';
      case 'hammer_curl':
        return 'Hold weights with palms facing each other. Curl up towards shoulders, then lower. Tap the rep button after each curl.';
      case 'chair_yoga':
        return 'Sit comfortably and follow the gentle stretching movements. Tap the rep button after each pose.';
      case 'breathing_exercise':
        return 'Breathe slowly and deeply. Focus on expanding your diaphragm. Tap the rep button after each breathing cycle.';
      default:
        return 'Follow the exercise form and tap the rep button to count each repetition.';
    }
  };

  const getProgressPercentage = () => {
    const totalReps = sets * reps;
    const completedReps = (currentSet - 1) * reps + currentReps;
    return (completedReps / totalReps) * 100;
  };

  return (
    <View style={styles.container}>
      {/* Mock Camera View */}
      <View style={styles.cameraContainer}>
        <View style={styles.mockCamera}>
          {/* Camera Frame */}
          <View style={styles.cameraFrame}>
            <FontAwesome5 name="user" size={80} color="rgba(255, 255, 255, 0.3)" />
            <Text style={styles.cameraText}>Exercise Camera View</Text>
            <Text style={styles.cameraSubtext}>Position yourself in frame</Text>
          </View>

          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <FontAwesome5 name="times" size={20} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseTimer}>{formatTime(exerciseTimer)}</Text>
            </View>
            
            <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
              <FontAwesome5 name={isActive ? "pause" : "play"} size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(getProgressPercentage())}% Complete</Text>
          </View>

          {/* Center Instructions */}
          <View style={styles.centerInstructions}>
            {isResting ? (
              <View style={styles.restContainer}>
                <Text style={styles.restTitle}>Rest Time ⏰</Text>
                <Text style={styles.restTimer}>{restTimer}s</Text>
                <Text style={styles.restSubtitle}>Get ready for set {currentSet}</Text>
              </View>
            ) : (
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructions}>{getExerciseInstructions()}</Text>
              </View>
            )}
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <View style={styles.progressContainer}>
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>Set</Text>
                <Text style={styles.progressValue}>{currentSet}/{sets}</Text>
              </View>
              
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity 
                  style={[styles.repButton, isResting && styles.repButtonDisabled]} 
                  onPress={handleRepComplete}
                  disabled={isResting || !isActive}
                >
                  <FontAwesome5 name="plus" size={24} color="#fff" />
                  <Text style={styles.repButtonText}>Rep</Text>
                </TouchableOpacity>
              </Animated.View>
              
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>Reps</Text>
                <Text style={styles.progressValue}>{currentReps}/{reps}</Text>
              </View>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.endButton} onPress={() => {
                Alert.alert(
                  'End Workout?',
                  'Are you sure you want to end this workout? Your progress will be saved.',
                  [
                    { text: 'Continue', style: 'cancel' },
                    { text: 'End Workout', onPress: completeWorkout, style: 'destructive' }
                  ]
                );
              }}>
                <FontAwesome5 name="stop" size={16} color="#fff" />
                <Text style={styles.endButtonText}>End Workout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  cameraContainer: {
    flex: 1,
  },
  mockCamera: {
    flex: 1,
    position: 'relative',
  },
  cameraFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    borderStyle: 'dashed',
  },
  cameraText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
  },
  cameraSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  cancelButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
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
  },
  exerciseTimer: {
    fontSize: 14,
    color: '#fff',
    marginTop: 2,
  },
  pauseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(102, 126, 234, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
    fontWeight: '600',
  },
  centerInstructions: {
    position: 'absolute',
    top: '40%',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingBottom: 50,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  repButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  repButtonDisabled: {
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
  },
  repButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  endButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default MockCameraTracker;
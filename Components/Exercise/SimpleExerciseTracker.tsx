import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { simpleFitnessService, ExerciseType } from '../../services/simpleFitnessService';
import MockCameraTracker from './MockCameraTracker';

const { width, height } = Dimensions.get('window');

interface SimpleExerciseTrackerProps {
  userId: string;
  medicalProfile: any;
  onWorkoutComplete?: (workoutData: any) => void;
}

const SimpleExerciseTracker: React.FC<SimpleExerciseTrackerProps> = ({
  userId,
  medicalProfile,
  onWorkoutComplete
}) => {
  const [exercises] = useState<ExerciseType[]>(simpleFitnessService.getAvailableExercises());
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType | null>(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showCameraTracker, setShowCameraTracker] = useState(false);
  const [workoutSettings, setWorkoutSettings] = useState({
    sets: 3,
    reps: 10
  });

  const handleExerciseSelect = (exercise: ExerciseType) => {
    setSelectedExercise(exercise);
    setShowExerciseModal(true);
  };

  const startExercise = () => {
    if (!selectedExercise) return;
    
    setShowExerciseModal(false);
    setShowCameraTracker(true);
  };

  const handleWorkoutComplete = (workoutData: any) => {
    setShowCameraTracker(false);
    
    // Log workout to local storage
    const loggedWorkout = simpleFitnessService.logWorkout({
      userId,
      exerciseType: workoutData.exercise.type,
      sets: workoutData.sets,
      reps: workoutData.reps,
      duration: workoutData.duration,
      calories: workoutData.calories,
      date: new Date().toISOString(),
      completed: true
    });

    if (onWorkoutComplete) {
      onWorkoutComplete(loggedWorkout);
    }
  };

  const handleWorkoutCancel = () => {
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
            <FontAwesome5 name="play" size={16} color="#fff" />
            <Text style={styles.startButtonText}>Start Exercise</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Render Camera Tracker
  if (showCameraTracker && selectedExercise) {
    return (
      <MockCameraTracker
        exercise={selectedExercise}
        sets={workoutSettings.sets}
        reps={workoutSettings.reps}
        onComplete={handleWorkoutComplete}
        onCancel={handleWorkoutCancel}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Exercise Tracker</Text>
        <View style={styles.modeIndicator}>
          <FontAwesome5 name="camera" size={16} color="#4CAF50" />
          <Text style={styles.modeText}>Camera Mode</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <FontAwesome5 name="info-circle" size={20} color="#667eea" />
        <Text style={styles.infoText}>
          Camera-based exercise tracking with manual rep counting and progress monitoring.
        </Text>
      </View>

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
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modeText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 6,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
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

export default SimpleExerciseTracker;
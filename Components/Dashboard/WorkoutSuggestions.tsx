import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface WorkoutSuggestionsProps {
  medicalProfile: any;
  onBack: () => void;
}

const WorkoutSuggestions: React.FC<WorkoutSuggestionsProps> = ({
  medicalProfile,
  onBack,
}) => {
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [workoutPlan, setWorkoutPlan] = useState<any[]>([]);

  useEffect(() => {
    generateWorkoutPlan();
  }, [medicalProfile]);

  const generateWorkoutPlan = () => {
    const diseases = medicalProfile?.diseases || [];
    const weight = parseFloat(medicalProfile?.weight || '70');
    const height = parseFloat(medicalProfile?.height || '170');
    const bmi = weight / ((height / 100) ** 2);
    
    let workouts = [];

    // Base workout recommendations
    const baseWorkouts = [
      {
        id: 1,
        title: 'Morning Cardio',
        duration: '20-30 min',
        intensity: 'Low',
        type: 'cardio',
        icon: 'walking',
        color: '#3498db',
        exercises: [
          { name: 'Brisk Walking', duration: '15 min', calories: 80 },
          { name: 'Light Jogging', duration: '10 min', calories: 100 },
          { name: 'Cool Down Stretch', duration: '5 min', calories: 20 },
        ],
        benefits: ['Improves cardiovascular health', 'Boosts metabolism', 'Enhances mood'],
        precautions: ['Start slowly', 'Stay hydrated', 'Stop if you feel dizzy'],
      },
      {
        id: 2,
        title: 'Strength Training',
        duration: '25-35 min',
        intensity: 'Moderate',
        type: 'strength',
        icon: 'dumbbell',
        color: '#e74c3c',
        exercises: [
          { name: 'Bodyweight Squats', duration: '3 sets x 10', calories: 50 },
          { name: 'Push-ups (Modified)', duration: '3 sets x 8', calories: 40 },
          { name: 'Plank Hold', duration: '3 x 30 sec', calories: 30 },
          { name: 'Resistance Band Rows', duration: '3 sets x 12', calories: 45 },
        ],
        benefits: ['Builds muscle strength', 'Improves bone density', 'Increases metabolism'],
        precautions: ['Use proper form', 'Start with light weights', 'Rest between sets'],
      },
      {
        id: 3,
        title: 'Flexibility & Balance',
        duration: '15-20 min',
        intensity: 'Low',
        type: 'flexibility',
        icon: 'leaf',
        color: '#2ecc71',
        exercises: [
          { name: 'Gentle Yoga Flow', duration: '10 min', calories: 30 },
          { name: 'Balance Exercises', duration: '5 min', calories: 15 },
          { name: 'Deep Breathing', duration: '5 min', calories: 10 },
        ],
        benefits: ['Improves flexibility', 'Reduces stress', 'Enhances balance'],
        precautions: ['Move slowly', 'Don\'t force stretches', 'Breathe deeply'],
      },
    ];

    // Customize based on medical conditions
    if (diseases.includes('diabetes_type1') || diseases.includes('diabetes_type2')) {
      workouts.push({
        id: 4,
        title: 'Diabetes-Friendly Cardio',
        duration: '30-40 min',
        intensity: 'Moderate',
        type: 'cardio',
        icon: 'heartbeat',
        color: '#9b59b6',
        exercises: [
          { name: 'Stationary Cycling', duration: '20 min', calories: 150 },
          { name: 'Swimming (if available)', duration: '15 min', calories: 120 },
          { name: 'Cool Down Walk', duration: '5 min', calories: 30 },
        ],
        benefits: ['Helps control blood sugar', 'Improves insulin sensitivity', 'Reduces complications'],
        precautions: ['Monitor blood sugar before/after', 'Carry glucose tablets', 'Exercise with a buddy'],
        medicalNote: 'Recommended for diabetes management - helps improve glucose control',
      });
    }

    if (diseases.includes('hypertension')) {
      workouts.push({
        id: 5,
        title: 'Blood Pressure Friendly',
        duration: '25-30 min',
        intensity: 'Low-Moderate',
        type: 'cardio',
        icon: 'heart',
        color: '#e67e22',
        exercises: [
          { name: 'Gentle Walking', duration: '15 min', calories: 70 },
          { name: 'Tai Chi Movements', duration: '10 min', calories: 40 },
          { name: 'Relaxation Breathing', duration: '5 min', calories: 10 },
        ],
        benefits: ['Lowers blood pressure', 'Reduces stress', 'Improves circulation'],
        precautions: ['Avoid sudden movements', 'Monitor heart rate', 'Stay well hydrated'],
        medicalNote: 'Designed to help manage hypertension safely',
      });
    }

    if (diseases.includes('arthritis')) {
      workouts.push({
        id: 6,
        title: 'Joint-Friendly Exercise',
        duration: '20-25 min',
        intensity: 'Low',
        type: 'flexibility',
        icon: 'hand-paper',
        color: '#1abc9c',
        exercises: [
          { name: 'Water Aerobics (if available)', duration: '15 min', calories: 80 },
          { name: 'Gentle Joint Movements', duration: '8 min', calories: 25 },
          { name: 'Heat/Cold Therapy', duration: '2 min', calories: 5 },
        ],
        benefits: ['Reduces joint stiffness', 'Maintains mobility', 'Manages pain'],
        precautions: ['Warm up thoroughly', 'Avoid high-impact activities', 'Listen to your body'],
        medicalNote: 'Low-impact exercises to protect joints while maintaining mobility',
      });
    }

    if (diseases.includes('anxiety') || diseases.includes('depression')) {
      workouts.push({
        id: 7,
        title: 'Mood-Boosting Workout',
        duration: '20-30 min',
        intensity: 'Low-Moderate',
        type: 'mixed',
        icon: 'smile',
        color: '#f39c12',
        exercises: [
          { name: 'Nature Walk', duration: '15 min', calories: 75 },
          { name: 'Mindful Stretching', duration: '10 min', calories: 30 },
          { name: 'Meditation', duration: '5 min', calories: 10 },
        ],
        benefits: ['Releases endorphins', 'Reduces anxiety', 'Improves sleep quality'],
        precautions: ['Start gradually', 'Exercise outdoors when possible', 'Focus on enjoyment'],
        medicalNote: 'Exercise therapy for mental health - proven to reduce symptoms',
      });
    }

    // BMI-based recommendations
    if (bmi > 30) {
      workouts.push({
        id: 8,
        title: 'Weight Management Plan',
        duration: '35-45 min',
        intensity: 'Moderate',
        type: 'mixed',
        icon: 'weight',
        color: '#34495e',
        exercises: [
          { name: 'Low-Impact Cardio', duration: '20 min', calories: 180 },
          { name: 'Resistance Training', duration: '15 min', calories: 120 },
          { name: 'Core Strengthening', duration: '10 min', calories: 60 },
        ],
        benefits: ['Burns calories effectively', 'Builds lean muscle', 'Boosts metabolism'],
        precautions: ['Progress gradually', 'Focus on form over speed', 'Stay consistent'],
        medicalNote: 'Designed for safe and effective weight management',
      });
    }

    // Add base workouts
    workouts = [...baseWorkouts, ...workouts];
    setWorkoutPlan(workouts);
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity.toLowerCase()) {
      case 'low': return '#2ecc71';
      case 'moderate': return '#f39c12';
      case 'high': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const startWorkout = (workout: any) => {
    Alert.alert(
      'Start Workout',
      `Ready to begin "${workout.title}"? This workout is ${workout.duration} long.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start', 
          onPress: () => {
            Alert.alert('Workout Started!', 'Timer has begun. Follow the exercises and stay safe!');
          }
        },
      ]
    );
  };

  if (selectedWorkout) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedWorkout(null)}>
            <FontAwesome5 name="arrow-left" size={20} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Workout Details</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.workoutHeader, { backgroundColor: selectedWorkout.color }]}>
            <FontAwesome5 name={selectedWorkout.icon} size={48} color="#fff" />
            <Text style={styles.workoutTitle}>{selectedWorkout.title}</Text>
            <Text style={styles.workoutDuration}>{selectedWorkout.duration}</Text>
          </View>

          {selectedWorkout.medicalNote && (
            <View style={styles.medicalNote}>
              <FontAwesome5 name="info-circle" size={16} color="#3498db" />
              <Text style={styles.medicalNoteText}>{selectedWorkout.medicalNote}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exercises</Text>
            {selectedWorkout.exercises.map((exercise: any, index: number) => (
              <View key={index} style={styles.exerciseItem}>
                <View style={styles.exerciseNumber}>
                  <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseDuration}>{exercise.duration}</Text>
                </View>
                <Text style={styles.exerciseCalories}>{exercise.calories} cal</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Benefits</Text>
            {selectedWorkout.benefits.map((benefit: string, index: number) => (
              <View key={index} style={styles.benefitItem}>
                <FontAwesome5 name="check" size={14} color="#2ecc71" />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Precautions</Text>
            {selectedWorkout.precautions.map((precaution: string, index: number) => (
              <View key={index} style={styles.precautionItem}>
                <FontAwesome5 name="exclamation-triangle" size={14} color="#f39c12" />
                <Text style={styles.precautionText}>{precaution}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: selectedWorkout.color }]}
            onPress={() => startWorkout(selectedWorkout)}
          >
            <FontAwesome5 name="play" size={20} color="#fff" />
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <FontAwesome5 name="arrow-left" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Workout Suggestions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.aiInsight}>
          <FontAwesome5 name="brain" size={24} color="#667eea" />
          <Text style={styles.aiInsightText}>
            Based on your health profile, I've created personalized workout recommendations that are safe and effective for your conditions.
          </Text>
        </View>

        {workoutPlan.map((workout) => (
          <TouchableOpacity
            key={workout.id}
            style={styles.workoutCard}
            onPress={() => setSelectedWorkout(workout)}
          >
            <View style={[styles.workoutIcon, { backgroundColor: workout.color }]}>
              <FontAwesome5 name={workout.icon} size={24} color="#fff" />
            </View>
            <View style={styles.workoutInfo}>
              <Text style={styles.workoutCardTitle}>{workout.title}</Text>
              <Text style={styles.workoutCardDuration}>{workout.duration}</Text>
              <View style={styles.workoutMeta}>
                <View style={[styles.intensityBadge, { backgroundColor: getIntensityColor(workout.intensity) }]}>
                  <Text style={styles.intensityText}>{workout.intensity}</Text>
                </View>
                <Text style={styles.workoutType}>{workout.type}</Text>
              </View>
              {workout.medicalNote && (
                <View style={styles.medicalBadge}>
                  <FontAwesome5 name="stethoscope" size={12} color="#3498db" />
                  <Text style={styles.medicalBadgeText}>Medical</Text>
                </View>
              )}
            </View>
            <FontAwesome5 name="chevron-right" size={16} color="#ccc" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  aiInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 20,
  },
  aiInsightText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  workoutIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  workoutCardDuration: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  intensityBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  intensityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  workoutType: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  medicalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  medicalBadgeText: {
    fontSize: 10,
    color: '#3498db',
    fontWeight: '600',
    marginLeft: 4,
  },
  workoutHeader: {
    alignItems: 'center',
    borderRadius: 20,
    padding: 30,
    marginVertical: 20,
  },
  workoutTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  workoutDuration: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  medicalNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  medicalNoteText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  exerciseNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  exerciseDuration: {
    fontSize: 14,
    color: '#666',
  },
  exerciseCalories: {
    fontSize: 12,
    color: '#f39c12',
    fontWeight: '600',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
  },
  precautionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  precautionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    paddingVertical: 16,
    marginBottom: 30,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default WorkoutSuggestions;
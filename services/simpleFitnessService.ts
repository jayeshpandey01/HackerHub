// Simple Fitness Service - Camera-based exercise tracking only
interface ExerciseType {
  id: string;
  name: string;
  type: 'squat' | 'push_up' | 'hammer_curl' | 'chair_yoga' | 'breathing_exercise';
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  calories: number;
  targetMuscles: string[];
  equipment: string[];
  instructions: string[];
}

interface WorkoutSession {
  id: string;
  userId: string;
  exerciseType: string;
  sets: number;
  reps: number;
  duration: number; // in seconds
  calories: number;
  date: string;
  completed: boolean;
}

interface WorkoutStats {
  totalWorkouts: number;
  totalExercises: number;
  streakDays: number;
  weeklyWorkouts: number;
  totalCalories: number;
  averageDuration: number;
}

class SimpleFitnessService {
  private static instance: SimpleFitnessService;
  private workoutHistory: WorkoutSession[] = [];

  private constructor() {
    console.log('🎮 Simple Fitness Service initialized - Camera-based exercise tracking');
    this.loadWorkoutHistory();
  }

  static getInstance(): SimpleFitnessService {
    if (!SimpleFitnessService.instance) {
      SimpleFitnessService.instance = new SimpleFitnessService();
    }
    return SimpleFitnessService.instance;
  }

  // Load workout history from local storage
  private loadWorkoutHistory() {
    try {
      // In a real app, you'd use AsyncStorage
      // For now, we'll use mock data
      this.workoutHistory = [
        {
          id: '1',
          userId: 'user1',
          exerciseType: 'squat',
          sets: 3,
          reps: 15,
          duration: 900,
          calories: 120,
          date: new Date(Date.now() - 86400000).toISOString(),
          completed: true
        },
        {
          id: '2',
          userId: 'user1',
          exerciseType: 'push_up',
          sets: 3,
          reps: 10,
          duration: 600,
          calories: 80,
          date: new Date(Date.now() - 172800000).toISOString(),
          completed: true
        }
      ];
    } catch (error) {
      console.log('No workout history found, starting fresh');
      this.workoutHistory = [];
    }
  }

  // Get available exercises
  getAvailableExercises(): ExerciseType[] {
    return [
      {
        id: 'squat',
        name: 'Squats',
        type: 'squat',
        description: 'Lower body strength exercise targeting quads, glutes, and hamstrings',
        difficulty: 'beginner',
        duration: 15,
        calories: 120,
        targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Calves'],
        equipment: ['None'],
        instructions: [
          'Stand with feet shoulder-width apart',
          'Lower your body by bending knees and hips',
          'Keep your chest up and back straight',
          'Return to starting position'
        ]
      },
      {
        id: 'push_up',
        name: 'Push-ups',
        type: 'push_up',
        description: 'Upper body strength exercise targeting chest, shoulders, and triceps',
        difficulty: 'beginner',
        duration: 10,
        calories: 80,
        targetMuscles: ['Chest', 'Shoulders', 'Triceps', 'Core'],
        equipment: ['None'],
        instructions: [
          'Start in plank position with hands shoulder-width apart',
          'Lower your body until chest nearly touches floor',
          'Push back up to starting position',
          'Keep your body in straight line'
        ]
      },
      {
        id: 'hammer_curl',
        name: 'Hammer Curls',
        type: 'hammer_curl',
        description: 'Arm strengthening exercise targeting biceps and forearms',
        difficulty: 'intermediate',
        duration: 12,
        calories: 60,
        targetMuscles: ['Biceps', 'Forearms', 'Shoulders'],
        equipment: ['Dumbbells or Water Bottles'],
        instructions: [
          'Hold weights with neutral grip (palms facing each other)',
          'Keep elbows close to your sides',
          'Curl weights up towards shoulders',
          'Lower with control'
        ]
      },
      {
        id: 'chair_yoga',
        name: 'Chair Yoga',
        type: 'chair_yoga',
        description: 'Gentle stretching and flexibility exercise suitable for all ages',
        difficulty: 'beginner',
        duration: 20,
        calories: 40,
        targetMuscles: ['Full Body', 'Core', 'Back', 'Shoulders'],
        equipment: ['Chair'],
        instructions: [
          'Sit comfortably in chair with feet flat on floor',
          'Follow guided movements for stretching',
          'Focus on breathing and gentle movements',
          'Hold poses for 15-30 seconds'
        ]
      },
      {
        id: 'breathing_exercise',
        name: 'Breathing Exercise',
        type: 'breathing_exercise',
        description: 'Relaxation and mindfulness exercise for stress relief',
        difficulty: 'beginner',
        duration: 10,
        calories: 20,
        targetMuscles: ['Diaphragm', 'Core'],
        equipment: ['None'],
        instructions: [
          'Sit or lie down comfortably',
          'Place one hand on chest, one on belly',
          'Breathe slowly and deeply through nose',
          'Focus on expanding your diaphragm'
        ]
      }
    ];
  }

  // Log completed workout
  logWorkout(workoutData: Omit<WorkoutSession, 'id'>): WorkoutSession {
    const workout: WorkoutSession = {
      ...workoutData,
      id: Date.now().toString()
    };

    this.workoutHistory.unshift(workout);
    
    // Keep only last 50 workouts
    if (this.workoutHistory.length > 50) {
      this.workoutHistory = this.workoutHistory.slice(0, 50);
    }

    console.log('✅ Workout logged:', workout);
    return workout;
  }

  // Get recent workouts
  getRecentWorkouts(userId: string, limit: number = 5): WorkoutSession[] {
    return this.workoutHistory
      .filter(workout => workout.userId === userId)
      .slice(0, limit);
  }

  // Get workout statistics
  getWorkoutStats(userId: string): WorkoutStats {
    const userWorkouts = this.workoutHistory.filter(workout => workout.userId === userId);
    
    const totalWorkouts = userWorkouts.length;
    const totalExercises = userWorkouts.reduce((sum, workout) => sum + workout.sets, 0);
    const totalCalories = userWorkouts.reduce((sum, workout) => sum + workout.calories, 0);
    const totalDuration = userWorkouts.reduce((sum, workout) => sum + workout.duration, 0);
    
    // Calculate streak (simplified)
    const streakDays = this.calculateStreak(userWorkouts);
    
    // Calculate weekly workouts
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyWorkouts = userWorkouts.filter(
      workout => new Date(workout.date) > oneWeekAgo
    ).length;

    return {
      totalWorkouts,
      totalExercises,
      streakDays,
      weeklyWorkouts,
      totalCalories,
      averageDuration: totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts / 60) : 0
    };
  }

  // Calculate workout streak
  private calculateStreak(workouts: WorkoutSession[]): number {
    if (workouts.length === 0) return 0;

    const sortedWorkouts = workouts
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const workout of sortedWorkouts) {
      const workoutDate = new Date(workout.date);
      workoutDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff > streak) {
        break;
      }
    }

    return streak;
  }

  // Generate workout plan based on user profile
  generateWorkoutPlan(userProfile: any, medicalProfile: any): ExerciseType[] {
    const allExercises = this.getAvailableExercises();
    
    // Filter exercises based on medical conditions
    let recommendedExercises = allExercises;
    
    if (medicalProfile?.diseases?.includes('arthritis')) {
      // Recommend low-impact exercises
      recommendedExercises = allExercises.filter(ex => 
        ['chair_yoga', 'breathing_exercise'].includes(ex.type)
      );
    } else if (medicalProfile?.diseases?.includes('heart_disease')) {
      // Recommend gentle exercises
      recommendedExercises = allExercises.filter(ex => 
        ex.difficulty === 'beginner' && ex.calories < 100
      );
    } else {
      // For healthy individuals, recommend a mix
      recommendedExercises = allExercises.filter(ex => 
        ex.difficulty === 'beginner' || ex.difficulty === 'intermediate'
      );
    }

    return recommendedExercises.slice(0, 3); // Return top 3 recommendations
  }

  // Clear workout history (for testing)
  clearWorkoutHistory(): void {
    this.workoutHistory = [];
    console.log('🗑️ Workout history cleared');
  }
}

export const simpleFitnessService = SimpleFitnessService.getInstance();
export type { ExerciseType, WorkoutSession, WorkoutStats };
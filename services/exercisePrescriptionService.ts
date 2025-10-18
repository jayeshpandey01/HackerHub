// Exercise Prescription Service for Healthcare Providers
import { networkService } from './networkService';
import { monitoringService } from './monitoringService';
export interface ExercisePrescription {
  id: string;
  patientId: string;
  providerId: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'paused' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  startDate: string;
  endDate?: string;
  exercises: PrescribedExercise[];
  goals: ExerciseGoal[];
  restrictions: ExerciseRestriction[];
  progressTracking: ProgressMetric[];
  notes: string;
  reviewSchedule: ReviewSchedule;
}

export interface PrescribedExercise {
  id: string;
  exerciseType: string;
  name: string;
  description: string;
  targetMuscleGroups: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  frequency: {
    timesPerWeek: number;
    daysOfWeek?: string[];
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'any';
  };
  sets: number;
  reps: number | { min: number; max: number };
  duration?: number; // in minutes
  restBetweenSets?: number; // in seconds
  progression: ProgressionPlan;
  modifications: ExerciseModification[];
  formCues: string[];
  safetyNotes: string[];
}

export interface ExerciseGoal {
  id: string;
  type: 'strength' | 'endurance' | 'flexibility' | 'balance' | 'pain_reduction' | 'functional';
  description: string;
  targetValue?: number;
  targetUnit?: string;
  timeframe: string; // e.g., "4 weeks", "3 months"
  priority: 'high' | 'medium' | 'low';
  measurable: boolean;
}

export interface ExerciseRestriction {
  id: string;
  type: 'medical' | 'physical' | 'equipment' | 'time';
  description: string;
  severity: 'absolute' | 'relative' | 'caution';
  affectedExercises: string[];
  alternatives?: string[];
  notes?: string;
}

export interface ProgressionPlan {
  type: 'linear' | 'weekly' | 'milestone_based' | 'adaptive';
  parameters: {
    increaseBy?: number;
    increaseUnit?: 'reps' | 'sets' | 'weight' | 'duration' | 'difficulty';
    frequency?: string; // e.g., "weekly", "bi-weekly"
    maxProgression?: number;
  };
  milestones: ProgressionMilestone[];
}

export interface ProgressionMilestone {
  id: string;
  description: string;
  criteria: {
    metric: string;
    operator: '>=' | '<=' | '=' | '>';
    value: number;
    unit: string;
  };
  nextLevel: {
    sets?: number;
    reps?: number | { min: number; max: number };
    duration?: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  };
}

export interface ExerciseModification {
  id: string;
  condition: string; // e.g., "if pain > 5/10", "if unable to complete full range"
  modification: string;
  description: string;
  type: 'easier' | 'harder' | 'alternative' | 'assistive';
}

export interface ProgressMetric {
  id: string;
  name: string;
  type: 'accuracy' | 'reps' | 'duration' | 'pain_level' | 'difficulty' | 'form_score';
  unit: string;
  targetValue?: number;
  trackingFrequency: 'daily' | 'weekly' | 'per_session';
  isRequired: boolean;
}

export interface ReviewSchedule {
  frequency: 'weekly' | 'bi_weekly' | 'monthly' | 'as_needed';
  nextReviewDate: string;
  reviewCriteria: string[];
  autoAdjustments: boolean;
}

export interface PrescriptionTemplate {
  id: string;
  name: string;
  description: string;
  category: 'rehabilitation' | 'strength' | 'cardio' | 'flexibility' | 'balance' | 'general_wellness';
  targetConditions: string[];
  exercises: Omit<PrescribedExercise, 'id'>[];
  defaultGoals: Omit<ExerciseGoal, 'id'>[];
  estimatedDuration: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface PatientProgress {
  prescriptionId: string;
  patientId: string;
  overallProgress: number; // 0-100%
  completedSessions: number;
  totalSessions: number;
  adherenceRate: number; // 0-100%
  currentWeek: number;
  exerciseProgress: ExerciseProgress[];
  goalProgress: GoalProgress[];
  lastUpdated: string;
  nextMilestone?: ProgressionMilestone;
}

export interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  currentLevel: {
    sets: number;
    reps: number | { min: number; max: number };
    duration?: number;
    difficulty: string;
  };
  progressPercentage: number;
  averageAccuracy: number;
  averageFormScore: number;
  completedSessions: number;
  lastPerformed: string;
  trend: 'improving' | 'stable' | 'declining';
}

export interface GoalProgress {
  goalId: string;
  goalDescription: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  progressPercentage: number;
  onTrack: boolean;
  estimatedCompletion: string;
}



export interface ExerciseRecommendation {
  id: string;
  exerciseId: string;
  exerciseName: string;
  recommendationType: 'progression' | 'modification' | 'addition' | 'form_correction' | 'alternative';
  priority: 'high' | 'medium' | 'low';
  reason: string;
  suggestedChanges: {
    increaseReps?: number;
    increaseSets?: number;
    addResistance?: boolean;
    reduceIntensity?: boolean;
    addFormCues?: string[];
    alternativeExercise?: string;
    addNewExercise?: Partial<PrescribedExercise>;
    progressToAdvanced?: boolean;
    addSupervision?: boolean;
    reduceSpeed?: boolean;
    addMirrorFeedback?: boolean;
    scheduleFormReview?: boolean;
    startWithLowIntensity?: boolean;
  };
  expectedOutcome: string;
}

export interface DifficultyAdjustment {
  exerciseId: string;
  currentDifficulty: string;
  recommendedDifficulty: string;
  reason: string;
  adjustmentType: 'increase_intensity' | 'reduce_intensity' | 'modify_technique' | 'change_frequency';
  parameters: {
    repsIncrease?: number;
    repsReduction?: number;
    setsIncrease?: number;
    setsReduction?: number;
    frequencyReduction?: number;
    frequencyIncrease?: number;
    addResistance?: boolean;
    addAssistance?: boolean;
  };
}

export interface CustomExercisePlan {
  id: string;
  patientId: string;
  providerId: string;
  name: string;
  description: string;
  targetConditions: string[];
  customizedExercises: PrescribedExercise[];
  adaptiveParameters: {
    autoAdjustDifficulty: boolean;
    progressionThreshold: number; // percentage
    regressionThreshold: number; // percentage
    maxAdjustmentsPerWeek: number;
  };
  createdAt: string;
  lastModified: string;
}

class ExercisePrescriptionService {
  private static instance: ExercisePrescriptionService;
  private prescriptions: Map<string, ExercisePrescription> = new Map();
  private templates: Map<string, PrescriptionTemplate> = new Map();
  private patientProgress: Map<string, PatientProgress> = new Map();

  private constructor() {
    this.initializeMockData();
  }

  static getInstance(): ExercisePrescriptionService {
    if (!ExercisePrescriptionService.instance) {
      ExercisePrescriptionService.instance = new ExercisePrescriptionService();
    }
    return ExercisePrescriptionService.instance;
  }

  private initializeMockData(): void {
    // Initialize with mock templates
    const rehabTemplate: PrescriptionTemplate = {
      id: 'template_rehab_1',
      name: 'Post-Injury Knee Rehabilitation',
      description: 'Comprehensive knee rehabilitation program for post-injury recovery',
      category: 'rehabilitation',
      targetConditions: ['knee_injury', 'post_surgery', 'ligament_strain'],
      exercises: [
        {
          exerciseType: 'Squats',
          name: 'Wall Squats',
          description: 'Gentle squats against wall for support',
          targetMuscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
          difficulty: 'beginner',
          frequency: { timesPerWeek: 3, daysOfWeek: ['Monday', 'Wednesday', 'Friday'] },
          sets: 2,
          reps: { min: 8, max: 12 },
          restBetweenSets: 60,
          progression: {
            type: 'weekly',
            parameters: {
              increaseBy: 2,
              increaseUnit: 'reps',
              frequency: 'weekly',
              maxProgression: 20
            },
            milestones: []
          },
          modifications: [
            {
              id: 'mod_1',
              condition: 'if pain > 3/10',
              modification: 'Reduce depth of squat',
              description: 'Perform partial range of motion',
              type: 'easier'
            }
          ],
          formCues: ['Keep knees aligned with toes', 'Engage core throughout movement'],
          safetyNotes: ['Stop if sharp pain occurs', 'Maintain controlled movement']
        }
      ],
      defaultGoals: [
        {
          type: 'strength',
          description: 'Increase quadriceps strength by 25%',
          targetValue: 25,
          targetUnit: 'percentage',
          timeframe: '8 weeks',
          priority: 'high',
          measurable: true
        }
      ],
      estimatedDuration: '8-12 weeks',
      difficultyLevel: 'beginner'
    };

    this.templates.set(rehabTemplate.id, rehabTemplate);

    // Initialize mock prescription
    const mockPrescription: ExercisePrescription = {
      id: 'prescription_1',
      patientId: 'patient_123',
      providerId: 'doctor_456',
      title: 'Knee Rehabilitation Program',
      description: 'Customized rehabilitation program for knee injury recovery',
      status: 'active',
      createdAt: '2024-12-01T10:00:00Z',
      updatedAt: '2024-12-10T15:30:00Z',
      startDate: '2024-12-01',
      exercises: [
        {
          id: 'exercise_1',
          exerciseType: 'Squats',
          name: 'Wall Squats',
          description: 'Gentle squats against wall for support',
          targetMuscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
          difficulty: 'beginner',
          frequency: { timesPerWeek: 3, daysOfWeek: ['Monday', 'Wednesday', 'Friday'] },
          sets: 2,
          reps: { min: 10, max: 15 },
          restBetweenSets: 60,
          progression: {
            type: 'weekly',
            parameters: {
              increaseBy: 2,
              increaseUnit: 'reps',
              frequency: 'weekly',
              maxProgression: 20
            },
            milestones: [
              {
                id: 'milestone_1',
                description: 'Complete 15 reps with good form',
                criteria: {
                  metric: 'reps',
                  operator: '>=',
                  value: 15,
                  unit: 'count'
                },
                nextLevel: {
                  sets: 3,
                  reps: { min: 8, max: 12 }
                }
              }
            ]
          },
          modifications: [
            {
              id: 'mod_1',
              condition: 'if pain > 3/10',
              modification: 'Reduce depth of squat',
              description: 'Perform partial range of motion',
              type: 'easier'
            }
          ],
          formCues: ['Keep knees aligned with toes', 'Engage core throughout movement'],
          safetyNotes: ['Stop if sharp pain occurs', 'Maintain controlled movement']
        }
      ],
      goals: [
        {
          id: 'goal_1',
          type: 'strength',
          description: 'Increase quadriceps strength by 25%',
          targetValue: 25,
          targetUnit: 'percentage',
          timeframe: '8 weeks',
          priority: 'high',
          measurable: true
        }
      ],
      restrictions: [
        {
          id: 'restriction_1',
          type: 'medical',
          description: 'Avoid deep knee flexion beyond 90 degrees',
          severity: 'absolute',
          affectedExercises: ['Squats', 'Lunges'],
          alternatives: ['Wall squats', 'Chair-assisted squats']
        }
      ],
      progressTracking: [
        {
          id: 'metric_1',
          name: 'Exercise Accuracy',
          type: 'accuracy',
          unit: 'percentage',
          targetValue: 85,
          trackingFrequency: 'per_session',
          isRequired: true
        }
      ],
      notes: 'Patient recovering from ACL strain. Focus on form over intensity.',
      reviewSchedule: {
        frequency: 'weekly',
        nextReviewDate: '2024-12-17',
        reviewCriteria: ['pain levels', 'range of motion', 'exercise tolerance'],
        autoAdjustments: true
      }
    };

    this.prescriptions.set(mockPrescription.id, mockPrescription);
  }

  // Create new exercise prescription
  async createPrescription(
    _providerId: string,
    _patientId: string,
    prescriptionData: Omit<ExercisePrescription, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ExercisePrescription> {
    const prescription: ExercisePrescription = {
      ...prescriptionData,
      id: `prescription_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add IDs to exercises and goals
    prescription.exercises = prescription.exercises.map(exercise => ({
      ...exercise,
      id: `exercise_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    }));

    prescription.goals = prescription.goals.map(goal => ({
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    }));

    this.prescriptions.set(prescription.id, prescription);

    console.log('📋 Exercise prescription created:', prescription.id);
    return prescription;
  }

  // Create prescription from template
  async createFromTemplate(
    providerId: string,
    patientId: string,
    templateId: string,
    customizations?: {
      title?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      exerciseModifications?: { exerciseIndex: number; modifications: Partial<PrescribedExercise> }[];
    }
  ): Promise<ExercisePrescription> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const prescription: ExercisePrescription = {
      id: `prescription_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      patientId,
      providerId,
      title: customizations?.title || template.name,
      description: customizations?.description || template.description,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startDate: customizations?.startDate || new Date().toISOString().split('T')[0],
      endDate: customizations?.endDate,
      exercises: template.exercises.map((exercise, index) => {
        const customization = customizations?.exerciseModifications?.find(
          mod => mod.exerciseIndex === index
        );

        // Add condition-specific modifications based on template target conditions
        const conditionModifications: ExerciseModification[] = [];
        template.targetConditions.forEach(condition => {
          const exerciseId = `exercise_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
          conditionModifications.push(...this.getConditionSpecificModifications(condition, exerciseId));
        });

        return {
          ...exercise,
          ...customization?.modifications,
          id: `exercise_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          modifications: [...exercise.modifications, ...conditionModifications]
        };
      }),
      goals: template.defaultGoals.map(goal => ({
        ...goal,
        id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      })),
      restrictions: [],
      progressTracking: [
        {
          id: 'metric_accuracy',
          name: 'Exercise Accuracy',
          type: 'accuracy',
          unit: 'percentage',
          targetValue: 85,
          trackingFrequency: 'per_session',
          isRequired: true
        }
      ],
      notes: '',
      reviewSchedule: {
        frequency: 'weekly',
        nextReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reviewCriteria: ['progress', 'adherence', 'safety'],
        autoAdjustments: true
      }
    };

    this.prescriptions.set(prescription.id, prescription);

    console.log('📋 Prescription created from template:', prescription.id);
    return prescription;
  }

  // Update prescription
  async updatePrescription(
    prescriptionId: string,
    providerId: string,
    updates: Partial<ExercisePrescription>
  ): Promise<ExercisePrescription> {
    const prescription = this.prescriptions.get(prescriptionId);
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    if (prescription.providerId !== providerId) {
      throw new Error('Unauthorized: Provider ID mismatch');
    }

    const updatedPrescription = {
      ...prescription,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.prescriptions.set(prescriptionId, updatedPrescription);

    console.log('📝 Prescription updated:', prescriptionId);
    return updatedPrescription;
  }

  // Get prescriptions for provider
  async getProviderPrescriptions(providerId: string): Promise<ExercisePrescription[]> {
    try {
      monitoringService.logInfo('prescription_service', 'Fetching provider prescriptions', { providerId });

      // Try to fetch from API first
      const response = await networkService.get<ExercisePrescription[]>(`/prescriptions/provider/${providerId}`);

      if (response.success && response.data) {
        // Update local cache
        response.data.forEach(prescription => {
          this.prescriptions.set(prescription.id, prescription);
        });
        return response.data;
      } else {
        monitoringService.logWarn('prescription_service', 'API request failed, using local data', { error: response.error });
      }
    } catch (error) {
      monitoringService.logError('prescription_service', 'Failed to fetch provider prescriptions', error);
    }

    // Fallback to local data
    return Array.from(this.prescriptions.values()).filter(
      prescription => prescription.providerId === providerId
    );
  }

  // Get prescriptions for patient
  async getPatientPrescriptions(patientId: string): Promise<ExercisePrescription[]> {
    return Array.from(this.prescriptions.values()).filter(
      prescription => prescription.patientId === patientId
    );
  }

  // Get prescription by ID
  async getPrescription(prescriptionId: string): Promise<ExercisePrescription | null> {
    return this.prescriptions.get(prescriptionId) || null;
  }

  // Activate prescription
  async activatePrescription(prescriptionId: string, providerId: string): Promise<void> {
    const prescription = this.prescriptions.get(prescriptionId);
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    if (prescription.providerId !== providerId) {
      throw new Error('Unauthorized: Provider ID mismatch');
    }

    prescription.status = 'active';
    prescription.updatedAt = new Date().toISOString();

    this.prescriptions.set(prescriptionId, prescription);

    console.log('✅ Prescription activated:', prescriptionId);
  }

  // Generate exercise recommendations based on patient progress
  async generateRecommendations(
    patientId: string,
    prescriptionId: string
  ): Promise<{
    progressions: string[];
    modifications: string[];
    concerns: string[];
    nextSteps: string[];
    exerciseRecommendations: ExerciseRecommendation[];
    difficultyAdjustments: DifficultyAdjustment[];
  }> {
    const prescription = this.prescriptions.get(prescriptionId);
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    const progress = this.patientProgress.get(`${patientId}_${prescriptionId}`);

    const recommendations = {
      progressions: [] as string[],
      modifications: [] as string[],
      concerns: [] as string[],
      nextSteps: [] as string[],
      exerciseRecommendations: [] as ExerciseRecommendation[],
      difficultyAdjustments: [] as DifficultyAdjustment[]
    };

    if (progress) {
      // Analyze progress and generate recommendations
      if (progress.adherenceRate < 70) {
        recommendations.concerns.push('Low adherence rate - consider simplifying program');
        recommendations.modifications.push('Reduce frequency or intensity to improve compliance');
      }

      if (progress.overallProgress > 80) {
        recommendations.progressions.push('Patient ready for progression to next difficulty level');
        recommendations.nextSteps.push('Consider advancing to intermediate exercises');
      }

      progress.exerciseProgress.forEach(exerciseProgress => {
        if (exerciseProgress.trend === 'declining') {
          recommendations.concerns.push(`Declining performance in ${exerciseProgress.exerciseName}`);
          recommendations.modifications.push(`Review form and technique for ${exerciseProgress.exerciseName}`);
        }

        if (exerciseProgress.averageAccuracy > 90 && exerciseProgress.progressPercentage > 75) {
          recommendations.progressions.push(`${exerciseProgress.exerciseName} ready for progression`);

          recommendations.exerciseRecommendations.push({
            id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            exerciseId: exerciseProgress.exerciseId,
            exerciseName: exerciseProgress.exerciseName,
            recommendationType: 'progression',
            reason: 'High accuracy and progress indicate readiness for advancement',
            priority: 'medium',
            suggestedChanges: {
              increaseReps: 3,
              increaseSets: exerciseProgress.currentLevel.sets < 3 ? 1 : 0,
              addResistance: true,
              progressToAdvanced: exerciseProgress.currentLevel.difficulty === 'beginner'
            },
            expectedOutcome: 'Continued strength and skill development'
          });
        }
      });
    }

    return recommendations;
  }

  // Auto-adjust difficulty based on patient progress
  async autoAdjustDifficulty(
    prescriptionId: string,
    patientId: string
  ): Promise<{
    adjustmentsMade: boolean;
    adjustments: DifficultyAdjustment[];
    updatedPrescription?: ExercisePrescription;
  }> {
    const prescription = this.prescriptions.get(prescriptionId);
    const progress = this.patientProgress.get(`${patientId}_${prescriptionId}`);

    if (!prescription || !progress) {
      return { adjustmentsMade: false, adjustments: [] };
    }

    const adjustments: DifficultyAdjustment[] = [];
    let adjustmentsMade = false;

    // Check each exercise for adjustment needs
    progress.exerciseProgress.forEach(exerciseProgress => {
      const exercise = prescription.exercises.find(ex => ex.id === exerciseProgress.exerciseId);
      if (!exercise) return;

      // Progression criteria: high accuracy + good progress
      if (exerciseProgress.averageAccuracy > 85 && exerciseProgress.progressPercentage > 80) {
        const adjustment: DifficultyAdjustment = {
          exerciseId: exercise.id,
          currentDifficulty: exercise.difficulty,
          recommendedDifficulty: exercise.difficulty === 'beginner' ? 'intermediate' : exercise.difficulty === 'intermediate' ? 'advanced' : 'advanced',
          reason: 'High performance indicates readiness for progression',
          adjustmentType: 'increase_intensity',
          parameters: {
            repsIncrease: 2,
            addResistance: true
          }
        };

        adjustments.push(adjustment);
        // Apply the adjustment directly
        if (typeof exercise.reps === 'object') {
          exercise.reps.min += 2;
          exercise.reps.max += 2;
        } else {
          exercise.reps += 2;
        }
        adjustmentsMade = true;
      }

      // Regression criteria: low accuracy or declining trend
      if (exerciseProgress.averageAccuracy < 60 || exerciseProgress.trend === 'declining') {
        const adjustment: DifficultyAdjustment = {
          exerciseId: exercise.id,
          currentDifficulty: exercise.difficulty,
          recommendedDifficulty: exercise.difficulty === 'advanced' ? 'intermediate' :
            exercise.difficulty === 'intermediate' ? 'beginner' : 'beginner',
          reason: 'Poor performance indicates need for difficulty reduction',
          adjustmentType: 'reduce_intensity',
          parameters: {
            repsReduction: 2,
            addAssistance: true
          }
        };

        adjustments.push(adjustment);
        // Apply the adjustment directly
        if (typeof exercise.reps === 'object') {
          exercise.reps.min = Math.max(1, exercise.reps.min - 2);
          exercise.reps.max = Math.max(1, exercise.reps.max - 2);
        } else {
          exercise.reps = Math.max(1, exercise.reps - 2);
        }
        adjustmentsMade = true;
      }
    });

    if (adjustmentsMade) {
      prescription.updatedAt = new Date().toISOString();
      this.prescriptions.set(prescriptionId, prescription);
    }

    return {
      adjustmentsMade,
      adjustments,
      updatedPrescription: adjustmentsMade ? prescription : undefined
    };
  }

  // Adjust prescription based on patient feedback
  async adjustPrescription(
    prescriptionId: string,
    providerId: string,
    adjustments: {
      exerciseId: string;
      adjustmentType: 'increase_difficulty' | 'decrease_difficulty' | 'modify_frequency' | 'add_modification';
      parameters: any;
      reason: string;
    }[]
  ): Promise<ExercisePrescription> {
    const prescription = this.prescriptions.get(prescriptionId);
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    if (prescription.providerId !== providerId) {
      throw new Error('Unauthorized: Provider ID mismatch');
    }

    // Apply adjustments
    adjustments.forEach(adjustment => {
      const exercise = prescription.exercises.find(ex => ex.id === adjustment.exerciseId);
      if (exercise) {
        switch (adjustment.adjustmentType) {
          case 'increase_difficulty':
            if (typeof exercise.reps === 'object') {
              exercise.reps.min += adjustment.parameters.repsIncrease || 2;
              exercise.reps.max += adjustment.parameters.repsIncrease || 2;
            } else {
              exercise.reps += adjustment.parameters.repsIncrease || 2;
            }
            break;

          case 'decrease_difficulty':
            if (typeof exercise.reps === 'object') {
              exercise.reps.min = Math.max(1, exercise.reps.min - (adjustment.parameters.repsDecrease || 2));
              exercise.reps.max = Math.max(1, exercise.reps.max - (adjustment.parameters.repsDecrease || 2));
            } else {
              exercise.reps = Math.max(1, exercise.reps - (adjustment.parameters.repsDecrease || 2));
            }
            break;

          case 'modify_frequency':
            if (adjustment.parameters.frequencyIncrease) {
              exercise.frequency.timesPerWeek += adjustment.parameters.frequencyIncrease;
            }
            if (adjustment.parameters.frequencyReduction) {
              exercise.frequency.timesPerWeek = Math.max(1, exercise.frequency.timesPerWeek - adjustment.parameters.frequencyReduction);
            }
            break;

          case 'add_modification':
            exercise.modifications.push({
              id: `mod_${Date.now()}`,
              condition: adjustment.parameters.condition,
              modification: adjustment.parameters.modification,
              description: adjustment.parameters.description,
              type: adjustment.parameters.type
            });
            break;
        }
      }
    });

    prescription.updatedAt = new Date().toISOString();
    this.prescriptions.set(prescriptionId, prescription);

    console.log('🔧 Prescription adjusted:', prescriptionId);
    return prescription;
  }

  // Get available templates
  async getTemplates(category?: string): Promise<PrescriptionTemplate[]> {
    let templates = Array.from(this.templates.values());

    if (category) {
      templates = templates.filter(template => template.category === category);
    }

    return templates;
  }

  // Create custom template
  async createTemplate(
    _providerId: string,
    templateData: Omit<PrescriptionTemplate, 'id'>
  ): Promise<PrescriptionTemplate> {
    const template: PrescriptionTemplate = {
      ...templateData,
      id: `template_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    };

    this.templates.set(template.id, template);

    console.log('📄 Template created:', template.id);
    return template;
  }

  // Track patient progress
  async updatePatientProgress(
    patientId: string,
    prescriptionId: string,
    progressData: Partial<PatientProgress>
  ): Promise<PatientProgress> {
    const key = `${patientId}_${prescriptionId}`;
    const existingProgress = this.patientProgress.get(key);

    const updatedProgress: PatientProgress = {
      ...existingProgress,
      ...progressData,
      prescriptionId,
      patientId,
      lastUpdated: new Date().toISOString()
    } as PatientProgress;

    this.patientProgress.set(key, updatedProgress);

    console.log('📊 Patient progress updated:', key);
    return updatedProgress;
  }

  // Get patient progress
  async getPatientProgress(patientId: string, prescriptionId: string): Promise<PatientProgress | null> {
    const key = `${patientId}_${prescriptionId}`;
    return this.patientProgress.get(key) || null;
  }





  private getConditionSpecificModifications(condition: string, exerciseId: string): ExerciseModification[] {
    const modifications: ExerciseModification[] = [];

    switch (condition.toLowerCase()) {
      case 'knee_injury':
        modifications.push({
          id: `mod_knee_${exerciseId}_${Date.now()}`,
          condition: 'for knee injury patients',
          modification: 'Avoid deep knee flexion beyond 90 degrees',
          description: 'Limit range of motion to protect healing knee',
          type: 'easier'
        });
        break;

      case 'back_pain':
        modifications.push({
          id: `mod_back_${exerciseId}_${Date.now()}`,
          condition: 'for back pain patients',
          modification: 'Add lumbar support and avoid forward flexion',
          description: 'Use chair or wall support to maintain neutral spine',
          type: 'alternative'
        });
        break;

      case 'balance_issues':
        modifications.push({
          id: `mod_balance_${exerciseId}_${Date.now()}`,
          condition: 'for balance impairment',
          modification: 'Perform near wall or with chair support',
          description: 'Add stability support to prevent falls',
          type: 'assistive'
        });
        break;
    }

    return modifications;
  }

  // Get prescription statistics
  getPrescriptionStats(providerId?: string): {
    total: number;
    active: number;
    completed: number;
    draft: number;
    averageAdherence: number;
  } {
    let prescriptions = Array.from(this.prescriptions.values());

    if (providerId) {
      prescriptions = prescriptions.filter(p => p.providerId === providerId);
    }

    const stats = {
      total: prescriptions.length,
      active: prescriptions.filter(p => p.status === 'active').length,
      completed: prescriptions.filter(p => p.status === 'completed').length,
      draft: prescriptions.filter(p => p.status === 'draft').length,
      averageAdherence: 0
    };

    // Calculate average adherence
    const progressRecords = Array.from(this.patientProgress.values());
    if (progressRecords.length > 0) {
      const totalAdherence = progressRecords.reduce((sum, progress) => sum + progress.adherenceRate, 0);
      stats.averageAdherence = totalAdherence / progressRecords.length;
    }

    return stats;
  }


}

export const exercisePrescriptionService = ExercisePrescriptionService.getInstance();
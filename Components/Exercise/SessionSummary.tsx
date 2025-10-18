import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { AnalysisResult } from '../../services/fitnessBackendService';
import { ExerciseType } from '../../services/simpleFitnessService';

const { width } = Dimensions.get('window');

interface SessionSummaryProps {
  analysisResult: AnalysisResult | null;
  exercise: ExerciseType;
  workoutDuration: number;
  totalReps: number;
  sets: number;
  sessionData?: any[];
  onClose?: () => void;
  onViewDetails?: () => void;
}

interface MetricCardProps {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
}

const SessionSummary: React.FC<SessionSummaryProps> = ({
  analysisResult,
  exercise,
  workoutDuration,
  totalReps,
  sets,
  sessionData = [],
  onClose,
  onViewDetails
}) => {
  const [animatedValues] = useState({
    fadeIn: new Animated.Value(0),
    slideUp: new Animated.Value(50),
    scaleMetrics: new Animated.Value(0.8),
  });

  useEffect(() => {
    // Animate component entrance
    Animated.parallel([
      Animated.timing(animatedValues.fadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValues.slideUp, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(animatedValues.scaleMetrics, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const calculateAccuracy = (): number => {
    if (analysisResult?.accuracy) {
      return Math.round(analysisResult.accuracy);
    }
    
    if (sessionData.length > 0) {
      const totalScore = sessionData.reduce((sum, data) => 
        sum + (data.poseData?.formScore || 0), 0
      );
      return Math.round(totalScore / sessionData.length);
    }
    
    return 0;
  };

  const calculateCalories = (): number => {
    if (analysisResult?.calories) {
      return analysisResult.calories;
    }
    
    // Estimate calories based on exercise and duration
    const baseCaloriesPerMinute = exercise.calories / exercise.duration;
    return Math.round(baseCaloriesPerMinute * (workoutDuration / 60));
  };

  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 80) return '#4CAF50';
    if (accuracy >= 60) return '#FF9800';
    return '#F44336';
  };

  const getPerformanceMessage = (accuracy: number): string => {
    if (accuracy >= 90) return 'Outstanding performance! 🏆';
    if (accuracy >= 80) return 'Excellent form! 🎯';
    if (accuracy >= 70) return 'Good job! Keep it up! 💪';
    if (accuracy >= 60) return 'Nice work! Room for improvement 📈';
    return 'Keep practicing! You\'re improving 🌟';
  };

  const accuracy = calculateAccuracy();
  const calories = calculateCalories();
  const actualReps = analysisResult?.totalReps || totalReps;

  const metrics: MetricCardProps[] = [
    {
      icon: 'bullseye',
      label: 'Form Accuracy',
      value: `${accuracy}%`,
      color: getAccuracyColor(accuracy),
      subtitle: accuracy >= 80 ? 'Excellent' : accuracy >= 60 ? 'Good' : 'Improving'
    },
    {
      icon: 'repeat',
      label: 'Reps Completed',
      value: actualReps,
      color: '#2196F3',
      subtitle: `${sets} sets`
    },
    {
      icon: 'clock',
      label: 'Duration',
      value: formatDuration(workoutDuration),
      color: '#9C27B0',
      subtitle: 'Total time'
    },
    {
      icon: 'fire',
      label: 'Calories Burned',
      value: calories,
      color: '#FF5722',
      subtitle: 'Estimated'
    }
  ];

  const MetricCard: React.FC<MetricCardProps> = ({ 
    icon, label, value, color, subtitle 
  }) => (
    <Animated.View 
      style={[
        styles.metricCard,
        {
          transform: [{ scale: animatedValues.scaleMetrics }]
        }
      ]}
    >
      <View style={[styles.metricIcon, { backgroundColor: `${color}20` }]}>
        <FontAwesome5 name={icon} size={24} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </Animated.View>
  );

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: animatedValues.fadeIn,
          transform: [{ translateY: animatedValues.slideUp }]
        }
      ]}
    >
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.exerciseInfo}>
              <FontAwesome5 name="dumbbell" size={24} color="#667eea" />
              <Text style={styles.exerciseTitle}>{exercise.name}</Text>
            </View>
            <Text style={styles.completionMessage}>
              {getPerformanceMessage(accuracy)}
            </Text>
          </View>
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <FontAwesome5 name="times" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Performance Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Workout Complete! 🎉</Text>
          <Text style={styles.summaryText}>
            You completed {sets} sets of {exercise.name} with {actualReps} total reps 
            in {formatDuration(workoutDuration)}.
          </Text>
          
          {analysisResult && (
            <View style={styles.aiInsight}>
              <FontAwesome5 name="brain" size={16} color="#667eea" />
              <Text style={styles.aiInsightText}>
                AI Analysis: {accuracy >= 80 ? 'Excellent' : accuracy >= 60 ? 'Good' : 'Improving'} form quality detected
              </Text>
            </View>
          )}
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsContainer}>
          <Text style={styles.sectionTitle}>Session Metrics</Text>
          <View style={styles.metricsGrid}>
            {metrics.map((metric, index) => (
              <MetricCard key={index} {...metric} />
            ))}
          </View>
        </View>

        {/* Quick Achievements */}
        <View style={styles.achievementsCard}>
          <Text style={styles.sectionTitle}>🏆 Achievements</Text>
          <View style={styles.achievementsList}>
            <View style={styles.achievementItem}>
              <FontAwesome5 name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.achievementText}>Workout Completed</Text>
            </View>
            
            {accuracy >= 80 && (
              <View style={styles.achievementItem}>
                <FontAwesome5 name="medal" size={16} color="#FFD700" />
                <Text style={styles.achievementText}>Excellent Form</Text>
              </View>
            )}
            
            {actualReps >= totalReps && (
              <View style={styles.achievementItem}>
                <FontAwesome5 name="target" size={16} color="#2196F3" />
                <Text style={styles.achievementText}>Rep Goal Achieved</Text>
              </View>
            )}
            
            {workoutDuration >= exercise.duration * 60 && (
              <View style={styles.achievementItem}>
                <FontAwesome5 name="clock" size={16} color="#9C27B0" />
                <Text style={styles.achievementText}>Duration Goal Met</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Recommendations */}
        {analysisResult?.recommendations && analysisResult.recommendations.length > 0 && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.sectionTitle}>💡 Quick Tips</Text>
            {analysisResult.recommendations.slice(0, 2).map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <FontAwesome5 name="lightbulb" size={12} color="#FF9800" />
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {onViewDetails && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.detailsButton]} 
              onPress={onViewDetails}
            >
              <FontAwesome5 name="chart-bar" size={16} color="#667eea" />
              <Text style={styles.detailsButtonText}>View Detailed Analysis</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.shareButton]}
            onPress={() => {
              // TODO: Implement sharing functionality
              console.log('Share workout results');
            }}
          >
            <FontAwesome5 name="share-alt" size={16} color="#4CAF50" />
            <Text style={styles.shareButtonText}>Share Results</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 12,
  },
  completionMessage: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  aiInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
  },
  aiInsightText: {
    fontSize: 14,
    color: '#667eea',
    marginLeft: 8,
    fontWeight: '600',
  },
  metricsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: (width - 60) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  metricIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  achievementsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 12,
    fontWeight: '600',
  },
  recommendationsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.2)',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  detailsButton: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  detailsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 8,
  },
  shareButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 8,
  },
});

export default SessionSummary;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { AnalysisResult } from '../../services/fitnessBackendService';
import { ExerciseType, WorkoutSession } from '../../services/simpleFitnessService';

const { width } = Dimensions.get('window');

interface ProgressTrackingProps {
  currentSession?: AnalysisResult;
  exercise: ExerciseType;
  workoutHistory: WorkoutSession[];
  userId: string;
  onClose?: () => void;
}

interface ProgressMetric {
  label: string;
  current: number;
  previous: number;
  unit: string;
  icon: string;
  color: string;
  trend: 'up' | 'down' | 'stable';
  improvement: number;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  icon: string;
  color: string;
  deadline?: string;
  achieved: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt: string;
  category: 'form' | 'consistency' | 'milestone' | 'improvement';
}

const ProgressTracking: React.FC<ProgressTrackingProps> = ({
  currentSession,
  exercise,
  workoutHistory,
  userId,
  onClose
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'goals' | 'achievements' | 'trends'>('overview');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const getExerciseHistory = (): WorkoutSession[] => {
    return workoutHistory
      .filter(session => session.exerciseType === exercise.type)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const calculateProgressMetrics = (): ProgressMetric[] => {
    const history = getExerciseHistory();
    const metrics: ProgressMetric[] = [];

    if (history.length < 2) {
      return []; // Need at least 2 sessions for comparison
    }

    const current = history[0];
    const previous = history[1];

    // Form Accuracy (if available from current session)
    if (currentSession?.accuracy) {
      const previousAccuracy = 75; // Mock previous accuracy - in real app, store this
      const improvement = currentSession.accuracy - previousAccuracy;
      
      metrics.push({
        label: 'Form Accuracy',
        current: currentSession.accuracy,
        previous: previousAccuracy,
        unit: '%',
        icon: 'bullseye',
        color: currentSession.accuracy >= 80 ? '#4CAF50' : '#FF9800',
        trend: improvement > 0 ? 'up' : improvement < 0 ? 'down' : 'stable',
        improvement: Math.abs(improvement)
      });
    }

    // Reps per session
    const repsImprovement = current.reps - previous.reps;
    metrics.push({
      label: 'Reps Completed',
      current: current.reps,
      previous: previous.reps,
      unit: 'reps',
      icon: 'repeat',
      color: '#2196F3',
      trend: repsImprovement > 0 ? 'up' : repsImprovement < 0 ? 'down' : 'stable',
      improvement: Math.abs(repsImprovement)
    });

    // Duration efficiency (reps per minute)
    const currentEfficiency = current.reps / (current.duration / 60);
    const previousEfficiency = previous.reps / (previous.duration / 60);
    const efficiencyImprovement = currentEfficiency - previousEfficiency;
    
    metrics.push({
      label: 'Efficiency',
      current: Math.round(currentEfficiency * 10) / 10,
      previous: Math.round(previousEfficiency * 10) / 10,
      unit: 'reps/min',
      icon: 'tachometer-alt',
      color: '#9C27B0',
      trend: efficiencyImprovement > 0 ? 'up' : efficiencyImprovement < 0 ? 'down' : 'stable',
      improvement: Math.round(Math.abs(efficiencyImprovement) * 10) / 10
    });

    // Calories burned
    const caloriesImprovement = current.calories - previous.calories;
    metrics.push({
      label: 'Calories Burned',
      current: current.calories,
      previous: previous.calories,
      unit: 'cal',
      icon: 'fire',
      color: '#FF5722',
      trend: caloriesImprovement > 0 ? 'up' : caloriesImprovement < 0 ? 'down' : 'stable',
      improvement: Math.abs(caloriesImprovement)
    });

    return metrics;
  };

  const generateGoals = (): Goal[] => {
    const history = getExerciseHistory();
    const goals: Goal[] = [];

    // Form accuracy goal
    if (currentSession?.accuracy) {
      goals.push({
        id: 'form_accuracy',
        title: 'Perfect Form',
        description: 'Achieve 90% form accuracy',
        target: 90,
        current: currentSession.accuracy,
        unit: '%',
        icon: 'bullseye',
        color: '#4CAF50',
        achieved: currentSession.accuracy >= 90
      });
    }

    // Consistency goal
    const thisWeekSessions = history.filter(session => {
      const sessionDate = new Date(session.date);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return sessionDate > weekAgo;
    });

    goals.push({
      id: 'weekly_consistency',
      title: 'Weekly Consistency',
      description: 'Complete 3 workouts this week',
      target: 3,
      current: thisWeekSessions.length,
      unit: 'sessions',
      icon: 'calendar-check',
      color: '#2196F3',
      achieved: thisWeekSessions.length >= 3
    });

    // Rep improvement goal
    if (history.length >= 2) {
      const averageReps = history.slice(0, 5).reduce((sum, s) => sum + s.reps, 0) / Math.min(5, history.length);
      const targetReps = Math.ceil(averageReps * 1.1); // 10% improvement
      
      goals.push({
        id: 'rep_improvement',
        title: 'Rep Goal',
        description: `Reach ${targetReps} reps in a session`,
        target: targetReps,
        current: history[0]?.reps || 0,
        unit: 'reps',
        icon: 'target',
        color: '#FF5722',
        achieved: (history[0]?.reps || 0) >= targetReps
      });
    }

    return goals;
  };

  const generateAchievements = (): Achievement[] => {
    const history = getExerciseHistory();
    const achievements: Achievement[] = [];

    // First workout achievement
    if (history.length >= 1) {
      achievements.push({
        id: 'first_workout',
        title: 'Getting Started',
        description: 'Completed your first workout session',
        icon: 'play',
        color: '#4CAF50',
        unlockedAt: history[history.length - 1].date,
        category: 'milestone'
      });
    }

    // Consistency achievements
    if (history.length >= 5) {
      achievements.push({
        id: 'five_sessions',
        title: 'Dedicated Trainee',
        description: 'Completed 5 workout sessions',
        icon: 'medal',
        color: '#FF9800',
        unlockedAt: history[history.length - 5].date,
        category: 'milestone'
      });
    }

    if (history.length >= 10) {
      achievements.push({
        id: 'ten_sessions',
        title: 'Fitness Enthusiast',
        description: 'Completed 10 workout sessions',
        icon: 'trophy',
        color: '#FFD700',
        unlockedAt: history[history.length - 10].date,
        category: 'milestone'
      });
    }

    // Form accuracy achievements
    if (currentSession?.accuracy && currentSession.accuracy >= 90) {
      achievements.push({
        id: 'perfect_form',
        title: 'Perfect Form',
        description: 'Achieved 90%+ form accuracy',
        icon: 'bullseye',
        color: '#9C27B0',
        unlockedAt: new Date().toISOString(),
        category: 'form'
      });
    }

    // Improvement achievements
    if (history.length >= 2) {
      const recent = history.slice(0, 3);
      const older = history.slice(3, 6);
      
      if (recent.length >= 2 && older.length >= 2) {
        const recentAvgReps = recent.reduce((sum, s) => sum + s.reps, 0) / recent.length;
        const olderAvgReps = older.reduce((sum, s) => sum + s.reps, 0) / older.length;
        
        if (recentAvgReps > olderAvgReps * 1.2) { // 20% improvement
          achievements.push({
            id: 'improvement_streak',
            title: 'Getting Stronger',
            description: 'Improved performance by 20%',
            icon: 'chart-line',
            color: '#00BCD4',
            unlockedAt: history[0].date,
            category: 'improvement'
          });
        }
      }
    }

    return achievements.sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime());
  };

  const getProgressChartData = () => {
    const history = getExerciseHistory().slice(0, 10).reverse(); // Last 10 sessions, chronological order
    
    if (history.length < 2) return null;

    return {
      labels: history.map((_, index) => `S${index + 1}`),
      datasets: [
        {
          name: 'Reps',
          data: history.map(s => s.reps),
          color: '#2196F3'
        },
        {
          name: 'Duration (min)',
          data: history.map(s => Math.round(s.duration / 60)),
          color: '#9C27B0'
        },
        ...(currentSession?.accuracy ? [{
          name: 'Form Accuracy (%)',
          data: history.map((_, index) => {
            // Mock form accuracy data for historical sessions
            return index === history.length - 1 ? currentSession.accuracy : Math.floor(Math.random() * 20) + 70;
          }),
          color: '#4CAF50'
        }] : [])
      ]
    };
  };

  const getTrendAnalysis = () => {
    const history = getExerciseHistory();
    
    if (history.length < 3) {
      return {
        trend: 'insufficient_data',
        message: 'Complete more sessions to see trend analysis',
        recommendations: ['Keep exercising regularly to track your progress']
      };
    }

    const recent = history.slice(0, 3);
    const older = history.slice(3, 6);
    
    if (older.length === 0) {
      return {
        trend: 'early_stage',
        message: 'Building your exercise foundation',
        recommendations: ['Focus on consistency', 'Maintain proper form', 'Gradually increase intensity']
      };
    }

    const recentAvgReps = recent.reduce((sum, s) => sum + s.reps, 0) / recent.length;
    const olderAvgReps = older.reduce((sum, s) => sum + s.reps, 0) / older.length;
    const improvement = ((recentAvgReps - olderAvgReps) / olderAvgReps) * 100;

    if (improvement > 10) {
      return {
        trend: 'improving',
        message: `Great progress! You've improved by ${Math.round(improvement)}%`,
        recommendations: [
          'Continue your current routine',
          'Consider increasing difficulty',
          'Focus on maintaining form quality'
        ]
      };
    } else if (improvement > -5) {
      return {
        trend: 'stable',
        message: 'Maintaining consistent performance',
        recommendations: [
          'Try varying your routine',
          'Focus on form improvements',
          'Consider adding more challenging exercises'
        ]
      };
    } else {
      return {
        trend: 'declining',
        message: 'Performance has decreased recently',
        recommendations: [
          'Ensure adequate rest between sessions',
          'Check if you need to adjust difficulty',
          'Focus on proper form over quantity'
        ]
      };
    }
  };

  const compareWithPrevious = () => {
    const history = getExerciseHistory();
    
    if (history.length < 2) return null;

    const current = history[0];
    const previous = history[1];

    return {
      reps: {
        current: current.reps,
        previous: previous.reps,
        change: current.reps - previous.reps,
        percentage: Math.round(((current.reps - previous.reps) / previous.reps) * 100)
      },
      duration: {
        current: current.duration,
        previous: previous.duration,
        change: current.duration - previous.duration,
        percentage: Math.round(((current.duration - previous.duration) / previous.duration) * 100)
      },
      calories: {
        current: current.calories,
        previous: previous.calories,
        change: current.calories - previous.calories,
        percentage: Math.round(((current.calories - previous.calories) / previous.calories) * 100)
      }
    };
  };

  const renderOverviewTab = () => {
    const metrics = calculateProgressMetrics();
    const comparison = compareWithPrevious();
    const trendAnalysis = getTrendAnalysis();

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Progress Metrics */}
        {metrics.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress Metrics</Text>
            <View style={styles.metricsGrid}>
              {metrics.map((metric, index) => (
                <View key={index} style={styles.metricCard}>
                  <View style={[styles.metricIcon, { backgroundColor: `${metric.color}20` }]}>
                    <FontAwesome5 name={metric.icon} size={20} color={metric.color} />
                  </View>
                  <Text style={styles.metricValue}>
                    {metric.current}{metric.unit}
                  </Text>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <View style={styles.metricTrend}>
                    <FontAwesome5 
                      name={metric.trend === 'up' ? 'arrow-up' : metric.trend === 'down' ? 'arrow-down' : 'minus'} 
                      size={12} 
                      color={metric.trend === 'up' ? '#4CAF50' : metric.trend === 'down' ? '#F44336' : '#9E9E9E'} 
                    />
                    <Text style={[
                      styles.metricTrendText,
                      { color: metric.trend === 'up' ? '#4CAF50' : metric.trend === 'down' ? '#F44336' : '#9E9E9E' }
                    ]}>
                      {metric.improvement}{metric.unit}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Session Comparison */}
        {comparison && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>vs Previous Session</Text>
            <View style={styles.comparisonCard}>
              {Object.entries(comparison).map(([key, data]) => (
                <View key={key} style={styles.comparisonItem}>
                  <Text style={styles.comparisonLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                  <View style={styles.comparisonValues}>
                    <Text style={styles.comparisonCurrent}>{data.current}</Text>
                    <View style={styles.comparisonChange}>
                      <FontAwesome5 
                        name={data.change >= 0 ? 'arrow-up' : 'arrow-down'} 
                        size={10} 
                        color={data.change >= 0 ? '#4CAF50' : '#F44336'} 
                      />
                      <Text style={[
                        styles.comparisonChangeText,
                        { color: data.change >= 0 ? '#4CAF50' : '#F44336' }
                      ]}>
                        {Math.abs(data.percentage)}%
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Trend Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trend Analysis</Text>
          <View style={styles.trendCard}>
            <View style={styles.trendHeader}>
              <FontAwesome5 
                name={
                  trendAnalysis.trend === 'improving' ? 'chart-line' :
                  trendAnalysis.trend === 'stable' ? 'chart-bar' :
                  trendAnalysis.trend === 'declining' ? 'chart-line-down' : 'info-circle'
                } 
                size={20} 
                color={
                  trendAnalysis.trend === 'improving' ? '#4CAF50' :
                  trendAnalysis.trend === 'stable' ? '#2196F3' :
                  trendAnalysis.trend === 'declining' ? '#FF9800' : '#9E9E9E'
                } 
              />
              <Text style={styles.trendMessage}>{trendAnalysis.message}</Text>
            </View>
            <View style={styles.recommendationsList}>
              {trendAnalysis.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <FontAwesome5 name="lightbulb" size={12} color="#FF9800" />
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderGoalsTab = () => {
    const goals = generateGoals();

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Goals</Text>
            <TouchableOpacity 
              style={styles.addGoalButton}
              onPress={() => setShowGoalModal(true)}
            >
              <FontAwesome5 name="plus" size={16} color="#667eea" />
            </TouchableOpacity>
          </View>
          
          {goals.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome5 name="target" size={48} color="rgba(255, 255, 255, 0.3)" />
              <Text style={styles.emptyStateTitle}>No Goals Set</Text>
              <Text style={styles.emptyStateText}>Set your first goal to track your progress</Text>
            </View>
          ) : (
            <View style={styles.goalsList}>
              {goals.map((goal, index) => (
                <View key={index} style={[styles.goalCard, goal.achieved && styles.achievedGoalCard]}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalInfo}>
                      <FontAwesome5 name={goal.icon} size={20} color={goal.color} />
                      <Text style={styles.goalTitle}>{goal.title}</Text>
                      {goal.achieved && (
                        <FontAwesome5 name="check-circle" size={16} color="#4CAF50" />
                      )}
                    </View>
                  </View>
                  <Text style={styles.goalDescription}>{goal.description}</Text>
                  
                  <View style={styles.goalProgress}>
                    <View style={styles.goalProgressBar}>
                      <View 
                        style={[
                          styles.goalProgressFill, 
                          { 
                            width: `${Math.min((goal.current / goal.target) * 100, 100)}%`,
                            backgroundColor: goal.color
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.goalProgressText}>
                      {goal.current} / {goal.target} {goal.unit}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderAchievementsTab = () => {
    const achievements = generateAchievements();

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements Unlocked</Text>
          
          {achievements.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome5 name="trophy" size={48} color="rgba(255, 255, 255, 0.3)" />
              <Text style={styles.emptyStateTitle}>No Achievements Yet</Text>
              <Text style={styles.emptyStateText}>Complete workouts to unlock achievements</Text>
            </View>
          ) : (
            <View style={styles.achievementsList}>
              {achievements.map((achievement, index) => (
                <View key={index} style={styles.achievementCard}>
                  <View style={[styles.achievementIcon, { backgroundColor: `${achievement.color}20` }]}>
                    <FontAwesome5 name={achievement.icon} size={24} color={achievement.color} />
                  </View>
                  <View style={styles.achievementContent}>
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                    <Text style={styles.achievementDescription}>{achievement.description}</Text>
                    <Text style={styles.achievementDate}>
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[styles.achievementCategory, { backgroundColor: `${achievement.color}20` }]}>
                    <Text style={[styles.achievementCategoryText, { color: achievement.color }]}>
                      {achievement.category.toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderTrendsTab = () => {
    const chartData = getProgressChartData();
    const history = getExerciseHistory();

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Progress Chart */}
        {chartData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress Over Time</Text>
            <View style={styles.chartContainer}>
              <Text style={styles.chartNote}>Last {chartData.labels.length} Sessions</Text>
              {/* Simple chart representation - in a real app, you'd use a charting library */}
              <View style={styles.simpleChart}>
                {chartData.datasets.map((dataset, datasetIndex) => (
                  <View key={datasetIndex} style={styles.chartDataset}>
                    <View style={styles.chartLegend}>
                      <View style={[styles.chartLegendColor, { backgroundColor: dataset.color }]} />
                      <Text style={styles.chartLegendText}>{dataset.name}</Text>
                    </View>
                    <View style={styles.chartBars}>
                      {dataset.data.map((value, index) => {
                        const maxValue = Math.max(...dataset.data);
                        const height = (value / maxValue) * 60;
                        return (
                          <View key={index} style={styles.chartBarContainer}>
                            <View 
                              style={[
                                styles.chartBar, 
                                { 
                                  height: height,
                                  backgroundColor: dataset.color
                                }
                              ]} 
                            />
                            <Text style={styles.chartBarLabel}>{chartData.labels[index]}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Historical Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session History</Text>
          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome5 name="history" size={48} color="rgba(255, 255, 255, 0.3)" />
              <Text style={styles.emptyStateTitle}>No History Available</Text>
              <Text style={styles.emptyStateText}>Complete workouts to see your history</Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {history.slice(0, 10).map((session, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyDate}>
                    <Text style={styles.historyDateText}>
                      {new Date(session.date).toLocaleDateString()}
                    </Text>
                    <Text style={styles.historyTimeText}>
                      {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View style={styles.historyStats}>
                    <View style={styles.historyStat}>
                      <FontAwesome5 name="repeat" size={12} color="#2196F3" />
                      <Text style={styles.historyStatText}>{session.reps} reps</Text>
                    </View>
                    <View style={styles.historyStat}>
                      <FontAwesome5 name="clock" size={12} color="#9C27B0" />
                      <Text style={styles.historyStatText}>{Math.round(session.duration / 60)}min</Text>
                    </View>
                    <View style={styles.historyStat}>
                      <FontAwesome5 name="fire" size={12} color="#FF5722" />
                      <Text style={styles.historyStatText}>{session.calories}cal</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: animatedValue }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FontAwesome5 name="chart-line" size={24} color="#667eea" />
          <Text style={styles.headerTitle}>Progress Tracking</Text>
        </View>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesome5 name="times" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {[
          { key: 'overview', label: 'Overview', icon: 'chart-bar' },
          { key: 'goals', label: 'Goals', icon: 'target' },
          { key: 'achievements', label: 'Achievements', icon: 'trophy' },
          { key: 'trends', label: 'Trends', icon: 'chart-line' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <FontAwesome5 
              name={tab.icon} 
              size={14} 
              color={selectedTab === tab.key ? '#667eea' : 'rgba(255, 255, 255, 0.6)'} 
            />
            <Text style={[
              styles.tabText, 
              selectedTab === tab.key && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {selectedTab === 'overview' && renderOverviewTab()}
      {selectedTab === 'goals' && renderGoalsTab()}
      {selectedTab === 'achievements' && renderAchievementsTab()}
      {selectedTab === 'trends' && renderTrendsTab()}

      {/* Goal Creation Modal */}
      <Modal
        visible={showGoalModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Goal</Text>
            <Text style={styles.modalSubtitle}>Feature coming soon!</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowGoalModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
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
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabNavigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#667eea',
  },
  tabContent: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  addGoalButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 8,
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricTrendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  comparisonCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  comparisonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  comparisonLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  comparisonValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonCurrent: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
    marginRight: 12,
  },
  comparisonChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonChangeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  trendCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendMessage: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  recommendationsList: {
    gap: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recommendationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  goalsList: {
    gap: 16,
  },
  goalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  achievedGoalCard: {
    borderColor: 'rgba(76, 175, 80, 0.3)',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  goalHeader: {
    marginBottom: 8,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 12,
    flex: 1,
  },
  goalDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
  },
  goalProgress: {
    gap: 8,
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalProgressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  achievementsList: {
    gap: 16,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  achievementCategory: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  achievementCategoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  chartContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chartNote: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 16,
  },
  simpleChart: {
    gap: 20,
  },
  chartDataset: {
    gap: 8,
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartLegendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  chartLegendText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 80,
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 20,
    borderRadius: 2,
    marginBottom: 4,
  },
  chartBarLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  historyDate: {
    marginRight: 16,
  },
  historyDateText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  historyTimeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  historyStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  historyStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyStatText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    width: width - 40,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
  },
  modalCloseButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ProgressTracking;
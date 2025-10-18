import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { AnalysisResult, PoseData } from '../../services/fitnessBackendService';
import { ExerciseType } from '../../services/simpleFitnessService';

const { width, height } = Dimensions.get('window');

interface SessionAnalysisProps {
  isVisible: boolean;
  onClose: () => void;
  analysisResult: AnalysisResult | null;
  sessionData: any[];
  exercise: ExerciseType;
  workoutDuration: number;
  totalReps: number;
  sets: number;
}

interface PerformanceMetric {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: 'up' | 'down' | 'stable';
}

const SessionAnalysis: React.FC<SessionAnalysisProps> = ({
  isVisible,
  onClose,
  analysisResult,
  sessionData,
  exercise,
  workoutDuration,
  totalReps,
  sets
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'form' | 'progress'>('overview');
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);

  useEffect(() => {
    if (analysisResult || sessionData.length > 0) {
      calculatePerformanceMetrics();
    }
  }, [analysisResult, sessionData]);

  const calculatePerformanceMetrics = () => {
    const metrics: PerformanceMetric[] = [];

    // Overall accuracy
    const averageAccuracy = analysisResult?.accuracy || 
      (sessionData.length > 0 ? 
        sessionData.reduce((acc, data) => acc + (data.poseData?.formScore || 0), 0) / sessionData.length : 0);
    
    metrics.push({
      label: 'Form Accuracy',
      value: `${Math.round(averageAccuracy)}%`,
      icon: 'bullseye',
      color: averageAccuracy >= 80 ? '#4CAF50' : averageAccuracy >= 60 ? '#FF9800' : '#F44336'
    });

    // Total reps completed
    metrics.push({
      label: 'Reps Completed',
      value: analysisResult?.totalReps || totalReps,
      icon: 'repeat',
      color: '#2196F3'
    });

    // Workout duration
    const minutes = Math.floor(workoutDuration / 60);
    const seconds = workoutDuration % 60;
    metrics.push({
      label: 'Duration',
      value: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      icon: 'clock',
      color: '#9C27B0'
    });

    // Calories burned
    const calories = analysisResult?.calories || 
      Math.round((exercise.calories * workoutDuration) / (exercise.duration * 60));
    metrics.push({
      label: 'Calories',
      value: calories,
      icon: 'fire',
      color: '#FF5722'
    });

    // Consistency score (based on form score variance)
    if (sessionData.length > 0) {
      const formScores = sessionData.map(data => data.poseData?.formScore || 0);
      const variance = calculateVariance(formScores);
      const consistencyScore = Math.max(0, 100 - variance);
      
      metrics.push({
        label: 'Consistency',
        value: `${Math.round(consistencyScore)}%`,
        icon: 'chart-line',
        color: consistencyScore >= 80 ? '#4CAF50' : consistencyScore >= 60 ? '#FF9800' : '#F44336'
      });
    }

    setPerformanceMetrics(metrics);
  };

  const calculateVariance = (values: number[]): number => {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length);
  };

  const getFormAnalysis = () => {
    if (!analysisResult?.formFeedback && sessionData.length === 0) {
      return { improvements: [], warnings: [], strengths: [] };
    }

    const feedback = analysisResult?.formFeedback || [];
    const sessionWarnings = sessionData.flatMap(data => data.poseData?.warnings || []);
    
    // Categorize feedback
    const improvements = feedback.filter(f => f.type === 'correction').map(f => f.message);
    const warnings = [...new Set(sessionWarnings)]; // Remove duplicates
    const strengths = feedback.filter(f => f.type === 'success').map(f => f.message);

    return { improvements, warnings, strengths };
  };

  const getProgressInsights = () => {
    if (sessionData.length === 0) return [];

    const insights = [];
    
    // Form improvement over time
    const firstHalfScores = sessionData.slice(0, Math.floor(sessionData.length / 2))
      .map(data => data.poseData?.formScore || 0);
    const secondHalfScores = sessionData.slice(Math.floor(sessionData.length / 2))
      .map(data => data.poseData?.formScore || 0);
    
    const firstHalfAvg = firstHalfScores.reduce((sum, score) => sum + score, 0) / firstHalfScores.length;
    const secondHalfAvg = secondHalfScores.reduce((sum, score) => sum + score, 0) / secondHalfScores.length;
    
    if (secondHalfAvg > firstHalfAvg + 5) {
      insights.push({
        type: 'improvement',
        message: 'Your form improved during the workout! 📈',
        icon: 'trending-up',
        color: '#4CAF50'
      });
    } else if (firstHalfAvg > secondHalfAvg + 5) {
      insights.push({
        type: 'decline',
        message: 'Form declined due to fatigue. Consider shorter sets. 📉',
        icon: 'trending-down',
        color: '#FF9800'
      });
    }

    // Rep consistency
    const repTimes = sessionData.map((data, index) => 
      index > 0 ? data.timestamp - sessionData[index - 1].timestamp : 0
    ).filter(time => time > 0);
    
    const avgRepTime = repTimes.reduce((sum, time) => sum + time, 0) / repTimes.length;
    const repTimeVariance = calculateVariance(repTimes);
    
    if (repTimeVariance < avgRepTime * 0.2) {
      insights.push({
        type: 'consistency',
        message: 'Excellent rep timing consistency! 🎯',
        icon: 'clock',
        color: '#2196F3'
      });
    }

    return insights;
  };

  const renderOverviewTab = () => {
    const formAnalysis = getFormAnalysis();
    
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Performance Metrics Grid */}
        <View style={styles.metricsGrid}>
          {performanceMetrics.map((metric, index) => (
            <View key={index} style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: `${metric.color}20` }]}>
                <FontAwesome5 name={metric.icon} size={20} color={metric.color} />
              </View>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Workout Summary</Text>
          <Text style={styles.summaryText}>
            Completed {sets} sets of {exercise.name} with {totalReps} total reps in {Math.floor(workoutDuration / 60)} minutes.
          </Text>
          
          {analysisResult && (
            <View style={styles.aiSummary}>
              <FontAwesome5 name="brain" size={16} color="#667eea" />
              <Text style={styles.aiSummaryText}>
                AI Analysis: {analysisResult.accuracy >= 80 ? 'Excellent' : analysisResult.accuracy >= 60 ? 'Good' : 'Needs Improvement'} form quality
              </Text>
            </View>
          )}
        </View>

        {/* Recommendations */}
        {analysisResult?.recommendations && analysisResult.recommendations.length > 0 && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.cardTitle}>💡 Recommendations</Text>
            {analysisResult.recommendations.slice(0, 3).map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <FontAwesome5 name="lightbulb" size={12} color="#FF9800" />
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderFormTab = () => {
    const formAnalysis = getFormAnalysis();
    
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Form Score Chart */}
        {sessionData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>Form Score Over Time</Text>
            <View style={styles.chartContainer}>
              {sessionData.map((data, index) => {
                const score = data.poseData?.formScore || 0;
                const height = (score / 100) * 80;
                return (
                  <View key={index} style={styles.chartBar}>
                    <View 
                      style={[
                        styles.chartBarFill, 
                        { 
                          height: `${height}%`,
                          backgroundColor: score >= 80 ? '#4CAF50' : score >= 60 ? '#FF9800' : '#F44336'
                        }
                      ]} 
                    />
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Strengths */}
        {formAnalysis.strengths.length > 0 && (
          <View style={styles.feedbackCard}>
            <Text style={[styles.cardTitle, { color: '#4CAF50' }]}>✅ Strengths</Text>
            {formAnalysis.strengths.map((strength, index) => (
              <Text key={index} style={styles.feedbackText}>• {strength}</Text>
            ))}
          </View>
        )}

        {/* Areas for Improvement */}
        {formAnalysis.improvements.length > 0 && (
          <View style={styles.feedbackCard}>
            <Text style={[styles.cardTitle, { color: '#2196F3' }]}>🎯 Areas for Improvement</Text>
            {formAnalysis.improvements.map((improvement, index) => (
              <Text key={index} style={styles.feedbackText}>• {improvement}</Text>
            ))}
          </View>
        )}

        {/* Common Issues */}
        {formAnalysis.warnings.length > 0 && (
          <View style={styles.feedbackCard}>
            <Text style={[styles.cardTitle, { color: '#FF9800' }]}>⚠️ Common Issues</Text>
            {formAnalysis.warnings.slice(0, 5).map((warning, index) => (
              <Text key={index} style={styles.feedbackText}>• {warning}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderProgressTab = () => {
    const insights = getProgressInsights();
    
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Progress Insights */}
        {insights.length > 0 && (
          <View style={styles.insightsCard}>
            <Text style={styles.cardTitle}>📊 Progress Insights</Text>
            {insights.map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <FontAwesome5 name={insight.icon} size={16} color={insight.color} />
                <Text style={styles.insightText}>{insight.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Session History Comparison */}
        <View style={styles.comparisonCard}>
          <Text style={styles.cardTitle}>📈 Session Comparison</Text>
          <Text style={styles.comparisonText}>
            This feature will compare your performance with previous sessions once you complete more workouts.
          </Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </View>

        {/* Goals and Achievements */}
        <View style={styles.goalsCard}>
          <Text style={styles.cardTitle}>🎯 Goals & Achievements</Text>
          <View style={styles.goalItem}>
            <FontAwesome5 name="trophy" size={16} color="#FFD700" />
            <Text style={styles.goalText}>Workout Completed!</Text>
          </View>
          {performanceMetrics.find(m => m.label === 'Form Accuracy' && parseInt(m.value.toString()) >= 80) && (
            <View style={styles.goalItem}>
              <FontAwesome5 name="medal" size={16} color="#4CAF50" />
              <Text style={styles.goalText}>Excellent Form Achievement</Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <FontAwesome5 name="chart-bar" size={24} color="#667eea" />
            <Text style={styles.headerTitle}>Session Analysis</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesome5 name="times" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          {[
            { key: 'overview', label: 'Overview', icon: 'chart-pie' },
            { key: 'form', label: 'Form', icon: 'user-check' },
            { key: 'progress', label: 'Progress', icon: 'chart-line' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
              onPress={() => setSelectedTab(tab.key as any)}
            >
              <FontAwesome5 
                name={tab.icon} 
                size={16} 
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
        {selectedTab === 'form' && renderFormTab()}
        {selectedTab === 'progress' && renderProgressTab()}
      </View>
    </Modal>
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
    paddingTop: 50,
    paddingBottom: 20,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#667eea',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
    marginBottom: 20,
  },
  metricCard: {
    width: (width - 60) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    margin: 5,
    alignItems: 'center',
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
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: 12,
  },
  aiSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  aiSummaryText: {
    fontSize: 12,
    color: '#667eea',
    marginLeft: 8,
    flex: 1,
  },
  recommendationsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    marginTop: 12,
  },
  chartBar: {
    flex: 1,
    height: '100%',
    marginHorizontal: 1,
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 2,
  },
  feedbackCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  feedbackText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: 4,
  },
  insightsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  comparisonCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  comparisonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  goalsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 12,
    fontWeight: '600',
  },
});

export default SessionAnalysis;
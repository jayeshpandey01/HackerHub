import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface HealthMetricsProps {
  medicalProfile: any;
  todayStats: any;
  onBack: () => void;
}

const HealthMetrics: React.FC<HealthMetricsProps> = ({
  medicalProfile,
  todayStats,
  onBack,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  const periods = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  const calculateBMI = () => {
    if (medicalProfile?.weight && medicalProfile?.height) {
      const weight = parseFloat(medicalProfile.weight);
      const height = parseFloat(medicalProfile.height) / 100;
      return (weight / (height * height)).toFixed(1);
    }
    return 'N/A';
  };

  const getBMICategory = (bmi: string) => {
    const bmiValue = parseFloat(bmi);
    if (bmiValue < 18.5) return { category: 'Underweight', color: '#3498db' };
    if (bmiValue < 25) return { category: 'Normal', color: '#2ecc71' };
    if (bmiValue < 30) return { category: 'Overweight', color: '#f39c12' };
    return { category: 'Obese', color: '#e74c3c' };
  };

  const bmi = calculateBMI();
  const bmiInfo = getBMICategory(bmi);

  const healthMetrics = [
    {
      title: 'Physical Activity',
      metrics: [
        { label: 'Steps', value: todayStats.steps, target: 10000, unit: '', icon: 'walking', color: '#3498db' },
        { label: 'Active Minutes', value: todayStats.activeMinutes, target: 60, unit: 'min', icon: 'clock', color: '#2ecc71' },
        { label: 'Calories Burned', value: todayStats.calories, target: 500, unit: 'cal', icon: 'fire', color: '#f39c12' },
      ]
    },
    {
      title: 'Vital Signs',
      metrics: [
        { label: 'Heart Rate', value: todayStats.heartRate, target: 75, unit: 'bpm', icon: 'heartbeat', color: '#e74c3c' },
        { label: 'BMI', value: bmi, target: '22.0', unit: '', icon: 'weight', color: bmiInfo.color },
        { label: 'Sleep', value: 7.5, target: 8, unit: 'hrs', icon: 'bed', color: '#9b59b6' },
      ]
    },
    {
      title: 'Health Indicators',
      metrics: [
        { label: 'Hydration', value: 6, target: 8, unit: 'glasses', icon: 'tint', color: '#1abc9c' },
        { label: 'Mood Score', value: 8, target: 7, unit: '/10', icon: 'smile', color: '#f39c12' },
        { label: 'Stress Level', value: 3, target: 5, unit: '/10', icon: 'brain', color: '#e67e22' },
      ]
    },
  ];

  const getProgressPercentage = (value: number, target: number) => {
    return Math.min((value / target) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return '#2ecc71';
    if (percentage >= 60) return '#f39c12';
    return '#e74c3c';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <FontAwesome5 name="arrow-left" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Metrics</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text style={[
                styles.periodText,
                selectedPeriod === period.key && styles.periodTextActive
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Health Score Overview */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreTitle}>Overall Health Score</Text>
            <FontAwesome5 name="info-circle" size={16} color="#666" />
          </View>
          <View style={styles.scoreContent}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>85</Text>
              <Text style={styles.scoreUnit}>%</Text>
            </View>
            <View style={styles.scoreDetails}>
              <Text style={styles.scoreDescription}>
                Your health score is calculated based on your activity, vital signs, and health indicators.
              </Text>
              <View style={styles.scoreImprovement}>
                <FontAwesome5 name="arrow-up" size={12} color="#2ecc71" />
                <Text style={styles.improvementText}>+5% from last week</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Metrics Sections */}
        {healthMetrics.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.metricsSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            
            {section.metrics.map((metric, metricIndex) => {
              const progress = getProgressPercentage(parseFloat(metric.value.toString()), parseFloat(metric.target.toString()));
              const progressColor = getProgressColor(progress);
              
              return (
                <View key={metricIndex} style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <View style={styles.metricIcon}>
                      <FontAwesome5 name={metric.icon} size={20} color={metric.color} />
                    </View>
                    <View style={styles.metricInfo}>
                      <Text style={styles.metricLabel}>{metric.label}</Text>
                      <Text style={styles.metricValue}>
                        {metric.value}{metric.unit}
                      </Text>
                    </View>
                    <View style={styles.metricTarget}>
                      <Text style={styles.targetLabel}>Target</Text>
                      <Text style={styles.targetValue}>
                        {metric.target}{metric.unit}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${progress}%`,
                            backgroundColor: progressColor
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        {/* Health Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Health Insights</Text>
          
          <View style={styles.insightCard}>
            <FontAwesome5 name="lightbulb" size={20} color="#f39c12" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Great Progress!</Text>
              <Text style={styles.insightText}>
                You've exceeded your step goal for 5 days this week. Keep up the excellent work!
              </Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <FontAwesome5 name="exclamation-triangle" size={20} color="#e74c3c" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Hydration Alert</Text>
              <Text style={styles.insightText}>
                You're below your daily water intake goal. Try to drink 2 more glasses today.
              </Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <FontAwesome5 name="heart" size={20} color="#e74c3c" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Heart Rate Trend</Text>
              <Text style={styles.insightText}>
                Your resting heart rate has improved by 3 bpm over the past month. Excellent cardiovascular progress!
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <FontAwesome5 name="plus" size={16} color="#667eea" />
              <Text style={styles.actionText}>Log Water</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <FontAwesome5 name="weight" size={16} color="#667eea" />
              <Text style={styles.actionText}>Record Weight</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <FontAwesome5 name="heartbeat" size={16} color="#667eea" />
              <Text style={styles.actionText}>Check Pulse</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <FontAwesome5 name="moon" size={16} color="#667eea" />
              <Text style={styles.actionText}>Log Sleep</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginVertical: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#667eea',
  },
  periodText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  periodTextActive: {
    color: '#fff',
  },
  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#667eea',
  },
  scoreUnit: {
    fontSize: 12,
    color: '#667eea',
    marginTop: -4,
  },
  scoreDetails: {
    flex: 1,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  scoreImprovement: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  improvementText: {
    fontSize: 12,
    color: '#2ecc71',
    fontWeight: '500',
    marginLeft: 4,
  },
  metricsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  metricCard: {
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
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricInfo: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  metricTarget: {
    alignItems: 'flex-end',
  },
  targetLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  targetValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    minWidth: 35,
    textAlign: 'right',
  },
  insightsSection: {
    marginBottom: 20,
  },
  insightCard: {
    flexDirection: 'row',
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
  insightContent: {
    flex: 1,
    marginLeft: 12,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionsSection: {
    marginBottom: 30,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
  },
});

export default HealthMetrics;
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

interface PatientAnalyticsProps {
  patient: any;
  onBack: () => void;
}

const PatientAnalytics: React.FC<PatientAnalyticsProps> = ({
  patient,
  onBack,
}) => {
  const [selectedMetric, setSelectedMetric] = useState('steps');
  const [timeRange, setTimeRange] = useState('7d');

  // Mock data for different metrics
  const getMetricData = (metric: string) => {
    const baseData = patient.activities || [];
    switch (metric) {
      case 'steps':
        return baseData.map((activity: any) => ({
          date: activity.date,
          value: activity.steps,
          target: 8000,
        }));
      case 'heartRate':
        return baseData.map((activity: any) => ({
          date: activity.date,
          value: activity.heartRate,
          target: 75,
        }));
      case 'bloodSugar':
        return baseData.map((activity: any) => ({
          date: activity.date,
          value: activity.bloodSugar || Math.floor(Math.random() * 50) + 100,
          target: 120,
        }));
      case 'bloodPressure':
        return baseData.map((activity: any) => ({
          date: activity.date,
          value: activity.bloodPressure || '120/80',
          systolic: parseInt(activity.bloodPressure?.split('/')[0] || '120'),
          diastolic: parseInt(activity.bloodPressure?.split('/')[1] || '80'),
        }));
      case 'mood':
        return baseData.map((activity: any) => ({
          date: activity.date,
          value: activity.mood || Math.floor(Math.random() * 4) + 6,
          target: 7,
        }));
      default:
        return [];
    }
  };

  const metrics = [
    { key: 'steps', label: 'Steps', icon: 'walking', color: '#3498db', unit: 'steps' },
    { key: 'heartRate', label: 'Heart Rate', icon: 'heartbeat', color: '#e74c3c', unit: 'bpm' },
    { key: 'bloodSugar', label: 'Blood Sugar', icon: 'tint', color: '#9b59b6', unit: 'mg/dL' },
    { key: 'bloodPressure', label: 'Blood Pressure', icon: 'thermometer-half', color: '#f39c12', unit: 'mmHg' },
    { key: 'mood', label: 'Mood', icon: 'smile', color: '#2ecc71', unit: '/10' },
  ];

  const timeRanges = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '3 Months' },
  ];

  const currentMetric = metrics.find(m => m.key === selectedMetric);
  const metricData = getMetricData(selectedMetric);

  const renderChart = () => {
    if (metricData.length === 0) return null;

    const maxValue = Math.max(...metricData.map(d => 
      selectedMetric === 'bloodPressure' ? d.systolic : d.value
    ));
    const minValue = Math.min(...metricData.map(d => 
      selectedMetric === 'bloodPressure' ? d.diastolic : d.value
    ));
    const range = maxValue - minValue;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>{currentMetric?.label} Trend</Text>
          <Text style={styles.chartSubtitle}>Last {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '3 months'}</Text>
        </View>
        
        <View style={styles.chart}>
          <View style={styles.yAxis}>
            <Text style={styles.axisLabel}>{maxValue}</Text>
            <Text style={styles.axisLabel}>{Math.round((maxValue + minValue) / 2)}</Text>
            <Text style={styles.axisLabel}>{minValue}</Text>
          </View>
          
          <View style={styles.chartArea}>
            {metricData.map((data, index) => {
              const height = selectedMetric === 'bloodPressure' 
                ? ((data.systolic - minValue) / range) * 120
                : ((data.value - minValue) / range) * 120;
              
              return (
                <View key={index} style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: Math.max(height, 10),
                        backgroundColor: currentMetric?.color 
                      }
                    ]} 
                  />
                  <Text style={styles.barLabel}>
                    {new Date(data.date).getDate()}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
        
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: currentMetric?.color }]} />
            <Text style={styles.legendText}>{currentMetric?.label}</Text>
          </View>
          {currentMetric?.key !== 'bloodPressure' && (
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#95a5a6' }]} />
              <Text style={styles.legendText}>Target</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderMetricCards = () => {
    const latestData = metricData[metricData.length - 1];
    if (!latestData) return null;

    return (
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Current</Text>
          <Text style={[styles.metricValue, { color: currentMetric?.color }]}>
            {selectedMetric === 'bloodPressure' ? latestData.value : `${latestData.value}${currentMetric?.unit}`}
          </Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Average</Text>
          <Text style={styles.metricValue}>
            {selectedMetric === 'bloodPressure' 
              ? `${Math.round(metricData.reduce((sum, d) => sum + d.systolic, 0) / metricData.length)}/${Math.round(metricData.reduce((sum, d) => sum + d.diastolic, 0) / metricData.length)}`
              : `${Math.round(metricData.reduce((sum, d) => sum + d.value, 0) / metricData.length)}${currentMetric?.unit}`
            }
          </Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Trend</Text>
          <View style={styles.trendContainer}>
            <FontAwesome5 
              name={metricData[metricData.length - 1].value > metricData[0].value ? 'arrow-up' : 'arrow-down'} 
              size={16} 
              color={metricData[metricData.length - 1].value > metricData[0].value ? '#e74c3c' : '#2ecc71'} 
            />
            <Text style={styles.trendText}>
              {Math.abs(((metricData[metricData.length - 1].value - metricData[0].value) / metricData[0].value * 100)).toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return '#2ecc71';
      case 'improving': return '#3498db';
      case 'needs_attention': return '#f39c12';
      case 'critical': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <FontAwesome5 name="arrow-left" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Analytics</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Patient Info */}
        <View style={styles.patientInfo}>
          <View style={styles.patientAvatar}>
            <Text style={styles.avatarEmoji}>{patient.avatar}</Text>
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientAge}>Age: {patient.age}</Text>
            <Text style={styles.patientCondition}>{patient.condition}</Text>
          </View>
          <View style={styles.patientStatus}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(patient.status) }]} />
            <Text style={styles.statusText}>{patient.status.replace('_', ' ')}</Text>
            <Text style={styles.healthScore}>{patient.healthScore}%</Text>
          </View>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {timeRanges.map((range) => (
            <TouchableOpacity
              key={range.key}
              style={[
                styles.timeRangeButton,
                timeRange === range.key && styles.timeRangeButtonActive
              ]}
              onPress={() => setTimeRange(range.key)}
            >
              <Text style={[
                styles.timeRangeText,
                timeRange === range.key && styles.timeRangeTextActive
              ]}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Metric Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricSelector}>
          {metrics.map((metric) => (
            <TouchableOpacity
              key={metric.key}
              style={[
                styles.metricButton,
                selectedMetric === metric.key && { backgroundColor: metric.color }
              ]}
              onPress={() => setSelectedMetric(metric.key)}
            >
              <FontAwesome5 
                name={metric.icon} 
                size={20} 
                color={selectedMetric === metric.key ? '#fff' : metric.color} 
              />
              <Text style={[
                styles.metricButtonText,
                selectedMetric === metric.key && { color: '#fff' }
              ]}>
                {metric.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Metric Cards */}
        {renderMetricCards()}

        {/* Chart */}
        {renderChart()}

        {/* Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>AI Insights</Text>
          <View style={styles.insightCard}>
            <FontAwesome5 name="lightbulb" size={20} color="#f39c12" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Health Trend Analysis</Text>
              <Text style={styles.insightText}>
                {patient.name}'s {currentMetric?.label.toLowerCase()} shows {
                  metricData[metricData.length - 1]?.value > metricData[0]?.value ? 'an increasing' : 'a decreasing'
                } trend over the selected period. Consider adjusting treatment plan accordingly.
              </Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <FontAwesome5 name="exclamation-triangle" size={20} color="#e74c3c" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Recommendations</Text>
              <Text style={styles.insightText}>
                Based on current data, recommend increasing physical activity and monitoring more frequently. Schedule follow-up in 2 weeks.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <FontAwesome5 name="calendar-plus" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Schedule Follow-up</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
            <FontAwesome5 name="prescription-bottle-alt" size={16} color="#3498db" />
            <Text style={[styles.actionButtonText, { color: '#3498db' }]}>Adjust Medication</Text>
          </TouchableOpacity>
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
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  patientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarEmoji: {
    fontSize: 30,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  patientAge: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  patientCondition: {
    fontSize: 14,
    color: '#666',
  },
  patientStatus: {
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  healthScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  timeRangeButtonActive: {
    backgroundColor: '#f093fb',
  },
  timeRangeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timeRangeTextActive: {
    color: '#fff',
  },
  metricSelector: {
    marginBottom: 20,
  },
  metricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  metricButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  chartContainer: {
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
  chartHeader: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  chart: {
    flexDirection: 'row',
    height: 140,
    marginBottom: 16,
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingRight: 8,
    width: 40,
  },
  axisLabel: {
    fontSize: 12,
    color: '#666',
  },
  chartArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 12,
    color: '#666',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  insightsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f093fb',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 6,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#3498db',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default PatientAnalytics;
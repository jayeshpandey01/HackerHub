import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { monitoringService } from '../../services/monitoringService';
import ProviderPrescriptionInterface from '../Exercise/ProviderPrescriptionInterface';
import OfflineIndicator from '../Common/OfflineIndicator';

const { width, height } = Dimensions.get('window');

interface DoctorDashboardProps {
  userData: any;
  medicalProfile: any;
  onLogout: () => void;
}

// Exercise analytics interfaces
interface ExerciseSession {
  id: string;
  patientId: string;
  patientName: string;
  exerciseType: string;
  date: string;
  duration: number;
  accuracy: number;
  totalReps: number;
  formScore: number;
  recommendations: string[];
}

interface PatientExerciseData {
  patientId: string;
  patientName: string;
  totalSessions: number;
  averageAccuracy: number;
  lastSessionDate: string;
  improvementTrend: 'improving' | 'stable' | 'declining';
  exerciseTypes: string[];
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  userData,
  medicalProfile,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [exerciseFilter, setExerciseFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('week');
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ExerciseSession | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [todayStats, setTodayStats] = useState({
    totalPatients: 156,
    todayAppointments: 8,
    completedConsultations: 5,
    pendingReviews: 3,
    revenue: 2400,
    avgRating: 4.8,
    exerciseSessions: 24,
    activeExercisePatients: 18,
    criticalAlerts: 2,
    pendingPrescriptions: 5,
    telemedicineConsults: 3,
    aiRecommendations: 7,
  });

  const [upcomingAppointments] = useState([
    { id: 1, patient: 'Sarah Johnson', time: '10:30 AM', type: 'Follow-up', status: 'confirmed' },
    { id: 2, patient: 'Michael Chen', time: '11:15 AM', type: 'Consultation', status: 'pending' },
    { id: 3, patient: 'Emma Davis', time: '2:00 PM', type: 'Check-up', status: 'confirmed' },
  ]);

  // Mock exercise data
  const [exerciseSessions] = useState<ExerciseSession[]>([
    {
      id: '1',
      patientId: 'p1',
      patientName: 'Sarah Johnson',
      exerciseType: 'Squats',
      date: '2024-12-10T10:30:00Z',
      duration: 15,
      accuracy: 85,
      totalReps: 20,
      formScore: 82,
      recommendations: ['Keep knees aligned', 'Slower descent phase']
    },
    {
      id: '2',
      patientId: 'p2',
      patientName: 'Michael Chen',
      exerciseType: 'Push-ups',
      date: '2024-12-10T09:15:00Z',
      duration: 12,
      accuracy: 92,
      totalReps: 15,
      formScore: 90,
      recommendations: ['Excellent form', 'Ready for progression']
    },
    {
      id: '3',
      patientId: 'p1',
      patientName: 'Sarah Johnson',
      exerciseType: 'Wall Push-ups',
      date: '2024-12-09T14:20:00Z',
      duration: 10,
      accuracy: 78,
      totalReps: 12,
      formScore: 75,
      recommendations: ['Focus on arm positioning', 'Maintain core engagement']
    },
    {
      id: '4',
      patientId: 'p3',
      patientName: 'Emma Davis',
      exerciseType: 'Chair Yoga',
      date: '2024-12-09T11:00:00Z',
      duration: 20,
      accuracy: 88,
      totalReps: 8,
      formScore: 85,
      recommendations: ['Great breathing technique', 'Increase hold duration']
    }
  ]);

  const [patientExerciseData] = useState<PatientExerciseData[]>([
    {
      patientId: 'p1',
      patientName: 'Sarah Johnson',
      totalSessions: 12,
      averageAccuracy: 81,
      lastSessionDate: '2024-12-10',
      improvementTrend: 'improving',
      exerciseTypes: ['Squats', 'Wall Push-ups', 'Chair Yoga']
    },
    {
      patientId: 'p2',
      patientName: 'Michael Chen',
      totalSessions: 8,
      averageAccuracy: 89,
      lastSessionDate: '2024-12-10',
      improvementTrend: 'stable',
      exerciseTypes: ['Push-ups', 'Squats']
    },
    {
      patientId: 'p3',
      patientName: 'Emma Davis',
      totalSessions: 15,
      averageAccuracy: 86,
      lastSessionDate: '2024-12-09',
      improvementTrend: 'improving',
      exerciseTypes: ['Chair Yoga', 'Gentle Stretching']
    }
  ]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#F44336';
      default: return '#666';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return '#4CAF50';
      case 'stable': return '#FF9800';
      case 'declining': return '#F44336';
      default: return '#666';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return 'arrow-up';
      case 'stable': return 'minus';
      case 'declining': return 'arrow-down';
      default: return 'minus';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredSessions = () => {
    let filtered = exerciseSessions;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(session => 
        session.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.exerciseType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by exercise type
    if (exerciseFilter !== 'all') {
      filtered = filtered.filter(session => session.exerciseType === exerciseFilter);
    }

    // Filter by date
    const now = new Date();
    if (dateFilter === 'today') {
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate.toDateString() === now.toDateString();
      });
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(session => new Date(session.date) >= weekAgo);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getFilteredPatients = () => {
    let filtered = patientExerciseData;

    if (searchQuery) {
      filtered = filtered.filter(patient => 
        patient.patientName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => b.totalSessions - a.totalSessions);
  };

  const getExerciseTypes = () => {
    const types = new Set(exerciseSessions.map(session => session.exerciseType));
    return Array.from(types);
  };

  // Enhanced functionality for doctor requirements
  useEffect(() => {
    loadDashboardData();
    loadNotifications();
    monitoringService.trackScreen('DoctorDashboard');
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      monitoringService.logInfo('dashboard', 'Loading doctor dashboard data');
      
      // Simulate API calls for real-time data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update stats with real-time data
      setTodayStats(prev => ({
        ...prev,
        lastUpdated: new Date().toISOString()
      }));
      
      monitoringService.logInfo('dashboard', 'Dashboard data loaded successfully');
    } catch (error) {
      monitoringService.logError('dashboard', 'Failed to load dashboard data', error);
      
      // Don't show error alert for network issues in development
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (!errorMessage.includes('Network request failed') && !errorMessage.includes('localhost')) {
        Alert.alert(
          'Connection Issue', 
          'Unable to connect to server. Using offline data.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      // Mock notifications - in real app, fetch from API
      const mockNotifications = [
        {
          id: 1,
          type: 'critical',
          title: 'Patient Alert',
          message: 'Sarah Johnson missed 3 consecutive exercise sessions',
          timestamp: new Date().toISOString(),
          patientId: 'p1'
        },
        {
          id: 2,
          type: 'info',
          title: 'AI Recommendation',
          message: 'New exercise modifications suggested for Michael Chen',
          timestamp: new Date().toISOString(),
          patientId: 'p2'
        },
        {
          id: 3,
          type: 'warning',
          title: 'Prescription Review',
          message: '5 prescriptions require your review and approval',
          timestamp: new Date().toISOString()
        }
      ];
      
      setNotifications(mockNotifications);
    } catch (error) {
      monitoringService.logError('dashboard', 'Failed to load notifications', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    await loadNotifications();
    setRefreshing(false);
  };

  const handleEmergencyAlert = () => {
    Alert.alert(
      'Emergency Protocol',
      'This will trigger emergency response procedures. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          style: 'destructive',
          onPress: () => {
            monitoringService.logInfo('emergency', 'Emergency alert triggered by doctor');
            Alert.alert('Emergency Alert Sent', 'Emergency services have been notified.');
          }
        }
      ]
    );
  };

  const handleTelemedicineConsult = () => {
    monitoringService.trackEvent('telemedicine_start');
    Alert.alert('Telemedicine', 'Starting video consultation...');
  };

  const handleAIRecommendations = () => {
    monitoringService.trackEvent('ai_recommendations_view');
    Alert.alert('AI Recommendations', 'Viewing AI-powered patient recommendations...');
  };

  // Render exercise analytics content
  const renderExerciseAnalytics = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Exercise Overview Stats */}
      <View style={styles.exerciseStatsContainer}>
        <Text style={styles.sectionTitle}>Exercise Analytics Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
              <FontAwesome5 name="dumbbell" size={20} color="#2196F3" />
            </View>
            <Text style={styles.statValue}>{todayStats.exerciseSessions}</Text>
            <Text style={styles.statLabel}>Sessions Today</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E8F5E8' }]}>
              <FontAwesome5 name="users" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.statValue}>{todayStats.activeExercisePatients}</Text>
            <Text style={styles.statLabel}>Active Patients</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
              <FontAwesome5 name="chart-line" size={20} color="#FF9800" />
            </View>
            <Text style={styles.statValue}>84%</Text>
            <Text style={styles.statLabel}>Avg Accuracy</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F3E5F5' }]}>
              <FontAwesome5 name="trophy" size={20} color="#9C27B0" />
            </View>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Improvements</Text>
          </View>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <FontAwesome5 name="search" size={16} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients or exercises..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, exerciseFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setExerciseFilter('all')}
          >
            <Text style={[styles.filterText, exerciseFilter === 'all' && styles.filterTextActive]}>
              All Exercises
            </Text>
          </TouchableOpacity>

          {getExerciseTypes().slice(0, 3).map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.filterButton, exerciseFilter === type && styles.filterButtonActive]}
              onPress={() => setExerciseFilter(type)}
            >
              <Text style={[styles.filterText, exerciseFilter === type && styles.filterTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, dateFilter === 'today' && styles.filterButtonActive]}
            onPress={() => setDateFilter('today')}
          >
            <Text style={[styles.filterText, dateFilter === 'today' && styles.filterTextActive]}>
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, dateFilter === 'week' && styles.filterButtonActive]}
            onPress={() => setDateFilter('week')}
          >
            <Text style={[styles.filterText, dateFilter === 'week' && styles.filterTextActive]}>
              This Week
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, dateFilter === 'month' && styles.filterButtonActive]}
            onPress={() => setDateFilter('month')}
          >
            <Text style={[styles.filterText, dateFilter === 'month' && styles.filterTextActive]}>
              This Month
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Exercise Sessions */}
      <View style={styles.sessionsContainer}>
        <Text style={styles.sectionTitle}>Recent Exercise Sessions</Text>
        <View style={styles.sessionsList}>
          {getFilteredSessions().slice(0, 10).map((session) => (
            <TouchableOpacity
              key={session.id}
              style={styles.sessionCard}
              onPress={() => {
                setSelectedSession(session);
                setShowSessionModal(true);
              }}
            >
              <View style={styles.sessionHeader}>
                <View style={styles.sessionPatient}>
                  <Text style={styles.sessionPatientName}>{session.patientName}</Text>
                  <Text style={styles.sessionExercise}>{session.exerciseType}</Text>
                </View>
                <View style={styles.sessionMetrics}>
                  <Text style={styles.sessionAccuracy}>{session.accuracy}%</Text>
                  <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
                </View>
              </View>
              
              <View style={styles.sessionStats}>
                <View style={styles.sessionStat}>
                  <FontAwesome5 name="clock" size={12} color="#666" />
                  <Text style={styles.sessionStatText}>{session.duration}min</Text>
                </View>
                <View style={styles.sessionStat}>
                  <FontAwesome5 name="redo" size={12} color="#666" />
                  <Text style={styles.sessionStatText}>{session.totalReps} reps</Text>
                </View>
                <View style={styles.sessionStat}>
                  <FontAwesome5 name="star" size={12} color="#666" />
                  <Text style={styles.sessionStatText}>{session.formScore}/100</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // Render patient progress content
  const renderPatientProgress = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Search */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <FontAwesome5 name="search" size={16} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Patient Progress List */}
      <View style={styles.patientsContainer}>
        <Text style={styles.sectionTitle}>Patient Exercise Progress</Text>
        <View style={styles.patientsList}>
          {getFilteredPatients().map((patient) => (
            <TouchableOpacity
              key={patient.patientId}
              style={styles.patientCard}
              onPress={() => setSelectedPatient(patient.patientId)}
            >
              <View style={styles.patientHeader}>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{patient.patientName}</Text>
                  <Text style={styles.patientSessions}>{patient.totalSessions} sessions</Text>
                </View>
                <View style={styles.patientTrend}>
                  <FontAwesome5 
                    name={getTrendIcon(patient.improvementTrend)} 
                    size={16} 
                    color={getTrendColor(patient.improvementTrend)} 
                  />
                  <Text style={[styles.trendText, { color: getTrendColor(patient.improvementTrend) }]}>
                    {patient.improvementTrend}
                  </Text>
                </View>
              </View>

              <View style={styles.patientMetrics}>
                <View style={styles.patientMetric}>
                  <Text style={styles.metricLabel}>Avg Accuracy</Text>
                  <Text style={styles.metricValue}>{patient.averageAccuracy}%</Text>
                </View>
                <View style={styles.patientMetric}>
                  <Text style={styles.metricLabel}>Last Session</Text>
                  <Text style={styles.metricValue}>
                    {new Date(patient.lastSessionDate).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.exerciseTypes}>
                {patient.exerciseTypes.slice(0, 3).map((type, index) => (
                  <View key={index} style={styles.exerciseTypeTag}>
                    <Text style={styles.exerciseTypeText}>{type}</Text>
                  </View>
                ))}
                {patient.exerciseTypes.length > 3 && (
                  <View style={styles.exerciseTypeTag}>
                    <Text style={styles.exerciseTypeText}>+{patient.exerciseTypes.length - 3}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Background Elements */}
      <View style={styles.backgroundElements}>
        <View style={styles.backgroundCircle1} />
        <View style={styles.backgroundCircle2} />
        <View style={styles.backgroundCircle3} />
      </View>

      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>Dr. {userData.firstName} {userData.lastName} 👨‍⚕️</Text>
            <Text style={styles.subtitle}>
              {activeTab === 'overview' && 'Ready to help your patients today?'}
              {activeTab === 'prescriptions' && 'Manage exercise prescriptions'}
              {activeTab === 'exercise' && 'Monitor patient exercise progress'}
              {activeTab === 'patients' && 'Track individual patient journeys'}
            </Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={onLogout}>
            <View style={styles.profileIcon}>
              <Text style={styles.profileEmoji}>👨‍⚕️</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {activeTab === 'overview' && (
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
        {/* Critical Alerts Section */}
        {todayStats.criticalAlerts > 0 && (
          <View style={styles.alertsContainer}>
            <View style={styles.alertHeader}>
              <FontAwesome5 name="exclamation-triangle" size={20} color="#F44336" />
              <Text style={styles.alertTitle}>Critical Alerts ({todayStats.criticalAlerts})</Text>
            </View>
            <TouchableOpacity style={styles.alertButton}>
              <Text style={styles.alertButtonText}>View All Alerts</Text>
              <FontAwesome5 name="chevron-right" size={14} color="#F44336" />
            </TouchableOpacity>
          </View>
        )}

        {/* Today's Overview */}
        <View style={styles.overviewContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Overview</Text>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => setShowNotifications(true)}
            >
              <FontAwesome5 name="bell" size={16} color="#f093fb" />
              {notifications.length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{notifications.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
                <FontAwesome5 name="users" size={20} color="#2196F3" />
              </View>
              <Text style={styles.statValue}>{todayStats.totalPatients}</Text>
              <Text style={styles.statLabel}>Total Patients</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
                <FontAwesome5 name="calendar-check" size={20} color="#FF9800" />
              </View>
              <Text style={styles.statValue}>{todayStats.todayAppointments}</Text>
              <Text style={styles.statLabel}>Today's Appointments</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#E8F5E8' }]}>
                <FontAwesome5 name="clipboard-check" size={20} color="#4CAF50" />
              </View>
              <Text style={styles.statValue}>{todayStats.completedConsultations}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#F3E5F5' }]}>
                <FontAwesome5 name="star" size={20} color="#9C27B0" />
              </View>
              <Text style={styles.statValue}>{todayStats.avgRating}</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#FFEBEE' }]}>
                <FontAwesome5 name="video" size={20} color="#F44336" />
              </View>
              <Text style={styles.statValue}>{todayStats.telemedicineConsults}</Text>
              <Text style={styles.statLabel}>Telemedicine</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#E1F5FE' }]}>
                <FontAwesome5 name="robot" size={20} color="#00BCD4" />
              </View>
              <Text style={styles.statValue}>{todayStats.aiRecommendations}</Text>
              <Text style={styles.statLabel}>AI Insights</Text>
            </View>
          </View>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.appointmentsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.appointmentsList}>
            {upcomingAppointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentTime}>
                  <Text style={styles.timeText}>{appointment.time}</Text>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(appointment.status) }]} />
                </View>
                <View style={styles.appointmentDetails}>
                  <Text style={styles.patientName}>{appointment.patient}</Text>
                  <Text style={styles.appointmentType}>{appointment.type}</Text>
                </View>
                <TouchableOpacity style={styles.appointmentAction}>
                  <FontAwesome5 name="chevron-right" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={[styles.actionCard, styles.primaryAction]}
              onPress={() => setShowPatientModal(true)}
            >
              <FontAwesome5 name="user-plus" size={24} color="#fff" />
              <Text style={[styles.actionTitle, { color: '#fff' }]}>Add Patient</Text>
              <Text style={[styles.actionSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>Register new patient</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowPrescriptionModal(true)}
            >
              <FontAwesome5 name="dumbbell" size={24} color="#f093fb" />
              <Text style={styles.actionTitle}>Exercise Rx</Text>
              <Text style={styles.actionSubtitle}>Create prescription</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleTelemedicineConsult}
            >
              <FontAwesome5 name="video" size={24} color="#f093fb" />
              <Text style={styles.actionTitle}>Telemedicine</Text>
              <Text style={styles.actionSubtitle}>Start video call</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleAIRecommendations}
            >
              <FontAwesome5 name="robot" size={24} color="#f093fb" />
              <Text style={styles.actionTitle}>AI Insights</Text>
              <Text style={styles.actionSubtitle}>View recommendations</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <FontAwesome5 name="calendar-plus" size={24} color="#f093fb" />
              <Text style={styles.actionTitle}>Schedule</Text>
              <Text style={styles.actionSubtitle}>Book appointment</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionCard, styles.emergencyAction]}
              onPress={handleEmergencyAlert}
            >
              <FontAwesome5 name="exclamation-triangle" size={24} color="#fff" />
              <Text style={[styles.actionTitle, { color: '#fff' }]}>Emergency</Text>
              <Text style={[styles.actionSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>Alert protocol</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#E3F2FD' }]}>
                <FontAwesome5 name="user-check" size={16} color="#2196F3" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>New Patient Registered</Text>
                <Text style={styles.activityTime}>Sarah Johnson - 2 hours ago</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#FFF3E0' }]}>
                <FontAwesome5 name="prescription" size={16} color="#FF9800" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Prescription Updated</Text>
                <Text style={styles.activityTime}>Michael Chen - 4 hours ago</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#E8F5E8' }]}>
                <FontAwesome5 name="star" size={16} color="#4CAF50" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>5-Star Review Received</Text>
                <Text style={styles.activityTime}>Emma Davis - Yesterday</Text>
              </View>
            </View>
          </View>
        </View>
        </ScrollView>
      )}

      {activeTab === 'prescriptions' && (
        <View style={styles.prescriptionContainer}>
          <ProviderPrescriptionInterface
            providerId={userData.id}
            selectedPatientId={selectedPatient}
            onPrescriptionUpdate={(prescriptions) => {
              monitoringService.logInfo('prescriptions', 'Prescriptions updated', { count: prescriptions.length });
            }}
          />
        </View>
      )}

        {activeTab === 'exercise' && renderExerciseAnalytics()}
        {activeTab === 'patients' && renderPatientProgress()}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'overview' && styles.activeNavItem]}
          onPress={() => setActiveTab('overview')}
        >
          <FontAwesome5
            name="home"
            size={20}
            color={activeTab === 'overview' ? '#667eea' : '#999'}
          />
          <Text style={[
            styles.navText,
            activeTab === 'overview' && styles.activeNavText
          ]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'prescriptions' && styles.activeNavItem]}
          onPress={() => setActiveTab('prescriptions')}
        >
          <FontAwesome5
            name="prescription"
            size={20}
            color={activeTab === 'prescriptions' ? '#667eea' : '#999'}
          />
          <Text style={[
            styles.navText,
            activeTab === 'prescriptions' && styles.activeNavText
          ]}>
            Prescriptions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'exercise' && styles.activeNavItem]}
          onPress={() => setActiveTab('exercise')}
        >
          <FontAwesome5
            name="dumbbell"
            size={20}
            color={activeTab === 'exercise' ? '#667eea' : '#999'}
          />
          <Text style={[
            styles.navText,
            activeTab === 'exercise' && styles.activeNavText
          ]}>
            Analytics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'patients' && styles.activeNavItem]}
          onPress={() => setActiveTab('patients')}
        >
          <FontAwesome5
            name="users"
            size={20}
            color={activeTab === 'patients' ? '#667eea' : '#999'}
          />
          <Text style={[
            styles.navText,
            activeTab === 'patients' && styles.activeNavText
          ]}>
            Patients
          </Text>
        </TouchableOpacity>
      </View>

      {/* Session Detail Modal */}
      <Modal
        visible={showSessionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSessionModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Exercise Session Details</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSessionModal(false)}
            >
              <FontAwesome5 name="times" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {selectedSession && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.sessionDetailCard}>
                <View style={styles.sessionDetailHeader}>
                  <Text style={styles.sessionDetailPatient}>{selectedSession.patientName}</Text>
                  <Text style={styles.sessionDetailExercise}>{selectedSession.exerciseType}</Text>
                  <Text style={styles.sessionDetailDate}>{formatDate(selectedSession.date)}</Text>
                </View>

                <View style={styles.sessionDetailMetrics}>
                  <View style={styles.metricCard}>
                    <FontAwesome5 name="bullseye" size={24} color="#4CAF50" />
                    <Text style={styles.metricCardValue}>{selectedSession.accuracy}%</Text>
                    <Text style={styles.metricCardLabel}>Accuracy</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <FontAwesome5 name="clock" size={24} color="#2196F3" />
                    <Text style={styles.metricCardValue}>{selectedSession.duration}min</Text>
                    <Text style={styles.metricCardLabel}>Duration</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <FontAwesome5 name="redo" size={24} color="#FF9800" />
                    <Text style={styles.metricCardValue}>{selectedSession.totalReps}</Text>
                    <Text style={styles.metricCardLabel}>Reps</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <FontAwesome5 name="star" size={24} color="#9C27B0" />
                    <Text style={styles.metricCardValue}>{selectedSession.formScore}</Text>
                    <Text style={styles.metricCardLabel}>Form Score</Text>
                  </View>
                </View>

                <View style={styles.recommendationsSection}>
                  <Text style={styles.recommendationsTitle}>Recommendations</Text>
                  {selectedSession.recommendations.map((rec, index) => (
                    <View key={index} style={styles.recommendationItem}>
                      <FontAwesome5 name="lightbulb" size={14} color="#FF9800" />
                      <Text style={styles.recommendationText}>{rec}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <FontAwesome5 name="share" size={16} color="#f093fb" />
                    <Text style={styles.actionButtonText}>Share with Patient</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionButton}>
                    <FontAwesome5 name="prescription" size={16} color="#f093fb" />
                    <Text style={styles.actionButtonText}>Update Prescription</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Notifications</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowNotifications(false)}
            >
              <FontAwesome5 name="times" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {notifications.map((notification) => (
              <View key={notification.id} style={styles.notificationItem}>
                <View style={[
                  styles.notificationIcon,
                  { backgroundColor: notification.type === 'critical' ? '#FFEBEE' : 
                                   notification.type === 'warning' ? '#FFF3E0' : '#E3F2FD' }
                ]}>
                  <FontAwesome5 
                    name={notification.type === 'critical' ? 'exclamation-triangle' :
                          notification.type === 'warning' ? 'exclamation-circle' : 'info-circle'}
                    size={16}
                    color={notification.type === 'critical' ? '#F44336' :
                           notification.type === 'warning' ? '#FF9800' : '#2196F3'}
                  />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                  <Text style={styles.notificationTime}>
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Exercise Prescription Modal */}
      <Modal
        visible={showPrescriptionModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowPrescriptionModal(false)}
      >
        <View style={styles.fullScreenModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Exercise Prescriptions</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPrescriptionModal(false)}
            >
              <FontAwesome5 name="times" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <ProviderPrescriptionInterface
            providerId={userData.id}
            selectedPatientId={selectedPatient}
            onPrescriptionUpdate={(prescriptions) => {
              monitoringService.logInfo('prescriptions', 'Prescriptions updated', { count: prescriptions.length });
            }}
          />
        </View>
      </Modal>

      {/* Add Patient Modal */}
      <Modal
        visible={showPatientModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPatientModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Patient</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPatientModal(false)}
            >
              <FontAwesome5 name="times" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Patient Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter patient name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                style={styles.formInput}
                placeholder="patient@email.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Phone</Text>
              <TextInput
                style={styles.formInput}
                placeholder="+1 (555) 123-4567"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Medical Condition</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Primary medical condition or reason for treatment"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={styles.submitButton}>
              <FontAwesome5 name="user-plus" size={16} color="#fff" />
              <Text style={styles.submitButtonText}>Add Patient</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  contentContainer: {
    flex: 1,
  },
  // Background Elements
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundCircle1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    top: -width * 0.3,
    left: -width * 0.2,
  },
  backgroundCircle2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(240, 147, 251, 0.1)',
    bottom: -width * 0.2,
    right: -width * 0.15,
  },
  backgroundCircle3: {
    position: 'absolute',
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: 'rgba(79, 172, 254, 0.08)',
    top: height * 0.3,
    left: -width * 0.1,
  },
  header: {
    paddingTop: height * 0.08,
    paddingHorizontal: 20,
    paddingBottom: 30,
    position: 'relative',
  },
  headerGradient: {
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  profileButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileEmoji: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Alert styles
  alertsContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.2)',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F44336',
    marginLeft: 8,
  },
  alertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  alertButtonText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '600',
  },

  // Notification styles
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#F44336',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },

  // Enhanced action styles
  emergencyAction: {
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  primaryAction: {
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },

  // Prescription container
  prescriptionContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Modal styles
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#f093fb',
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Tab container
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: 'rgba(240, 147, 251, 0.1)',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#f093fb',
    fontWeight: '600',
  },

  // Content
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  // Section styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },

  // Overview container
  overviewContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Appointments
  appointmentsContainer: {
    marginBottom: 24,
  },
  appointmentsList: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  appointmentTime: {
    alignItems: 'center',
    marginRight: 16,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  appointmentDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  appointmentType: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  appointmentAction: {
    padding: 8,
  },

  // Actions
  actionsContainer: {
    marginBottom: 24,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },

  // Recent activity
  recentContainer: {
    marginBottom: 30,
  },
  activityList: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Exercise analytics styles
  exerciseStatsContainer: {
    marginBottom: 24,
  },
  filtersContainer: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#667eea',
  },
  filterText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },

  // Sessions
  sessionsContainer: {
    marginBottom: 24,
  },
  sessionsList: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sessionCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sessionPatient: {
    flex: 1,
  },
  sessionPatientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  sessionExercise: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  sessionMetrics: {
    alignItems: 'flex-end',
  },
  sessionAccuracy: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 2,
  },
  sessionDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionStatText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },

  // Patients
  patientsContainer: {
    marginBottom: 24,
  },
  patientsList: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  patientCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientSessions: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  patientTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  patientMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  patientMetric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  exerciseTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  exerciseTypeTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  exerciseTypeText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
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
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  sessionDetailCard: {
    backgroundColor: 'transparent',
  },
  sessionDetailHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sessionDetailPatient: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  sessionDetailExercise: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  sessionDetailDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  sessionDetailMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  metricCardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  metricCardLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  recommendationsSection: {
    marginBottom: 24,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#f093fb',
    fontWeight: '500',
    marginLeft: 8,
  },

  // Bottom Navigation Styles
  bottomNav: {
    margin: 5,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderRadius: 20,
    marginHorizontal: 10,
    marginBottom: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  activeNavItem: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
  },
  navText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    fontWeight: '500',
  },
  activeNavText: {
    color: '#667eea',
    fontWeight: '600',
  },

  // Header styles
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  profileButton: {
    position: 'absolute',
    top: height * 0.08,
    right: 20,
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#f093fb',
    fontWeight: '600',
  },
  overviewContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  appointmentsContainer: {
    marginBottom: 24,
  },
  appointmentsList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  appointmentTime: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 80,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  appointmentDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  appointmentType: {
    fontSize: 14,
    color: '#666',
  },
  appointmentAction: {
    padding: 8,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryAction: {
    backgroundColor: '#f093fb',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  recentContainer: {
    marginBottom: 30,
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },

  // Tab Navigation Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: 'rgba(240, 147, 251, 0.1)',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#f093fb',
    fontWeight: '600',
  },

  // Exercise Analytics Styles
  exerciseStatsContainer: {
    marginBottom: 24,
  },
  filtersContainer: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#f093fb',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // Session List Styles
  sessionsContainer: {
    marginBottom: 24,
  },
  sessionsList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sessionCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionPatient: {
    flex: 1,
  },
  sessionPatientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  sessionExercise: {
    fontSize: 14,
    color: '#666',
  },
  sessionMetrics: {
    alignItems: 'flex-end',
  },
  sessionAccuracy: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 2,
  },
  sessionDate: {
    fontSize: 12,
    color: '#666',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sessionStatText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },

  // Patient Progress Styles
  patientsContainer: {
    marginBottom: 24,
  },
  patientsList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  patientCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  patientSessions: {
    fontSize: 14,
    color: '#666',
  },
  patientTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  patientMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  patientMetric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  exerciseTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  exerciseTypeTag: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  exerciseTypeText: {
    fontSize: 12,
    color: '#f093fb',
    fontWeight: '500',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  sessionDetailCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sessionDetailHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sessionDetailPatient: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  sessionDetailExercise: {
    fontSize: 18,
    color: '#f093fb',
    fontWeight: '600',
    marginBottom: 8,
  },
  sessionDetailDate: {
    fontSize: 14,
    color: '#666',
  },
  sessionDetailMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    alignItems: 'center',
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  metricCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  metricCardLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  recommendationsSection: {
    marginBottom: 24,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff9e6',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(240, 147, 251, 0.1)',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#f093fb',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default DoctorDashboard;
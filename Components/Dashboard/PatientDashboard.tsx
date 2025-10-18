import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  SafeAreaView,
} from 'react-native';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';
import ExerciseTracker from '../Exercise/ExerciseTracker';
import HealthChatbot from '../Chatbot/HealthChatbot';

const { width, height } = Dimensions.get('window');

interface PatientDashboardProps {
  userData: any;
  medicalProfile: any;
  onLogout: () => void;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({
  userData,
  medicalProfile,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [healthScore] = useState(85);
  const [todayStats] = useState({
    steps: 8420,
    calories: 320,
    heartRate: 72,
    sleep: 7.5,
    water: 6,
    activeMinutes: 45,
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  // Render Dashboard Content
  const renderDashboardContent = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Health Score Card */}
      <View style={styles.healthScoreCard}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreTitle}>Health Score</Text>
          <Text style={styles.scoreSubtitle}>Based on your daily activities</Text>
        </View>
        <View style={styles.scoreContainer}>
          <View style={[styles.scoreCircle, { borderColor: getHealthScoreColor(healthScore) }]}>
            <Text style={[styles.scoreValue, { color: getHealthScoreColor(healthScore) }]}>
              {healthScore}
            </Text>
            <Text style={styles.scoreUnit}>%</Text>
          </View>
          <View style={styles.scoreDetails}>
            <View style={styles.scoreItem}>
              <FontAwesome5 name="arrow-up" size={12} color="#4CAF50" />
              <Text style={styles.scoreChange}>+5% from yesterday</Text>
            </View>
            <Text style={styles.scoreDescription}>Excellent progress!</Text>
          </View>
        </View>
      </View>

      {/* Today's Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Today's Activity</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
              <FontAwesome5 name="walking" size={20} color="#2196F3" />
            </View>
            <Text style={styles.statValue}>{todayStats.steps.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Steps</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progress, { width: '84%', backgroundColor: '#2196F3' }]} />
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
              <FontAwesome5 name="fire" size={20} color="#FF9800" />
            </View>
            <Text style={styles.statValue}>{todayStats.calories}</Text>
            <Text style={styles.statLabel}>Calories</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progress, { width: '65%', backgroundColor: '#FF9800' }]} />
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F3E5F5' }]}>
              <FontAwesome5 name="heartbeat" size={20} color="#9C27B0" />
            </View>
            <Text style={styles.statValue}>{todayStats.heartRate}</Text>
            <Text style={styles.statLabel}>BPM</Text>
            <Text style={styles.statStatus}>Normal</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E8F5E8' }]}>
              <MaterialIcons name="bedtime" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.statValue}>{todayStats.sleep}h</Text>
            <Text style={styles.statLabel}>Sleep</Text>
            <Text style={styles.statStatus}>Good</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={[styles.actionCard, styles.primaryAction]}>
            <FontAwesome5 name="plus-circle" size={24} color="#fff" />
            <Text style={styles.actionTitle}>Log Symptoms</Text>
            <Text style={styles.actionSubtitle}>Track how you feel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <FontAwesome5 name="pills" size={24} color="#667eea" />
            <Text style={styles.actionTitle}>Medications</Text>
            <Text style={styles.actionSubtitle}>Manage your meds</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <FontAwesome5 name="calendar-check" size={24} color="#667eea" />
            <Text style={styles.actionTitle}>Appointments</Text>
            <Text style={styles.actionSubtitle}>Schedule & view</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <FontAwesome5 name="user-md" size={24} color="#667eea" />
            <Text style={styles.actionTitle}>Find Doctor</Text>
            <Text style={styles.actionSubtitle}>Book consultation</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.recentContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#E3F2FD' }]}>
              <FontAwesome5 name="heartbeat" size={16} color="#2196F3" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Blood Pressure Logged</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
            <Text style={styles.activityValue}>120/80</Text>
          </View>

          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#FFF3E0' }]}>
              <FontAwesome5 name="weight" size={16} color="#FF9800" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Weight Updated</Text>
              <Text style={styles.activityTime}>Yesterday</Text>
            </View>
            <Text style={styles.activityValue}>68.5 kg</Text>
          </View>

          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#E8F5E8' }]}>
              <FontAwesome5 name="calendar" size={16} color="#4CAF50" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Appointment Scheduled</Text>
              <Text style={styles.activityTime}>2 days ago</Text>
            </View>
            <Text style={styles.activityValue}>Dr. Smith</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // Render Monitor Content
  const renderMonitorContent = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.monitorContainer}>
        <Text style={styles.sectionTitle}>Health Monitoring</Text>

        {/* Health Metrics Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Heart Rate Trends</Text>
            <Text style={styles.chartPeriod}>Last 7 days</Text>
          </View>
          <View style={styles.chartPlaceholder}>
            <FontAwesome5 name="chart-line" size={40} color="#667eea" />
            <Text style={styles.chartText}>Heart Rate Chart</Text>
            <Text style={styles.chartSubtext}>72 BPM Average</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Weight Progress</Text>
            <Text style={styles.chartPeriod}>Last 30 days</Text>
          </View>
          <View style={styles.chartPlaceholder}>
            <FontAwesome5 name="weight" size={40} color="#4CAF50" />
            <Text style={styles.chartText}>Weight Tracking</Text>
            <Text style={styles.chartSubtext}>68.5 kg Current</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Sleep Quality</Text>
            <Text style={styles.chartPeriod}>This week</Text>
          </View>
          <View style={styles.chartPlaceholder}>
            <MaterialIcons name="bedtime" size={40} color="#9C27B0" />
            <Text style={styles.chartText}>Sleep Analysis</Text>
            <Text style={styles.chartSubtext}>7.5h Average</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // Render Exercise Content
  const renderExerciseContent = () => (
    <ExerciseTracker
      userId={userData.id}
      medicalProfile={medicalProfile}
      onWorkoutComplete={(workoutData) => {
        console.log('Workout completed:', workoutData);
        // You can add additional logic here like updating user stats
      }}
    />
  );

  // Render Chatbot Content
  const renderChatbotContent = () => (
    <HealthChatbot 
      userData={userData}
      medicalProfile={medicalProfile}
    />
  );

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'monitor':
        return renderMonitorContent();
      case 'exercise':
        return renderExerciseContent();
      case 'chatbot':
        return renderChatbotContent();
      default:
        return renderDashboardContent();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Elements */}
      <View style={styles.backgroundElements}>
        <Animated.View style={styles.backgroundCircle1} />
        <Animated.View style={styles.backgroundCircle2} />
        <Animated.View style={styles.backgroundCircle3} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{userData.firstName}! 👋</Text>
            <Text style={styles.subtitle}>
              {activeTab === 'dashboard' && 'Ready to improve your health?'}
              {activeTab === 'monitor' && 'Track your health metrics'}
              {activeTab === 'exercise' && 'Time to get moving!'}
              {activeTab === 'chatbot' && 'Your AI assistant is here to help'}
            </Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={onLogout}>
            <View style={styles.profileIcon}>
              <Text style={styles.profileEmoji}>😊</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'dashboard' && styles.activeNavItem]}
          onPress={() => setActiveTab('dashboard')}
        >
          <FontAwesome5
            name="home"
            size={20}
            color={activeTab === 'dashboard' ? '#667eea' : '#999'}
          />
          <Text style={[
            styles.navText,
            activeTab === 'dashboard' && styles.activeNavText
          ]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'monitor' && styles.activeNavItem]}
          onPress={() => setActiveTab('monitor')}
        >
          <FontAwesome5
            name="chart-line"
            size={20}
            color={activeTab === 'monitor' ? '#667eea' : '#999'}
          />
          <Text style={[
            styles.navText,
            activeTab === 'monitor' && styles.activeNavText
          ]}>
            Monitor
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
            Exercise
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'chatbot' && styles.activeNavItem]}
          onPress={() => setActiveTab('chatbot')}
        >
          <FontAwesome5
            name="robot"
            size={20}
            color={activeTab === 'chatbot' ? '#667eea' : '#999'}
          />
          <Text style={[
            styles.navText,
            activeTab === 'chatbot' && styles.activeNavText
          ]}>
            AI Assistant
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  healthScoreCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  scoreHeader: {
    marginBottom: 20,
  },
  scoreTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  scoreSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  scoreUnit: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: -4,
  },
  scoreDetails: {
    flex: 1,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreChange: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 6,
    fontWeight: '600',
  },
  scoreDescription: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  statsContainer: {
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
    marginBottom: 8,
  },
  statStatus: {
    fontSize: 12,
    color: '#4facfe',
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: 2,
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
  primaryAction: {
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    borderColor: 'rgba(102, 126, 234, 0.3)',
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
  activityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
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

  // Monitor Screen Styles
  monitorContainer: {
    padding: 20,
  },
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(240, 147, 251, 0.2)',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  chartPeriod: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  chartPlaceholder: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  chartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
  },
  chartSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },

  // Exercise Screen Styles
  exerciseContainer: {
    padding: 20,
  },
  workoutCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(79, 172, 254, 0.2)',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  workoutBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  workoutBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  workoutDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
  },
  startWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    paddingVertical: 12,
    borderRadius: 12,
  },
  startWorkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    marginTop: 8,
  },
  exerciseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  exerciseCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 16,
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
  exerciseIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  exerciseCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  recentWorkouts: {
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
  workoutHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  workoutHistoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutHistoryContent: {
    flex: 1,
  },
  workoutHistoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  workoutHistoryTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  workoutHistoryCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },

  // Chatbot Screen Styles
  chatContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  chatHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    margin: 20,
    marginBottom: 10,
    borderWidth: 1,
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  chatSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  chatMessages: {
    flex: 1,
    padding: 20,
  },
  aiMessage: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
    marginBottom: 12,
  },
  suggestionsList: {
    marginTop: 8,
  },
  suggestionItem: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  chatInputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    margin: 20,
    marginTop: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  quickActionButton: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
  },
  chatInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chatInputPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PatientDashboard;
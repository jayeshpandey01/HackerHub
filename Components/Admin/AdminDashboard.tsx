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
import DebugPanel from '../Common/DebugPanel';
import DatabaseStats from '../Common/DatabaseStats';
import ActivityTracker from '../Common/ActivityTracker';
import { authService } from '../../services/authService';
import { databaseService } from '../../services/databaseService';

const { width, height } = Dimensions.get('window');

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [currentView, setCurrentView] = useState<'overview' | 'users' | 'activities' | 'settings'>('overview');
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const databaseStats = await authService.getDatabaseStats();
      setStats(databaseStats);
      
      // In a real app, you'd have an admin API to get all users
      // For now, we'll show the stats we have
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      setIsLoading(false);
    }
  };

  const handleExportAllData = async () => {
    try {
      Alert.alert(
        'Export All Data',
        'This will export all user data from the database.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Export',
            onPress: async () => {
              try {
                // In a real app, you'd export all users' data
                const currentUser = authService.getCurrentUser();
                if (currentUser) {
                  const exportData = await authService.exportUserData();
                  console.log('Exported data:', exportData);
                  Alert.alert('Success', 'Data exported successfully! Check console for details.');
                } else {
                  Alert.alert('Error', 'No user data to export');
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to export data');
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleResetSystem = async () => {
    Alert.alert(
      'Reset System',
      'This will clear ALL data and reset the system to initial state. This action cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.clearAllData();
              Alert.alert('Success', 'System reset successfully. Please restart the app.');
              onBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to reset system');
            }
          },
        },
      ]
    );
  };

  const renderOverview = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* System Stats */}
      <DatabaseStats showClearButton={true} />
      
      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Admin Actions</Text>
        
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={handleExportAllData}>
            <FontAwesome5 name="download" size={24} color="#3498db" />
            <Text style={styles.actionTitle}>Export Data</Text>
            <Text style={styles.actionSubtitle}>Download all user data</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => setCurrentView('activities')}
          >
            <FontAwesome5 name="history" size={24} color="#f39c12" />
            <Text style={styles.actionTitle}>View Activities</Text>
            <Text style={styles.actionSubtitle}>System activity logs</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => setCurrentView('users')}
          >
            <FontAwesome5 name="users" size={24} color="#2ecc71" />
            <Text style={styles.actionTitle}>User Management</Text>
            <Text style={styles.actionSubtitle}>Manage user accounts</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, styles.dangerAction]} 
            onPress={handleResetSystem}
          >
            <FontAwesome5 name="exclamation-triangle" size={24} color="#e74c3c" />
            <Text style={[styles.actionTitle, styles.dangerText]}>Reset System</Text>
            <Text style={[styles.actionSubtitle, styles.dangerText]}>Clear all data</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Debug Panel */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Tools</Text>
        <DebugPanel />
      </View>

      {/* System Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Database Size:</Text>
            <Text style={styles.infoValue}>{formatBytes(stats.databaseSize || 0)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Backup:</Text>
            <Text style={styles.infoValue}>
              {stats.lastBackupDate ? new Date(stats.lastBackupDate).toLocaleString() : 'Never'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Activities:</Text>
            <Text style={styles.infoValue}>{stats.totalActivities || 0}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderActivities = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Activities</Text>
        <ActivityTracker limit={50} showExportButton={true} />
      </View>
    </ScrollView>
  );

  const renderUsers = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Management</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            User management features would be implemented here in a production app.
            This would include user search, account management, and user analytics.
          </Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalDoctors || 0}</Text>
              <Text style={styles.statLabel}>Doctors</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalPatients || 0}</Text>
              <Text style={styles.statLabel}>Patients</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalProfiles || 0}</Text>
              <Text style={styles.statLabel}>Profiles</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <FontAwesome5 name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={styles.headerRight}>
          <FontAwesome5 name="shield-alt" size={20} color="#e74c3c" />
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, currentView === 'overview' && styles.activeTab]}
          onPress={() => setCurrentView('overview')}
        >
          <FontAwesome5 name="tachometer-alt" size={16} color={currentView === 'overview' ? '#fff' : '#ccc'} />
          <Text style={[styles.tabText, currentView === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, currentView === 'users' && styles.activeTab]}
          onPress={() => setCurrentView('users')}
        >
          <FontAwesome5 name="users" size={16} color={currentView === 'users' ? '#fff' : '#ccc'} />
          <Text style={[styles.tabText, currentView === 'users' && styles.activeTabText]}>
            Users
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, currentView === 'activities' && styles.activeTab]}
          onPress={() => setCurrentView('activities')}
        >
          <FontAwesome5 name="history" size={16} color={currentView === 'activities' ? '#fff' : '#ccc'} />
          <Text style={[styles.tabText, currentView === 'activities' && styles.activeTabText]}>
            Activities
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {currentView === 'overview' && renderOverview()}
      {currentView === 'users' && renderUsers()}
      {currentView === 'activities' && renderActivities()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#e74c3c',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ccc',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dangerAction: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    textAlign: 'center',
  },
  dangerText: {
    color: '#e74c3c',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e74c3c',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
});

export default AdminDashboard;
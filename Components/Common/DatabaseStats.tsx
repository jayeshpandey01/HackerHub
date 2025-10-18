import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { authService } from '../../services/authService';
import { databaseService } from '../../services/databaseService';

interface DatabaseStatsProps {
  showClearButton?: boolean;
}

const DatabaseStats: React.FC<DatabaseStatsProps> = ({ showClearButton = false }) => {
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    try {
      const databaseStats = await authService.getDatabaseStats();
      setStats(databaseStats);
    } catch (error) {
      console.error('Failed to load database stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleClearDatabase = () => {
    Alert.alert(
      'Clear Database',
      'Are you sure you want to clear all data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.clearAllData();
              await loadStats();
              Alert.alert('Success', 'Database cleared successfully');
            } catch (error) {
              console.error('Failed to clear database:', error);
              Alert.alert('Error', 'Failed to clear database');
            }
          },
        },
      ]
    );
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Database Statistics</Text>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <FontAwesome5 name="database" size={20} color="#667eea" />
          <Text style={styles.title}>Database Statistics</Text>
        </View>
        {showClearButton && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClearDatabase}>
            <FontAwesome5 name="trash" size={14} color="#e74c3c" />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <FontAwesome5 name="users" size={24} color="#2ecc71" />
          <Text style={styles.statNumber}>{stats.totalUsers || 0}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>

        <View style={styles.statCard}>
          <FontAwesome5 name="user-md" size={24} color="#f093fb" />
          <Text style={styles.statNumber}>{stats.totalDoctors || 0}</Text>
          <Text style={styles.statLabel}>Doctors</Text>
        </View>

        <View style={styles.statCard}>
          <FontAwesome5 name="user" size={24} color="#667eea" />
          <Text style={styles.statNumber}>{stats.totalPatients || 0}</Text>
          <Text style={styles.statLabel}>Patients</Text>
        </View>

        <View style={styles.statCard}>
          <FontAwesome5 name="file-medical" size={24} color="#3498db" />
          <Text style={styles.statNumber}>{stats.totalProfiles || 0}</Text>
          <Text style={styles.statLabel}>Profiles</Text>
        </View>

        <View style={styles.statCard}>
          <FontAwesome5 name="history" size={24} color="#f39c12" />
          <Text style={styles.statNumber}>{stats.totalActivities || 0}</Text>
          <Text style={styles.statLabel}>Activities</Text>
        </View>

        <View style={styles.statCard}>
          <FontAwesome5 name="hdd" size={24} color="#9b59b6" />
          <Text style={styles.statNumber}>{formatBytes(stats.databaseSize || 0)}</Text>
          <Text style={styles.statLabel}>Storage</Text>
        </View>
      </View>

      {stats.lastBackupDate && (
        <View style={styles.backupInfo}>
          <FontAwesome5 name="shield-alt" size={16} color="#2ecc71" />
          <Text style={styles.backupText}>
            Last backup: {new Date(stats.lastBackupDate).toLocaleDateString()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  clearButtonText: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  backupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  backupText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginLeft: 6,
  },
});

export default DatabaseStats;
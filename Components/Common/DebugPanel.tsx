import React, { useState } from 'react';
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

const DebugPanel: React.FC = () => {
  const [stats, setStats] = useState<any>({});

  const loadStats = async () => {
    try {
      const databaseStats = await authService.getDatabaseStats();
      const shouldShow = await authService.shouldShowWelcome();
      const isFirstTime = await databaseService.isFirstTimeUser();
      
      setStats({
        ...databaseStats,
        shouldShowWelcome: shouldShow,
        isFirstTimeUser: isFirstTime
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const resetWelcome = async () => {
    try {
      await databaseService.resetWelcomeStatus();
      Alert.alert('Success', 'Welcome status reset. Restart the app to see welcome screen.');
      loadStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to reset welcome status');
    }
  };

  const clearDatabase = async () => {
    Alert.alert(
      'Clear Database',
      'This will clear all data and reset the app to first-time state.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.clearAllData();
              Alert.alert('Success', 'Database cleared. Restart the app.');
              loadStats();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear database');
            }
          },
        },
      ]
    );
  };

  React.useEffect(() => {
    loadStats();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FontAwesome5 name="bug" size={20} color="#e74c3c" />
        <Text style={styles.title}>Debug Panel</Text>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statText}>Total Users: {stats.totalUsers || 0}</Text>
        <Text style={styles.statText}>Should Show Welcome: {stats.shouldShowWelcome ? 'YES' : 'NO'}</Text>
        <Text style={styles.statText}>Is First Time User: {stats.isFirstTimeUser ? 'YES' : 'NO'}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={loadStats}>
          <FontAwesome5 name="refresh" size={16} color="#fff" />
          <Text style={styles.buttonText}>Refresh Stats</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.warningButton]} onPress={resetWelcome}>
          <FontAwesome5 name="undo" size={16} color="#fff" />
          <Text style={styles.buttonText}>Reset Welcome</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearDatabase}>
          <FontAwesome5 name="trash" size={16} color="#fff" />
          <Text style={styles.buttonText}>Clear Database</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e74c3c',
    marginLeft: 8,
  },
  statsContainer: {
    marginBottom: 16,
  },
  statText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  warningButton: {
    backgroundColor: '#f39c12',
  },
  dangerButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default DebugPanel;
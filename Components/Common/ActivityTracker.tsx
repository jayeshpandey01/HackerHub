import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { authService } from '../../services/authService';

interface Activity {
  id: string;
  userId: string;
  action: string;
  details: any;
  timestamp: string;
  category: 'login' | 'profile_update' | 'consultation' | 'health_data' | 'system';
}

interface ActivityTrackerProps {
  limit?: number;
  showExportButton?: boolean;
}

const ActivityTracker: React.FC<ActivityTrackerProps> = ({ 
  limit = 20, 
  showExportButton = false 
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadActivities = async () => {
    try {
      const userActivities = await authService.getUserActivities(limit);
      setActivities(userActivities);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadActivities();
  };

  const handleExportData = async () => {
    try {
      const exportData = await authService.exportUserData();
      // In a real app, you would save this to a file or share it
      console.log('Exported data:', exportData);
      alert('Data exported successfully! Check console for details.');
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'login':
        return 'sign-in-alt';
      case 'profile_update':
        return 'user-edit';
      case 'consultation':
        return 'stethoscope';
      case 'health_data':
        return 'heartbeat';
      case 'system':
        return 'cog';
      default:
        return 'circle';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'login':
        return '#4CAF50';
      case 'profile_update':
        return '#2196F3';
      case 'consultation':
        return '#FF9800';
      case 'health_data':
        return '#E91E63';
      case 'system':
        return '#9E9E9E';
      default:
        return '#757575';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const formatActionText = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <FontAwesome5 name="history" size={20} color="#667eea" />
          <Text style={styles.title}>Activity History</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <FontAwesome5 name="history" size={20} color="#667eea" />
          <Text style={styles.title}>Activity History</Text>
        </View>
        {showExportButton && (
          <TouchableOpacity style={styles.exportButton} onPress={handleExportData}>
            <FontAwesome5 name="download" size={14} color="#667eea" />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.activitiesList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="history" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No activities yet</Text>
            <Text style={styles.emptySubtext}>Your activity history will appear here</Text>
          </View>
        ) : (
          activities.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <FontAwesome5
                  name={getCategoryIcon(activity.category)}
                  size={16}
                  color={getCategoryColor(activity.category)}
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityAction}>
                  {formatActionText(activity.action)}
                </Text>
                <Text style={styles.activityTime}>
                  {formatTimestamp(activity.timestamp)}
                </Text>
                {activity.details && Object.keys(activity.details).length > 0 && (
                  <Text style={styles.activityDetails} numberOfLines={2}>
                    {JSON.stringify(activity.details, null, 0).slice(0, 100)}
                    {JSON.stringify(activity.details).length > 100 && '...'}
                  </Text>
                )}
              </View>
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(activity.category) + '20' }]}>
                <Text style={[styles.categoryText, { color: getCategoryColor(activity.category) }]}>
                  {activity.category.replace('_', ' ')}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  exportButtonText: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  activitiesList: {
    maxHeight: 300,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
  emptySubtext: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityTime: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginBottom: 4,
  },
  activityDetails: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

export default ActivityTracker;
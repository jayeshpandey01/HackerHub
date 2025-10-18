import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { AnalysisResult, FormFeedback } from '../../services/fitnessBackendService';
import { ExerciseType } from '../../services/simpleFitnessService';

const { width } = Dimensions.get('window');

interface DetailedFeedbackProps {
  analysisResult: AnalysisResult | null;
  sessionData: any[];
  exercise: ExerciseType;
  workoutDuration: number;
  onClose?: () => void;
}

interface FeedbackCategory {
  type: 'strengths' | 'improvements' | 'warnings' | 'recommendations';
  title: string;
  icon: string;
  color: string;
  items: string[];
}

interface BodyPartFeedback {
  bodyPart: string;
  issues: FormFeedback[];
  severity: 'low' | 'medium' | 'high';
  icon: string;
}

interface TimelineFeedback {
  timestamp: number;
  message: string;
  type: 'warning' | 'correction' | 'success';
  severity: 'low' | 'medium' | 'high';
  bodyPart?: string;
}

const DetailedFeedback: React.FC<DetailedFeedbackProps> = ({
  analysisResult,
  sessionData,
  exercise,
  workoutDuration,
  onClose
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'timeline' | 'bodyparts'>('overview');
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const categorizeFormFeedback = (): FeedbackCategory[] => {
    const categories: FeedbackCategory[] = [];
    
    if (!analysisResult?.formFeedback && sessionData.length === 0) {
      return categories;
    }

    const feedback = analysisResult?.formFeedback || [];
    const sessionWarnings = sessionData.flatMap(data => data.poseData?.warnings || []);
    
    // Strengths
    const strengths = feedback
      .filter(f => f.type === 'success')
      .map(f => f.message);
    
    if (strengths.length > 0) {
      categories.push({
        type: 'strengths',
        title: 'What You Did Well',
        icon: 'check-circle',
        color: '#4CAF50',
        items: strengths
      });
    }

    // Areas for Improvement
    const improvements = feedback
      .filter(f => f.type === 'correction')
      .map(f => f.message);
    
    if (improvements.length > 0) {
      categories.push({
        type: 'improvements',
        title: 'Areas for Improvement',
        icon: 'target',
        color: '#2196F3',
        items: improvements
      });
    }

    // Common Issues/Warnings
    const uniqueWarnings = [...new Set(sessionWarnings)];
    if (uniqueWarnings.length > 0) {
      categories.push({
        type: 'warnings',
        title: 'Common Issues Detected',
        icon: 'exclamation-triangle',
        color: '#FF9800',
        items: uniqueWarnings.slice(0, 5) // Limit to top 5
      });
    }

    // Recommendations
    if (analysisResult?.recommendations && analysisResult.recommendations.length > 0) {
      categories.push({
        type: 'recommendations',
        title: 'Personalized Recommendations',
        icon: 'lightbulb',
        color: '#9C27B0',
        items: analysisResult.recommendations
      });
    }

    return categories;
  };

  const getBodyPartFeedback = (): BodyPartFeedback[] => {
    if (!analysisResult?.formFeedback) return [];

    const bodyPartMap = new Map<string, FormFeedback[]>();
    
    analysisResult.formFeedback.forEach(feedback => {
      if (!bodyPartMap.has(feedback.bodyPart)) {
        bodyPartMap.set(feedback.bodyPart, []);
      }
      bodyPartMap.get(feedback.bodyPart)!.push(feedback);
    });

    const bodyPartIcons: Record<string, string> = {
      'shoulders': 'user-circle',
      'arms': 'hand-paper',
      'back': 'user',
      'core': 'circle',
      'hips': 'circle-notch',
      'legs': 'walking',
      'knees': 'dot-circle',
      'ankles': 'shoe-prints',
      'general': 'user-check'
    };

    return Array.from(bodyPartMap.entries()).map(([bodyPart, issues]) => {
      const severities = issues.map(i => i.severity);
      const overallSeverity = severities.includes('high') ? 'high' : 
                             severities.includes('medium') ? 'medium' : 'low';

      return {
        bodyPart,
        issues,
        severity: overallSeverity,
        icon: bodyPartIcons[bodyPart.toLowerCase()] || 'user-check'
      };
    }).sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  };

  const getTimelineFeedback = (): TimelineFeedback[] => {
    const timeline: TimelineFeedback[] = [];
    
    // Add form feedback with timestamps
    if (analysisResult?.formFeedback) {
      analysisResult.formFeedback.forEach(feedback => {
        timeline.push({
          timestamp: feedback.timestamp,
          message: feedback.message,
          type: feedback.type,
          severity: feedback.severity,
          bodyPart: feedback.bodyPart
        });
      });
    }

    // Add session warnings with estimated timestamps
    sessionData.forEach((data, index) => {
      if (data.poseData?.warnings && data.poseData.warnings.length > 0) {
        const estimatedTimestamp = (index / sessionData.length) * workoutDuration * 1000;
        data.poseData.warnings.forEach((warning: string) => {
          timeline.push({
            timestamp: estimatedTimestamp,
            message: warning,
            type: 'warning',
            severity: 'medium'
          });
        });
      }
    });

    return timeline.sort((a, b) => a.timestamp - b.timestamp);
  };

  const formatTimestamp = (timestamp: number): string => {
    const seconds = Math.floor(timestamp / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high'): string => {
    switch (severity) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getFeedbackTypeIcon = (type: 'warning' | 'correction' | 'success'): string => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'warning': return 'exclamation-triangle';
      case 'correction': return 'info-circle';
      default: return 'info';
    }
  };

  const renderOverviewTab = () => {
    const categories = categorizeFormFeedback();

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {categories.length === 0 ? (
          <View style={styles.noDataContainer}>
            <FontAwesome5 name="info-circle" size={48} color="rgba(255, 255, 255, 0.3)" />
            <Text style={styles.noDataTitle}>No Detailed Feedback Available</Text>
            <Text style={styles.noDataText}>
              Complete a workout with pose analysis enabled to receive detailed feedback.
            </Text>
          </View>
        ) : (
          categories.map((category, index) => (
            <View key={index} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <FontAwesome5 name={category.icon} size={20} color={category.color} />
                <Text style={[styles.categoryTitle, { color: category.color }]}>
                  {category.title}
                </Text>
              </View>
              <View style={styles.categoryContent}>
                {category.items.map((item, itemIndex) => (
                  <View key={itemIndex} style={styles.feedbackItem}>
                    <View style={[styles.feedbackDot, { backgroundColor: category.color }]} />
                    <Text style={styles.feedbackText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const renderTimelineTab = () => {
    const timeline = getTimelineFeedback();

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {timeline.length === 0 ? (
          <View style={styles.noDataContainer}>
            <FontAwesome5 name="clock" size={48} color="rgba(255, 255, 255, 0.3)" />
            <Text style={styles.noDataTitle}>No Timeline Data</Text>
            <Text style={styles.noDataText}>
              Timeline feedback will appear here during pose analysis sessions.
            </Text>
          </View>
        ) : (
          <View style={styles.timelineContainer}>
            {timeline.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <Text style={styles.timelineTime}>
                    {formatTimestamp(item.timestamp)}
                  </Text>
                  <View style={[
                    styles.timelineDot, 
                    { backgroundColor: getSeverityColor(item.severity) }
                  ]} />
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <FontAwesome5 
                      name={getFeedbackTypeIcon(item.type)} 
                      size={14} 
                      color={getSeverityColor(item.severity)} 
                    />
                    {item.bodyPart && (
                      <Text style={styles.timelineBodyPart}>{item.bodyPart}</Text>
                    )}
                  </View>
                  <Text style={styles.timelineMessage}>{item.message}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderBodyPartsTab = () => {
    const bodyPartFeedback = getBodyPartFeedback();

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {bodyPartFeedback.length === 0 ? (
          <View style={styles.noDataContainer}>
            <FontAwesome5 name="user-check" size={48} color="rgba(255, 255, 255, 0.3)" />
            <Text style={styles.noDataTitle}>No Body Part Analysis</Text>
            <Text style={styles.noDataText}>
              Body part specific feedback will appear here with pose analysis.
            </Text>
          </View>
        ) : (
          bodyPartFeedback.map((bodyPart, index) => (
            <View key={index} style={styles.bodyPartCard}>
              <View style={styles.bodyPartHeader}>
                <View style={styles.bodyPartInfo}>
                  <FontAwesome5 name={bodyPart.icon} size={20} color="#667eea" />
                  <Text style={styles.bodyPartName}>{bodyPart.bodyPart}</Text>
                </View>
                <View style={[
                  styles.severityBadge, 
                  { backgroundColor: `${getSeverityColor(bodyPart.severity)}20` }
                ]}>
                  <Text style={[
                    styles.severityText, 
                    { color: getSeverityColor(bodyPart.severity) }
                  ]}>
                    {bodyPart.severity.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.bodyPartIssues}>
                {bodyPart.issues.map((issue, issueIndex) => (
                  <View key={issueIndex} style={styles.issueItem}>
                    <FontAwesome5 
                      name={getFeedbackTypeIcon(issue.type)} 
                      size={12} 
                      color={getSeverityColor(issue.severity)} 
                    />
                    <Text style={styles.issueText}>{issue.message}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
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
          <FontAwesome5 name="clipboard-list" size={24} color="#667eea" />
          <Text style={styles.headerTitle}>Detailed Feedback</Text>
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
          { key: 'overview', label: 'Overview', icon: 'list' },
          { key: 'timeline', label: 'Timeline', icon: 'clock' },
          { key: 'bodyparts', label: 'Body Parts', icon: 'user-check' }
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
      {selectedTab === 'timeline' && renderTimelineTab()}
      {selectedTab === 'bodyparts' && renderBodyPartsTab()}
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
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  categoryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  categoryContent: {
    gap: 12,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  feedbackDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 12,
  },
  feedbackText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    flex: 1,
  },
  timelineContainer: {
    paddingTop: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
    width: 60,
  },
  timelineTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
    fontWeight: '600',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineBodyPart: {
    fontSize: 12,
    color: '#667eea',
    marginLeft: 8,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  timelineMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  bodyPartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bodyPartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bodyPartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bodyPartName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 12,
    textTransform: 'capitalize',
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bodyPartIssues: {
    gap: 12,
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  issueText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
});

export default DetailedFeedback;
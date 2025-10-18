import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { PoseData, PoseKeypoint } from '../../services/fitnessBackendService';

const { width, height } = Dimensions.get('window');

interface PoseOverlayProps {
  poseData: PoseData;
  exerciseType: string;
  isVisible: boolean;
}

const PoseOverlay: React.FC<PoseOverlayProps> = ({
  poseData,
  exerciseType,
  isVisible
}) => {
  if (!isVisible || !poseData) return null;

  const renderKeypoint = (keypoint: PoseKeypoint, index: number) => {
    // Convert normalized coordinates to screen coordinates
    const x = keypoint.x * width;
    const y = keypoint.y * height;
    
    // Determine keypoint color based on visibility/confidence
    const confidence = keypoint.visibility || 1;
    const color = confidence > 0.8 ? '#4CAF50' : confidence > 0.5 ? '#FF9800' : '#F44336';
    
    return (
      <View
        key={`${keypoint.name}-${index}`}
        style={[
          styles.keypoint,
          {
            left: x - 4,
            top: y - 4,
            backgroundColor: color,
            opacity: confidence
          }
        ]}
      />
    );
  };

  const renderSkeleton = () => {
    // Define skeleton connections for major body parts
    const connections = [
      // Head to shoulders
      ['nose', 'left_shoulder'],
      ['nose', 'right_shoulder'],
      
      // Shoulders to elbows
      ['left_shoulder', 'left_elbow'],
      ['right_shoulder', 'right_elbow'],
      
      // Elbows to wrists
      ['left_elbow', 'left_wrist'],
      ['right_elbow', 'right_wrist'],
      
      // Torso
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      
      // Hips to knees
      ['left_hip', 'left_knee'],
      ['right_hip', 'right_knee'],
      
      // Knees to ankles
      ['left_knee', 'left_ankle'],
      ['right_knee', 'right_ankle'],
    ];

    return connections.map((connection, index) => {
      const [startName, endName] = connection;
      const startPoint = poseData.keypoints.find(kp => kp.name === startName);
      const endPoint = poseData.keypoints.find(kp => kp.name === endName);
      
      if (!startPoint || !endPoint) return null;
      
      const startX = startPoint.x * width;
      const startY = startPoint.y * height;
      const endX = endPoint.x * width;
      const endY = endPoint.y * height;
      
      // Calculate line properties
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      
      // Line confidence based on both keypoints
      const confidence = Math.min(startPoint.visibility || 1, endPoint.visibility || 1);
      const color = confidence > 0.8 ? '#4CAF50' : confidence > 0.5 ? '#FF9800' : '#F44336';
      
      return (
        <View
          key={`line-${index}`}
          style={[
            styles.skeletonLine,
            {
              left: startX,
              top: startY,
              width: distance,
              transform: [{ rotate: `${angle}deg` }],
              backgroundColor: color,
              opacity: confidence * 0.7
            }
          ]}
        />
      );
    });
  };

  const getFormFeedbackColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getFormFeedbackIcon = (score: number) => {
    if (score >= 80) return 'check-circle';
    if (score >= 60) return 'exclamation-triangle';
    return 'times-circle';
  };

  const getExerciseSpecificFeedback = () => {
    switch (exerciseType) {
      case 'squat':
        return {
          keyFocus: ['left_knee', 'right_knee', 'left_hip', 'right_hip'],
          tips: [
            'Keep knees aligned with toes',
            'Lower until thighs are parallel',
            'Keep chest up and back straight'
          ]
        };
      case 'push_up':
        return {
          keyFocus: ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow'],
          tips: [
            'Keep body in straight line',
            'Lower chest to ground',
            'Push up with control'
          ]
        };
      case 'hammer_curl':
        return {
          keyFocus: ['left_elbow', 'right_elbow', 'left_wrist', 'right_wrist'],
          tips: [
            'Keep elbows at sides',
            'Control the movement',
            'Full range of motion'
          ]
        };
      default:
        return {
          keyFocus: [],
          tips: ['Follow proper form', 'Control your movement']
        };
    }
  };

  const exerciseFeedback = getExerciseSpecificFeedback();

  return (
    <View style={styles.overlay}>
      {/* Skeleton Lines */}
      {renderSkeleton()}
      
      {/* Keypoints */}
      {poseData.keypoints.map(renderKeypoint)}
      
      {/* AI Confidence Indicator */}
      <View style={styles.confidenceContainer}>
        <View style={[
          styles.confidenceIndicator,
          { 
            backgroundColor: poseData.confidence > 0.8 ? '#4CAF50' : 
                           poseData.confidence > 0.6 ? '#FF9800' : '#F44336'
          }
        ]}>
          <FontAwesome5 
            name={poseData.confidence > 0.8 ? 'check-circle' : 
                  poseData.confidence > 0.6 ? 'exclamation-circle' : 'times-circle'} 
            size={12} 
            color="#fff" 
          />
          <Text style={styles.confidenceText}>
            AI: {poseData.confidence > 0.8 ? 'Stable' : 
                 poseData.confidence > 0.6 ? 'Tracking' : 'Unstable'}
          </Text>
        </View>
      </View>

      {/* Form Score Display */}
      <View style={styles.formScoreContainer}>
        <View style={styles.formScoreHeader}>
          <FontAwesome5 
            name={getFormFeedbackIcon(poseData.formScore)} 
            size={16} 
            color={getFormFeedbackColor(poseData.formScore)} 
          />
          <Text style={styles.formScoreLabel}>Form Score</Text>
        </View>
        <Text style={[styles.formScore, { color: getFormFeedbackColor(poseData.formScore) }]}>
          {Math.round(poseData.formScore)}%
        </Text>
      </View>
      
      {/* Real-time Warnings */}
      {poseData.warnings.length > 0 && (
        <View style={styles.warningsContainer}>
          <View style={styles.warningHeader}>
            <FontAwesome5 name="exclamation-triangle" size={14} color="#fff" />
            <Text style={styles.warningHeaderText}>Form Corrections</Text>
          </View>
          {poseData.warnings.slice(0, 3).map((warning, index) => (
            <Text key={index} style={styles.warningText}>• {warning}</Text>
          ))}
        </View>
      )}
      
      {/* Exercise Stage Indicator */}
      <View style={styles.stageContainer}>
        <Text style={styles.stageLabel}>Stage</Text>
        <Text style={[styles.stageText, { 
          color: poseData.stage === 'up' ? '#4CAF50' : 
                poseData.stage === 'down' ? '#2196F3' : 
                poseData.stage === 'hold' ? '#FF9800' : '#9E9E9E' 
        }]}>
          {poseData.stage.toUpperCase()}
        </Text>
      </View>
      
      {/* Rep Counter */}
      <View style={styles.repCounterContainer}>
        <Text style={styles.repCounterLabel}>AI Detected</Text>
        <Text style={styles.repCounterValue}>{poseData.currentRep}</Text>
        <Text style={styles.repCounterSubtext}>reps</Text>
      </View>
      
      {/* Exercise-specific Tips */}
      {exerciseFeedback.tips.length > 0 && poseData.formScore < 70 && (
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsHeader}>💡 Tips:</Text>
          {exerciseFeedback.tips.slice(0, 2).map((tip, index) => (
            <Text key={index} style={styles.tipText}>• {tip}</Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  keypoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fff',
  },
  skeletonLine: {
    position: 'absolute',
    height: 2,
    transformOrigin: '0 50%',
  },
  formScoreContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  formScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  formScoreLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 6,
  },
  formScore: {
    fontSize: 28,
    fontWeight: '700',
  },
  warningsContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    borderRadius: 12,
    padding: 12,
    maxWidth: 220,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningHeaderText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  warningText: {
    fontSize: 11,
    color: '#fff',
    marginBottom: 2,
    lineHeight: 16,
  },
  stageContainer: {
    position: 'absolute',
    top: 120,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  stageLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  stageText: {
    fontSize: 14,
    fontWeight: '700',
  },
  repCounterContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  repCounterLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  repCounterValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  repCounterSubtext: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tipsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    borderRadius: 12,
    padding: 12,
  },
  tipsHeader: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 11,
    color: '#fff',
    marginBottom: 2,
    lineHeight: 16,
  },
  confidenceContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  confidenceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  confidenceText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
});

export default PoseOverlay;
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { PoseData, FormFeedback } from '../../services/fitnessBackendService';

interface FeedbackSystemProps {
  poseData: PoseData | null;
  exerciseType: string;
  isEnabled: boolean;
  audioEnabled?: boolean;
  visualEnabled?: boolean;
  hapticEnabled?: boolean;
}

interface FeedbackMessage {
  id: string;
  type: 'success' | 'warning' | 'correction';
  message: string;
  timestamp: number;
  duration: number;
}

const FeedbackSystem: React.FC<FeedbackSystemProps> = ({
  poseData,
  exerciseType,
  isEnabled,
  audioEnabled = true,
  visualEnabled = true,
  hapticEnabled = true
}) => {
  const [feedbackMessages, setFeedbackMessages] = useState<FeedbackMessage[]>([]);
  const [lastFormScore, setLastFormScore] = useState<number>(0);
  const [lastStage, setLastStage] = useState<string>('');
  const [repCount, setRepCount] = useState<number>(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isEnabled || !poseData) return;

    // Check for form improvements/degradations
    checkFormChanges();
    
    // Check for stage transitions
    checkStageTransitions();
    
    // Check for rep completion
    checkRepCompletion();
    
    // Process warnings
    processWarnings();

  }, [poseData, isEnabled]);

  const checkFormChanges = () => {
    if (!poseData) return;
    
    const currentScore = poseData.formScore;
    const scoreDiff = currentScore - lastFormScore;
    
    // Significant improvement
    if (scoreDiff >= 15 && currentScore >= 80) {
      addFeedbackMessage('success', 'Excellent form! 🎯', 2000);
      triggerHapticFeedback('success');
    }
    // Significant degradation
    else if (scoreDiff <= -20 && currentScore < 60) {
      addFeedbackMessage('warning', 'Check your form 📐', 3000);
      triggerHapticFeedback('warning');
      triggerShakeAnimation();
    }
    
    setLastFormScore(currentScore);
  };

  const checkStageTransitions = () => {
    if (!poseData || poseData.stage === lastStage) return;
    
    const stageMessages = getStageTransitionMessages(exerciseType, poseData.stage);
    
    if (stageMessages[poseData.stage]) {
      addFeedbackMessage('correction', stageMessages[poseData.stage], 2000);
      triggerHapticFeedback('light');
    }
    
    setLastStage(poseData.stage);
  };

  const checkRepCompletion = () => {
    if (!poseData) return;
    
    if (poseData.currentRep > repCount) {
      addFeedbackMessage('success', `Rep ${poseData.currentRep} completed! 💪`, 2000);
      triggerHapticFeedback('success');
      triggerPulseAnimation();
      setRepCount(poseData.currentRep);
    }
  };

  const processWarnings = () => {
    if (!poseData || poseData.warnings.length === 0) return;
    
    // Only show the most critical warning to avoid spam
    const criticalWarning = poseData.warnings[0];
    const warningId = `warning-${criticalWarning.substring(0, 20)}`;
    
    // Don't repeat the same warning too frequently
    const existingWarning = feedbackMessages.find(msg => msg.id === warningId);
    if (existingWarning && Date.now() - existingWarning.timestamp < 3000) return;
    
    addFeedbackMessage('warning', criticalWarning, 3000, warningId);
    triggerHapticFeedback('warning');
  };

  const getStageTransitionMessages = (exercise: string, stage: string): Record<string, string> => {
    const messages: Record<string, Record<string, string>> = {
      squat: {
        down: 'Lower down slowly 🔽',
        up: 'Push up through heels 🔼',
        hold: 'Hold the position 🛑'
      },
      push_up: {
        down: 'Lower chest to ground 🔽',
        up: 'Push up with control 🔼',
        hold: 'Hold plank position 🛑'
      },
      hammer_curl: {
        up: 'Curl up to shoulders 🔼',
        down: 'Lower with control 🔽',
        hold: 'Squeeze at the top 🛑'
      }
    };
    
    return messages[exercise] || {};
  };

  const addFeedbackMessage = (
    type: FeedbackMessage['type'], 
    message: string, 
    duration: number = 2000,
    customId?: string
  ) => {
    const id = customId || `${type}-${Date.now()}-${Math.random()}`;
    
    const newMessage: FeedbackMessage = {
      id,
      type,
      message,
      timestamp: Date.now(),
      duration
    };
    
    setFeedbackMessages(prev => {
      // Remove old messages of the same type to prevent spam
      const filtered = prev.filter(msg => msg.type !== type || msg.id === id);
      return [...filtered, newMessage];
    });
    
    // Auto-remove message after duration
    setTimeout(() => {
      setFeedbackMessages(prev => prev.filter(msg => msg.id !== id));
    }, duration);
    
    // Trigger visual animation
    if (visualEnabled) {
      triggerFadeAnimation();
    }
  };

  const triggerHapticFeedback = (type: 'success' | 'warning' | 'light') => {
    if (!hapticEnabled || Platform.OS !== 'ios') return;
    
    try {
      switch (type) {
        case 'success':
          // In a real app, you'd use Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          Vibration.vibrate(100);
          break;
        case 'warning':
          // In a real app, you'd use Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          Vibration.vibrate([100, 50, 100]);
          break;
        case 'light':
          // In a real app, you'd use Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          Vibration.vibrate(50);
          break;
      }
    } catch (error) {
      console.log('Haptic feedback not available');
    }
  };

  const triggerFadeAnimation = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        delay: 1500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerPulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getFeedbackIcon = (type: FeedbackMessage['type']) => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'warning': return 'exclamation-triangle';
      case 'correction': return 'info-circle';
      default: return 'info';
    }
  };

  const getFeedbackColor = (type: FeedbackMessage['type']) => {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'correction': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  if (!isEnabled || !visualEnabled) return null;

  return (
    <View style={styles.container}>
      {/* Main Feedback Messages */}
      <Animated.View 
        style={[
          styles.feedbackContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: pulseAnim },
              { translateX: shakeAnim }
            ]
          }
        ]}
      >
        {feedbackMessages.slice(-2).map((feedback) => (
          <View
            key={feedback.id}
            style={[
              styles.feedbackMessage,
              { backgroundColor: `${getFeedbackColor(feedback.type)}E6` }
            ]}
          >
            <FontAwesome5
              name={getFeedbackIcon(feedback.type)}
              size={16}
              color="#fff"
            />
            <Text style={styles.feedbackText}>{feedback.message}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Form Score Indicator */}
      {poseData && (
        <View style={styles.formIndicator}>
          <View style={[
            styles.formBar,
            { backgroundColor: poseData.formScore >= 80 ? '#4CAF50' : poseData.formScore >= 60 ? '#FF9800' : '#F44336' }
          ]}>
            <View style={[
              styles.formProgress,
              { width: `${poseData.formScore}%` }
            ]} />
          </View>
          <Text style={styles.formText}>Form: {Math.round(poseData.formScore)}%</Text>
        </View>
      )}

      {/* Stage Progress Indicator */}
      {poseData && (
        <View style={styles.stageIndicator}>
          <View style={styles.stageSteps}>
            {['down', 'hold', 'up'].map((stage, index) => (
              <View
                key={stage}
                style={[
                  styles.stageStep,
                  {
                    backgroundColor: poseData.stage === stage ? '#4CAF50' : 'rgba(255, 255, 255, 0.3)'
                  }
                ]}
              >
                <Text style={[
                  styles.stageStepText,
                  { color: poseData.stage === stage ? '#fff' : 'rgba(255, 255, 255, 0.7)' }
                ]}>
                  {stage.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    pointerEvents: 'none',
  },
  feedbackContainer: {
    position: 'absolute',
    top: '40%',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  feedbackMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '90%',
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
    textAlign: 'center',
  },
  formIndicator: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  formBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  formProgress: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  formText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
  },
  stageIndicator: {
    position: 'absolute',
    bottom: 160,
    left: 20,
    right: 20,
  },
  stageSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stageStep: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  stageStepText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

export default FeedbackSystem;
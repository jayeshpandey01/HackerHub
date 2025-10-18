import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { networkService } from '../../services/networkService';

interface OfflineIndicatorProps {
  style?: any;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ style }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Check initial network status
    setIsOnline(networkService.getOnlineStatus());

    // Set up periodic network status checks
    const interval = setInterval(async () => {
      const healthCheck = await networkService.healthCheck();
      const online = healthCheck.success;
      
      if (online !== isOnline) {
        setIsOnline(online);
        networkService.setOnlineStatus(online);
        
        // Animate the indicator
        Animated.timing(fadeAnim, {
          toValue: online ? 0 : 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [isOnline, fadeAnim]);

  if (isOnline) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, style, { opacity: fadeAnim }]}>
      <View style={styles.indicator}>
        <FontAwesome5 name="wifi" size={14} color="#fff" />
        <Text style={styles.text}>Offline Mode</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  indicator: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default OfflineIndicator;
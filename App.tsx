import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import WelcomeScreen from './Components/Welcome';
import AuthScreen from './Components/Auth/AuthScreen';
import PatientDashboard from './Components/Dashboard/PatientDashboard';
import DoctorDashboard from './Components/Dashboard/DoctorDashboard';

// Simple app state type
type AppState = 'loading' | 'welcome' | 'auth' | 'dashboard';
type UserType = 'doctor' | 'patient';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  specialization?: string[];
  patientType?: string[];
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  // Initialize app
  useEffect(() => {
    const initApp = async () => {
      // Simulate initialization
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For demo, always show welcome first time, then skip
      setAppState('welcome');
    };

    initApp();
  }, []);

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
    setAppState('auth');
  };

  const handleAuthSuccess = (userType: UserType, userData: any) => {
    console.log('Authentication successful:', userType, userData);

    const user: User = {
      id: userData.id || `${userType}_${Date.now()}`,
      email: userData.email,
      firstName: userData.firstName || (userType === 'doctor' ? 'Dr. John' : 'Jane'),
      lastName: userData.lastName || (userType === 'doctor' ? 'Smith' : 'Doe'),
      userType,
      specialization: userData.specialization,
      patientType: userData.patientType
    };

    setUser(user);
    setAppState('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setAppState('auth');
  };

  // Render based on app state
  switch (appState) {
    case 'loading':
      return (
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.loadingText}>Initializing Swap Health...</Text>
          <StatusBar style="light" />
        </View>
      );

    case 'welcome':
      return (
        <View style={styles.container}>
          <WelcomeScreen onNext={handleWelcomeComplete} />
          <StatusBar style="light" />
        </View>
      );

    case 'auth':
      return (
        <View style={styles.container}>
          <AuthScreen onAuthSuccess={handleAuthSuccess} />
          <StatusBar style="light" />
        </View>
      );

    case 'dashboard':
      if (!user) {
        // Fallback if user is null
        setAppState('auth');
        return null;
      }

      const medicalProfile = {
        userId: user.id,
        diseases: user.userType === 'patient' ? ['general_wellness'] : [],
        specialization: user.userType === 'doctor' ? user.specialization || ['general_practice'] : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (user.userType === 'patient') {
        return (
          <View style={styles.container}>
            <PatientDashboard
              userData={user}
              medicalProfile={medicalProfile}
              onLogout={handleLogout}
            />
            <StatusBar style="dark" />
          </View>
        );
      }

      if (user.userType === 'doctor') {
        return (
          <View style={styles.container}>
            <DoctorDashboard
              userData={user}
              medicalProfile={medicalProfile}
              onLogout={handleLogout}
            />
            <StatusBar style="dark" />
          </View>
        );
      }

      // Fallback
      return (
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.loadingText}>Unknown user type</Text>
          <StatusBar style="light" />
        </View>
      );

    default:
      return (
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.loadingText}>Unknown app state</Text>
          <StatusBar style="light" />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
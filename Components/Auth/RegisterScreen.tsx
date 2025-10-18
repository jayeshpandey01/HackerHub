import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { authService } from '../../services/authService';

const { width, height } = Dimensions.get('window');

interface RegisterScreenProps {
  userType: 'doctor' | 'patient';
  specialization?: string[];
  patientType?: string[];
  onBack: () => void;
  onSwitchToLogin: () => void;
  onAuthSuccess: (userType: 'doctor' | 'patient', userData: any) => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({
  userType,
  specialization,
  patientType,
  onBack,
  onSwitchToLogin,
  onAuthSuccess,
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Doctor specific fields
    licenseNumber: '',
    specialization: '',
    // Patient specific fields
    dateOfBirth: '',
    phoneNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (userType === 'doctor' && (!formData.licenseNumber || !formData.specialization)) {
      Alert.alert('Error', 'Please fill in license number and specialization');
      return;
    }

    setLoading(true);
    try {
      const userData = await authService.register(formData, userType);
      // Include specialization/patient type data
      const enhancedUserData = {
        ...userData,
        specialization: userType === 'doctor' ? specialization : undefined,
        patientType: userType === 'patient' ? patientType : undefined,
      };
      onAuthSuccess(userType, enhancedUserData);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getUserTypeColor = () => {
    return userType === 'doctor' ? '#f093fb' : '#667eea';
  };

  return (
    <View style={styles.container}>
      {/* Background Elements */}
      <View style={styles.backgroundElements}>
        <View style={[styles.backgroundCircle1, { backgroundColor: getUserTypeColor() + '15' }]} />
        <View style={[styles.backgroundCircle2, { backgroundColor: getUserTypeColor() + '10' }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <FontAwesome5 name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Register as {userType === 'doctor' ? 'Doctor' : 'Patient'}
          </Text>
        </View>
      </View>

      {/* Registration Form */}
      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.row}>
          <View style={[styles.inputContainer, styles.halfWidth]}>
            <FontAwesome5 name="user" size={16} color="rgba(255, 255, 255, 0.5)" />
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={formData.firstName}
              onChangeText={(value) => updateFormData('firstName', value)}
              autoCapitalize="words"
            />
          </View>
          <View style={[styles.inputContainer, styles.halfWidth]}>
            <FontAwesome5 name="user" size={16} color="rgba(255, 255, 255, 0.5)" />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={formData.lastName}
              onChangeText={(value) => updateFormData('lastName', value)}
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <FontAwesome5 name="envelope" size={16} color="rgba(255, 255, 255, 0.5)" />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <FontAwesome5 name="lock" size={16} color="rgba(255, 255, 255, 0.5)" />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={formData.password}
            onChangeText={(value) => updateFormData('password', value)}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <FontAwesome5 
              name={showPassword ? "eye-slash" : "eye"} 
              size={16} 
              color="rgba(255, 255, 255, 0.5)" 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <FontAwesome5 name="lock" size={16} color="rgba(255, 255, 255, 0.5)" />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={formData.confirmPassword}
            onChangeText={(value) => updateFormData('confirmPassword', value)}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <FontAwesome5 
              name={showConfirmPassword ? "eye-slash" : "eye"} 
              size={16} 
              color="rgba(255, 255, 255, 0.5)" 
            />
          </TouchableOpacity>
        </View>

        {/* Doctor specific fields */}
        {userType === 'doctor' && (
          <>
            <View style={styles.inputContainer}>
              <FontAwesome5 name="id-card" size={16} color="rgba(255, 255, 255, 0.5)" />
              <TextInput
                style={styles.input}
                placeholder="Medical License Number"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={formData.licenseNumber}
                onChangeText={(value) => updateFormData('licenseNumber', value)}
                autoCapitalize="characters"
              />
            </View>
            <View style={styles.inputContainer}>
              <FontAwesome5 name="stethoscope" size={16} color="rgba(255, 255, 255, 0.5)" />
              <TextInput
                style={styles.input}
                placeholder="Specialization"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={formData.specialization}
                onChangeText={(value) => updateFormData('specialization', value)}
                autoCapitalize="words"
              />
            </View>
          </>
        )}

        {/* Patient specific fields */}
        {userType === 'patient' && (
          <>
            <View style={styles.inputContainer}>
              <FontAwesome5 name="calendar" size={16} color="rgba(255, 255, 255, 0.5)" />
              <TextInput
                style={styles.input}
                placeholder="Date of Birth (YYYY-MM-DD)"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={formData.dateOfBirth}
                onChangeText={(value) => updateFormData('dateOfBirth', value)}
              />
            </View>
            <View style={styles.inputContainer}>
              <FontAwesome5 name="phone" size={16} color="rgba(255, 255, 255, 0.5)" />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={formData.phoneNumber}
                onChangeText={(value) => updateFormData('phoneNumber', value)}
                keyboardType="phone-pad"
              />
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.registerButton, { backgroundColor: getUserTypeColor() }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={onSwitchToLogin}>
            <Text style={[styles.footerLink, { color: getUserTypeColor() }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
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
    top: -width * 0.3,
    left: -width * 0.2,
  },
  backgroundCircle2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    bottom: -width * 0.2,
    right: -width * 0.15,
  },
  header: {
    paddingTop: height * 0.08,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  halfWidth: {
    width: '48%',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  registerButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;
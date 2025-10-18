import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import CustomDropdown from '../Common/CustomDropdown';
import AdminAccess from '../Admin/AdminAccess';

const { width, height } = Dimensions.get('window');

interface AuthScreenProps {
  onAuthSuccess: (userType: 'doctor' | 'patient', userData: any) => void;
}

// Doctor Specializations
const doctorSpecializations = [
  { label: 'General Practice', value: 'general_practice' },
  { label: 'Internal Medicine', value: 'internal_medicine' },
  { label: 'Cardiology', value: 'cardiology' },
  { label: 'Dermatology', value: 'dermatology' },
  { label: 'Endocrinology', value: 'endocrinology' },
  { label: 'Gastroenterology', value: 'gastroenterology' },
  { label: 'Neurology', value: 'neurology' },
  { label: 'Oncology', value: 'oncology' },
  { label: 'Orthopedics', value: 'orthopedics' },
  { label: 'Pediatrics', value: 'pediatrics' },
  { label: 'Psychiatry', value: 'psychiatry' },
  { label: 'Pulmonology', value: 'pulmonology' },
  { label: 'Rheumatology', value: 'rheumatology' },
  { label: 'Urology', value: 'urology' },
  { label: 'Gynecology', value: 'gynecology' },
  { label: 'Ophthalmology', value: 'ophthalmology' },
  { label: 'ENT (Otolaryngology)', value: 'ent' },
  { label: 'Anesthesiology', value: 'anesthesiology' },
  { label: 'Radiology', value: 'radiology' },
  { label: 'Pathology', value: 'pathology' },
  { label: 'Emergency Medicine', value: 'emergency_medicine' },
  { label: 'Family Medicine', value: 'family_medicine' },
  { label: 'Sports Medicine', value: 'sports_medicine' },
  { label: 'Physical Medicine & Rehabilitation', value: 'physical_medicine' },
  { label: 'Infectious Disease', value: 'infectious_disease' },
  { label: 'Other (Please specify)', value: 'other' }
];

// Patient Types
const patientTypes = [
  { label: 'General Health & Wellness', value: 'general_wellness' },
  { label: 'Chronic Disease Management', value: 'chronic_disease' },
  { label: 'Weight Management', value: 'weight_management' },
  { label: 'Fitness & Exercise', value: 'fitness_exercise' },
  { label: 'Mental Health Support', value: 'mental_health' },
  { label: 'Pregnancy & Maternal Health', value: 'pregnancy_maternal' },
  { label: 'Senior Health (65+)', value: 'senior_health' },
  { label: 'Pediatric Health (Child)', value: 'pediatric_health' },
  { label: 'Teen Health (13-18)', value: 'teen_health' },
  { label: 'Post-Surgery Recovery', value: 'post_surgery' },
  { label: 'Injury Rehabilitation', value: 'injury_rehab' },
  { label: 'Preventive Care', value: 'preventive_care' },
  { label: 'Nutrition & Diet', value: 'nutrition_diet' },
  { label: 'Sleep Disorders', value: 'sleep_disorders' },
  { label: 'Stress Management', value: 'stress_management' },
  { label: 'Addiction Recovery', value: 'addiction_recovery' },
  { label: 'Disability Support', value: 'disability_support' },
  { label: 'Rare Disease Support', value: 'rare_disease' },
  { label: 'Cancer Care Support', value: 'cancer_care' },
  { label: 'Heart Health', value: 'heart_health' },
  { label: 'Diabetes Management', value: 'diabetes_management' },
  { label: 'Respiratory Health', value: 'respiratory_health' },
  { label: 'Bone & Joint Health', value: 'bone_joint_health' },
  { label: 'Skin Health', value: 'skin_health' },
  { label: 'Other (Please specify)', value: 'other' }
];

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [currentScreen, setCurrentScreen] = useState<'selection' | 'login' | 'register'>('selection');
  const [userType, setUserType] = useState<'doctor' | 'patient'>('patient');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string[]>([]);
  const [selectedPatientType, setSelectedPatientType] = useState<string[]>([]);
  const [showSpecializationDropdown, setShowSpecializationDropdown] = useState(false);
  const [showPatientTypeDropdown, setShowPatientTypeDropdown] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));
  const [showAdminAccess, setShowAdminAccess] = useState(false);
  const [adminTapCount, setAdminTapCount] = useState(0);

  const animateTransition = (callback: () => void) => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      callback();
      slideAnim.setValue(0);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  const handleUserTypeSelection = (type: 'doctor' | 'patient') => {
    setUserType(type);
    // Reset selections when switching user types
    setSelectedSpecialization([]);
    setSelectedPatientType([]);
    setShowSpecializationDropdown(type === 'doctor');
    setShowPatientTypeDropdown(type === 'patient');
  };

  const handleContinueToLogin = () => {
    // Validate that user has made required selections
    if (userType === 'doctor' && selectedSpecialization.length === 0) {
      alert('Please select your medical specialization');
      return;
    }
    if (userType === 'patient' && selectedPatientType.length === 0) {
      alert('Please select your health focus area');
      return;
    }
    
    animateTransition(() => setCurrentScreen('login'));
  };

  const handleBackToSelection = () => {
    animateTransition(() => setCurrentScreen('selection'));
  };

  const handleSwitchToRegister = () => {
    animateTransition(() => setCurrentScreen('register'));
  };

  const handleSwitchToLogin = () => {
    animateTransition(() => setCurrentScreen('login'));
  };

  const handleAdminTap = () => {
    const newCount = adminTapCount + 1;
    setAdminTapCount(newCount);
    
    if (newCount >= 5) {
      setShowAdminAccess(true);
      setAdminTapCount(0);
    }
    
    // Reset counter after 3 seconds
    setTimeout(() => {
      setAdminTapCount(0);
    }, 3000);
  };

  if (currentScreen === 'login') {
    return (
      <LoginScreen
        userType={userType}
        specialization={userType === 'doctor' ? selectedSpecialization : undefined}
        patientType={userType === 'patient' ? selectedPatientType : undefined}
        onBack={handleBackToSelection}
        onSwitchToRegister={handleSwitchToRegister}
        onAuthSuccess={onAuthSuccess}
      />
    );
  }

  if (currentScreen === 'register') {
    return (
      <RegisterScreen
        userType={userType}
        specialization={userType === 'doctor' ? selectedSpecialization : undefined}
        patientType={userType === 'patient' ? selectedPatientType : undefined}
        onBack={handleBackToSelection}
        onSwitchToLogin={handleSwitchToLogin}
        onAuthSuccess={onAuthSuccess}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Elements */}
      <View style={styles.backgroundElements}>
        <View style={styles.backgroundCircle1} />
        <View style={styles.backgroundCircle2} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleAdminTap} activeOpacity={1}>
          <Text style={styles.brandName}>swap</Text>
        </TouchableOpacity>
        <Text style={styles.tagline}>Choose Your Role</Text>
      </View>

      {/* User Type Selection */}
      <Animated.View 
        style={[
          styles.selectionContainer,
          {
            transform: [{
              translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -width],
              })
            }]
          }
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
          <Text style={styles.selectionTitle}>How would you like to use Swap?</Text>
          
          <TouchableOpacity
            style={[
              styles.userTypeCard,
              userType === 'patient' && styles.selectedUserTypeCard
            ]}
            onPress={() => handleUserTypeSelection('patient')}
            activeOpacity={0.8}
          >
            <View style={[styles.userTypeIcon, styles.patientIcon]}>
              <FontAwesome5 name="user" size={32} color="#667eea" />
            </View>
            <View style={styles.userTypeContent}>
              <Text style={styles.userTypeTitle}>I'm a Patient</Text>
              <Text style={styles.userTypeDescription}>
                Track your health, get AI assistance, and connect with healthcare providers
              </Text>
            </View>
            {userType === 'patient' ? (
              <FontAwesome5 name="check-circle" size={20} color="#667eea" />
            ) : (
              <FontAwesome5 name="chevron-right" size={16} color="#ccc" />
            )}
          </TouchableOpacity>

          {/* Patient Type Dropdown */}
          {showPatientTypeDropdown && (
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownLabel}>What's your primary health focus?</Text>
              <CustomDropdown
                items={patientTypes}
                selectedValues={selectedPatientType}
                onSelectionChange={setSelectedPatientType}
                placeholder="Select your health focus area"
                multiple={true}
                maxHeight={300}
              />
              <Text style={styles.helperText}>
                Select one or more areas that best describe your health goals
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.userTypeCard,
              userType === 'doctor' && styles.selectedUserTypeCard
            ]}
            onPress={() => handleUserTypeSelection('doctor')}
            activeOpacity={0.8}
          >
            <View style={[styles.userTypeIcon, styles.doctorIcon]}>
              <FontAwesome5 name="user-md" size={32} color="#f093fb" />
            </View>
            <View style={styles.userTypeContent}>
              <Text style={styles.userTypeTitle}>I'm a Doctor</Text>
              <Text style={styles.userTypeDescription}>
                Manage patients, provide consultations, and access medical tools
              </Text>
            </View>
            {userType === 'doctor' ? (
              <FontAwesome5 name="check-circle" size={20} color="#f093fb" />
            ) : (
              <FontAwesome5 name="chevron-right" size={16} color="#ccc" />
            )}
          </TouchableOpacity>

          {/* Doctor Specialization Dropdown */}
          {showSpecializationDropdown && (
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownLabel}>What's your medical specialization?</Text>
              <CustomDropdown
                items={doctorSpecializations}
                selectedValues={selectedSpecialization}
                onSelectionChange={setSelectedSpecialization}
                placeholder="Select your specialization"
                multiple={true}
                maxHeight={300}
              />
              <Text style={styles.helperText}>
                Select your primary specialization(s) and areas of expertise
              </Text>
            </View>
          )}

          {/* Continue Button */}
          {(showSpecializationDropdown || showPatientTypeDropdown) && (
            <TouchableOpacity
              style={[
                styles.continueButton,
                {
                  backgroundColor: userType === 'doctor' ? '#f093fb' : '#667eea',
                  opacity: (userType === 'doctor' && selectedSpecialization.length > 0) || 
                          (userType === 'patient' && selectedPatientType.length > 0) ? 1 : 0.5
                }
              ]}
              onPress={handleContinueToLogin}
              disabled={
                (userType === 'doctor' && selectedSpecialization.length === 0) ||
                (userType === 'patient' && selectedPatientType.length === 0)
              }
            >
              <Text style={styles.continueButtonText}>Continue to Login</Text>
              <FontAwesome5 name="arrow-right" size={16} color="#fff" style={styles.continueButtonIcon} />
            </TouchableOpacity>
          )}
        </ScrollView>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>

      {/* Admin Access Modal */}
      <AdminAccess
        visible={showAdminAccess}
        onClose={() => setShowAdminAccess(false)}
      />
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
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    top: -width * 0.3,
    left: -width * 0.2,
  },
  backgroundCircle2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(240, 147, 251, 0.08)',
    bottom: -width * 0.2,
    right: -width * 0.15,
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.1,
    paddingBottom: 40,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '300',
    color: '#fff',
    letterSpacing: 4,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  selectionContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContainer: {
    flex: 1,
    paddingTop: 20,
  },
  selectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 32,
  },
  userTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedUserTypeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  userTypeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  patientIcon: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
  },
  doctorIcon: {
    backgroundColor: 'rgba(240, 147, 251, 0.2)',
  },
  userTypeContent: {
    flex: 1,
  },
  userTypeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  userTypeDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  dropdownContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  helperText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  continueButtonIcon: {
    marginLeft: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default AuthScreen;
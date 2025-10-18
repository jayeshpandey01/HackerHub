import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { authService } from '../../services/authService';
import CustomDropdown from '../Common/CustomDropdown';

const { width, height } = Dimensions.get('window');

interface DoctorMedicalProfileProps {
  userData: any;
  onComplete: (profileData: any) => void;
}

const DoctorMedicalProfile: React.FC<DoctorMedicalProfileProps> = ({
  userData, // Used in profileData initialization for userId, userEmail, and userType
  onComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Define types for better TypeScript support
  type DaySchedule = {
    start: string;
    end: string;
    available: boolean;
  };

  type AvailableHours = {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  };

  // Form data
  const [profileData, setProfileData] = useState({
    // Professional Information
    medicalSchool: '',
    graduationYear: '',
    residency: '',
    fellowship: '',
    boardCertifications: [] as string[],
    yearsOfExperience: '',

    // Practice Information
    hospitalAffiliations: '',
    clinicAddress: '',
    consultationFee: '',
    availableHours: {
      monday: { start: '', end: '', available: true },
      tuesday: { start: '', end: '', available: true },
      wednesday: { start: '', end: '', available: true },
      thursday: { start: '', end: '', available: true },
      friday: { start: '', end: '', available: true },
      saturday: { start: '', end: '', available: false },
      sunday: { start: '', end: '', available: false },
    } as AvailableHours,

    // Specializations and Expertise
    primarySpecialization: '',
    secondarySpecializations: [] as string[],
    treatmentAreas: [] as string[],
    languages: [] as string[],

    // Professional Background
    publications: '',
    awards: '',
    professionalMemberships: '',
    continuingEducation: '',

    // Include user data for context
    userId: userData?.id || '',
    userEmail: userData?.email || '',
    userType: userData?.userType || 'doctor',
  });

  // Dropdown items
  const certificationItems = [
    { label: 'Internal Medicine', value: 'internal_medicine' },
    { label: 'Family Medicine', value: 'family_medicine' },
    { label: 'Cardiology', value: 'cardiology' },
    { label: 'Neurology', value: 'neurology' },
    { label: 'Oncology', value: 'oncology' },
    { label: 'Pediatrics', value: 'pediatrics' },
    { label: 'Psychiatry', value: 'psychiatry' },
    { label: 'Surgery', value: 'surgery' },
    { label: 'Orthopedics', value: 'orthopedics' },
    { label: 'Dermatology', value: 'dermatology' },
    { label: 'Radiology', value: 'radiology' },
    { label: 'Anesthesiology', value: 'anesthesiology' },
    { label: 'Emergency Medicine', value: 'emergency_medicine' },
    { label: 'Pathology', value: 'pathology' },
    { label: 'Gynecology', value: 'gynecology' },
  ];

  const treatmentItems = [
    { label: 'Diabetes Management', value: 'diabetes' },
    { label: 'Hypertension Treatment', value: 'hypertension' },
    { label: 'Heart Disease', value: 'heart_disease' },
    { label: 'Cancer Treatment', value: 'cancer' },
    { label: 'Mental Health', value: 'mental_health' },
    { label: 'Pediatric Care', value: 'pediatric' },
    { label: 'Geriatric Care', value: 'geriatric' },
    { label: 'Preventive Medicine', value: 'preventive' },
    { label: 'Pain Management', value: 'pain_management' },
    { label: 'Rehabilitation', value: 'rehabilitation' },
    { label: 'Nutrition Counseling', value: 'nutrition' },
    { label: 'Weight Management', value: 'weight_management' },
    { label: 'Chronic Disease Management', value: 'chronic_disease' },
  ];

  const languageItems = [
    { label: 'English', value: 'english' },
    { label: 'Spanish', value: 'spanish' },
    { label: 'French', value: 'french' },
    { label: 'German', value: 'german' },
    { label: 'Italian', value: 'italian' },
    { label: 'Portuguese', value: 'portuguese' },
    { label: 'Chinese (Mandarin)', value: 'chinese_mandarin' },
    { label: 'Japanese', value: 'japanese' },
    { label: 'Korean', value: 'korean' },
    { label: 'Arabic', value: 'arabic' },
    { label: 'Hindi', value: 'hindi' },
    { label: 'Russian', value: 'russian' },
  ];

  const updateProfileData = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const updateSchedule = (day: keyof AvailableHours, field: keyof DaySchedule, value: any) => {
    setProfileData(prev => ({
      ...prev,
      availableHours: {
        ...prev.availableHours,
        [day]: { ...prev.availableHours[day], [field]: value }
      }
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveProfile = async (data: any) => {
    // Type-safe wrapper for saveMedicalProfile
    const service = authService as any;
    if (service.saveMedicalProfile) {
      return await service.saveMedicalProfile(data);
    }
    throw new Error('Save method not available');
  };

  const handleComplete = async () => {
    // Validate required fields
    if (!profileData.medicalSchool || !profileData.graduationYear) {
      Alert.alert('Error', 'Please fill in your medical education details');
      return;
    }

    setLoading(true);
    try {
      const result = await saveProfile(profileData);
      console.log('Profile saved successfully:', result);
      onComplete(profileData);
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      // Still complete the profile setup even if save fails
      Alert.alert(
        'Profile Setup Complete',
        'Your profile has been set up. Some data may not have been saved to the database.',
        [{ text: 'OK', onPress: () => onComplete(profileData) }]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Medical Education</Text>
      <Text style={styles.stepDescription}>
        Tell us about your medical education and training background
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Medical School</Text>
        <TextInput
          style={styles.input}
          placeholder="Harvard Medical School"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={profileData.medicalSchool}
          onChangeText={(value) => updateProfileData('medicalSchool', value)}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.inputLabel}>Graduation Year</Text>
          <TextInput
            style={styles.input}
            placeholder="2015"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={profileData.graduationYear}
            onChangeText={(value) => updateProfileData('graduationYear', value)}
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.inputLabel}>Years of Experience</Text>
          <TextInput
            style={styles.input}
            placeholder="8"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={profileData.yearsOfExperience}
            onChangeText={(value) => updateProfileData('yearsOfExperience', value)}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Residency</Text>
        <TextInput
          style={styles.input}
          placeholder="Internal Medicine - Johns Hopkins Hospital"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={profileData.residency}
          onChangeText={(value) => updateProfileData('residency', value)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Fellowship (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Cardiology - Mayo Clinic"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={profileData.fellowship}
          onChangeText={(value) => updateProfileData('fellowship', value)}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Specializations & Certifications</Text>
      <Text style={styles.stepDescription}>
        Define your areas of expertise and board certifications
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Primary Specialization</Text>
        <TextInput
          style={styles.input}
          placeholder="Internal Medicine"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={profileData.primarySpecialization}
          onChangeText={(value) => updateProfileData('primarySpecialization', value)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Board Certifications</Text>
        <CustomDropdown
          items={certificationItems}
          selectedValues={profileData.boardCertifications}
          onSelectionChange={(values) => updateProfileData('boardCertifications', values)}
          placeholder="Select certifications..."
          multiple={true}
          maxHeight={200}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Treatment Areas</Text>
        <CustomDropdown
          items={treatmentItems}
          selectedValues={profileData.treatmentAreas}
          onSelectionChange={(values) => updateProfileData('treatmentAreas', values)}
          placeholder="Select treatment areas..."
          multiple={true}
          maxHeight={200}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Languages Spoken</Text>
        <CustomDropdown
          items={languageItems}
          selectedValues={profileData.languages}
          onSelectionChange={(values) => updateProfileData('languages', values)}
          placeholder="Select languages..."
          multiple={true}
          maxHeight={200}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Practice Information</Text>
      <Text style={styles.stepDescription}>
        Set up your practice details and availability
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Hospital Affiliations</Text>
        <TextInput
          style={styles.textArea}
          placeholder="List hospitals and medical centers you're affiliated with..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={profileData.hospitalAffiliations}
          onChangeText={(value) => updateProfileData('hospitalAffiliations', value)}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Clinic Address</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Your primary practice address..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={profileData.clinicAddress}
          onChangeText={(value) => updateProfileData('clinicAddress', value)}
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Consultation Fee (USD)</Text>
        <TextInput
          style={styles.input}
          placeholder="150"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={profileData.consultationFee}
          onChangeText={(value) => updateProfileData('consultationFee', value)}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.scheduleContainer}>
        <Text style={styles.sectionTitle}>Available Hours</Text>
        {(Object.entries(profileData.availableHours) as [keyof AvailableHours, DaySchedule][]).map(([day, schedule]) => (
          <View key={day} style={styles.scheduleRow}>
            <TouchableOpacity
              style={[
                styles.dayToggle,
                schedule.available && styles.dayToggleActive
              ]}
              onPress={() => updateSchedule(day, 'available', !schedule.available)}
            >
              <Text style={[
                styles.dayText,
                schedule.available && styles.dayTextActive
              ]}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
            </TouchableOpacity>

            {schedule.available && (
              <View style={styles.timeInputs}>
                <TextInput
                  style={styles.timeInput}
                  placeholder="09:00"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={schedule.start}
                  onChangeText={(value) => updateSchedule(day, 'start', value)}
                />
                <Text style={styles.timeSeparator}>-</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="17:00"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={schedule.end}
                  onChangeText={(value) => updateSchedule(day, 'end', value)}
                />
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Professional Background</Text>
      <Text style={styles.stepDescription}>
        Share your achievements and professional development
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Publications & Research</Text>
        <TextInput
          style={styles.textArea}
          placeholder="List your publications, research papers, and studies..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={profileData.publications}
          onChangeText={(value) => updateProfileData('publications', value)}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Awards & Recognition</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Professional awards, honors, and recognition..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={profileData.awards}
          onChangeText={(value) => updateProfileData('awards', value)}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Professional Memberships</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Medical associations, societies, and professional organizations..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={profileData.professionalMemberships}
          onChangeText={(value) => updateProfileData('professionalMemberships', value)}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Continuing Education</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Recent courses, conferences, and continuing education..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={profileData.continuingEducation}
          onChangeText={(value) => updateProfileData('continuingEducation', value)}
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.backgroundElements}>
        <View style={styles.backgroundCircle1} />
        <View style={styles.backgroundCircle2} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Doctor Profile Setup</Text>
        <Text style={styles.subtitle}>Step {currentStep} of {totalSteps}</Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${(currentStep / totalSteps) * 100}%` }]} />
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={handlePrevious}>
            <FontAwesome5 name="arrow-left" size={16} color="#f093fb" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextButton, { marginLeft: currentStep === 1 ? 0 : 'auto' }]}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>
              {currentStep === totalSteps ? 'Complete Setup' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    backgroundColor: 'rgba(240, 147, 251, 0.1)',
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
    paddingTop: height * 0.08,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#f093fb',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    paddingVertical: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 24,
    marginBottom: 30,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    marginBottom: 20,
  },
  halfWidth: {
    width: '48%',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 80,
    textAlignVertical: 'top',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  scheduleContainer: {
    marginTop: 20,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 100,
  },
  dayToggleActive: {
    backgroundColor: '#f093fb',
  },
  dayText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  dayTextActive: {
    color: '#fff',
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    flex: 1,
  },
  timeInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: 70,
  },
  timeSeparator: {
    color: '#fff',
    marginHorizontal: 8,
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButtonText: {
    color: '#f093fb',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#f093fb',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginLeft: 12,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DoctorMedicalProfile;
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

interface PatientMedicalProfileProps {
  userData: any;
  onComplete: (profileData: any) => void;
}

const PatientMedicalProfile: React.FC<PatientMedicalProfileProps> = ({
  userData,
  onComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Form data
  const [profileData, setProfileData] = useState({
    weight: '',
    height: '',
    weightUnit: 'kg',
    heightUnit: 'cm',
    diseases: [],
    customDiseases: [], // Array to store custom disease names
    allergies: '',
    medications: '',
    surgeries: '',
    familyHistory: '',
    lifestyle: {
      smoking: 'never',
      alcohol: 'never',
      exercise: 'sedentary',
      diet: 'mixed',
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },
  });

  // State for custom disease input
  const [customDiseaseInput, setCustomDiseaseInput] = useState('');

  // Dropdown items - Comprehensive disease list
  const diseaseItems = [
    // Endocrine Disorders
    { label: 'Diabetes Type 1', value: 'diabetes_type1' },
    { label: 'Diabetes Type 2', value: 'diabetes_type2' },
    { label: 'Gestational Diabetes', value: 'gestational_diabetes' },
    { label: 'Hyperthyroidism', value: 'hyperthyroidism' },
    { label: 'Hypothyroidism', value: 'hypothyroidism' },
    { label: 'Thyroid Cancer', value: 'thyroid_cancer' },
    { label: 'Adrenal Disorders', value: 'adrenal_disorders' },
    { label: 'Metabolic Syndrome', value: 'metabolic_syndrome' },
    
    // Cardiovascular Diseases
    { label: 'Hypertension (High Blood Pressure)', value: 'hypertension' },
    { label: 'Coronary Heart Disease', value: 'coronary_heart_disease' },
    { label: 'Heart Attack (Myocardial Infarction)', value: 'heart_attack' },
    { label: 'Heart Failure', value: 'heart_failure' },
    { label: 'Arrhythmia', value: 'arrhythmia' },
    { label: 'Atrial Fibrillation', value: 'atrial_fibrillation' },
    { label: 'Stroke', value: 'stroke' },
    { label: 'Peripheral Artery Disease', value: 'peripheral_artery_disease' },
    { label: 'Deep Vein Thrombosis', value: 'deep_vein_thrombosis' },
    { label: 'Pulmonary Embolism', value: 'pulmonary_embolism' },
    
    // Respiratory Diseases
    { label: 'Asthma', value: 'asthma' },
    { label: 'COPD (Chronic Obstructive Pulmonary Disease)', value: 'copd' },
    { label: 'Pneumonia', value: 'pneumonia' },
    { label: 'Bronchitis', value: 'bronchitis' },
    { label: 'Lung Cancer', value: 'lung_cancer' },
    { label: 'Sleep Apnea', value: 'sleep_apnea' },
    { label: 'Pulmonary Fibrosis', value: 'pulmonary_fibrosis' },
    
    // Musculoskeletal Disorders
    { label: 'Osteoarthritis', value: 'osteoarthritis' },
    { label: 'Rheumatoid Arthritis', value: 'rheumatoid_arthritis' },
    { label: 'Osteoporosis', value: 'osteoporosis' },
    { label: 'Fibromyalgia', value: 'fibromyalgia' },
    { label: 'Back Pain (Chronic)', value: 'chronic_back_pain' },
    { label: 'Scoliosis', value: 'scoliosis' },
    { label: 'Bone Cancer', value: 'bone_cancer' },
    { label: 'Muscular Dystrophy', value: 'muscular_dystrophy' },
    
    // Neurological Disorders
    { label: 'Epilepsy', value: 'epilepsy' },
    { label: 'Migraine', value: 'migraine' },
    { label: 'Alzheimer\'s Disease', value: 'alzheimers' },
    { label: 'Parkinson\'s Disease', value: 'parkinsons' },
    { label: 'Multiple Sclerosis', value: 'multiple_sclerosis' },
    { label: 'Brain Tumor', value: 'brain_tumor' },
    { label: 'Traumatic Brain Injury', value: 'traumatic_brain_injury' },
    { label: 'Neuropathy', value: 'neuropathy' },
    
    // Mental Health Disorders
    { label: 'Depression', value: 'depression' },
    { label: 'Anxiety Disorder', value: 'anxiety' },
    { label: 'Bipolar Disorder', value: 'bipolar_disorder' },
    { label: 'PTSD (Post-Traumatic Stress Disorder)', value: 'ptsd' },
    { label: 'OCD (Obsessive-Compulsive Disorder)', value: 'ocd' },
    { label: 'ADHD (Attention Deficit Hyperactivity Disorder)', value: 'adhd' },
    { label: 'Schizophrenia', value: 'schizophrenia' },
    { label: 'Eating Disorders', value: 'eating_disorders' },
    
    // Gastrointestinal Disorders
    { label: 'Crohn\'s Disease', value: 'crohns_disease' },
    { label: 'Ulcerative Colitis', value: 'ulcerative_colitis' },
    { label: 'IBS (Irritable Bowel Syndrome)', value: 'ibs' },
    { label: 'GERD (Gastroesophageal Reflux Disease)', value: 'gerd' },
    { label: 'Peptic Ulcer', value: 'peptic_ulcer' },
    { label: 'Celiac Disease', value: 'celiac_disease' },
    { label: 'Liver Disease', value: 'liver_disease' },
    { label: 'Hepatitis B', value: 'hepatitis_b' },
    { label: 'Hepatitis C', value: 'hepatitis_c' },
    { label: 'Colon Cancer', value: 'colon_cancer' },
    
    // Kidney and Urological Disorders
    { label: 'Chronic Kidney Disease', value: 'chronic_kidney_disease' },
    { label: 'Kidney Stones', value: 'kidney_stones' },
    { label: 'Urinary Tract Infections', value: 'uti' },
    { label: 'Prostate Cancer', value: 'prostate_cancer' },
    { label: 'Bladder Cancer', value: 'bladder_cancer' },
    { label: 'Kidney Cancer', value: 'kidney_cancer' },
    
    // Women's Health
    { label: 'Breast Cancer', value: 'breast_cancer' },
    { label: 'Ovarian Cancer', value: 'ovarian_cancer' },
    { label: 'Cervical Cancer', value: 'cervical_cancer' },
    { label: 'Endometriosis', value: 'endometriosis' },
    { label: 'PCOS (Polycystic Ovary Syndrome)', value: 'pcos' },
    
    // Blood Disorders
    { label: 'Anemia', value: 'anemia' },
    { label: 'Leukemia', value: 'leukemia' },
    { label: 'Lymphoma', value: 'lymphoma' },
    { label: 'Hemophilia', value: 'hemophilia' },
    { label: 'Sickle Cell Disease', value: 'sickle_cell_disease' },
    
    // Skin Conditions
    { label: 'Skin Cancer (Melanoma)', value: 'melanoma' },
    { label: 'Skin Cancer (Basal Cell)', value: 'basal_cell_carcinoma' },
    { label: 'Psoriasis', value: 'psoriasis' },
    { label: 'Eczema', value: 'eczema' },
    
    // Autoimmune Disorders
    { label: 'Lupus', value: 'lupus' },
    { label: 'Type 1 Diabetes (Autoimmune)', value: 'type1_diabetes_autoimmune' },
    { label: 'Hashimoto\'s Thyroiditis', value: 'hashimotos' },
    { label: 'Graves\' Disease', value: 'graves_disease' },
    
    // Infectious Diseases
    { label: 'HIV/AIDS', value: 'hiv_aids' },
    { label: 'Tuberculosis', value: 'tuberculosis' },
    { label: 'COVID-19 (Long COVID)', value: 'long_covid' },
    
    // Eye and Ear Disorders
    { label: 'Glaucoma', value: 'glaucoma' },
    { label: 'Cataracts', value: 'cataracts' },
    { label: 'Macular Degeneration', value: 'macular_degeneration' },
    { label: 'Hearing Loss', value: 'hearing_loss' },
    
    // Other option for custom diseases
    { label: 'Other (Please specify)', value: 'other' },
  ];

  const updateProfileData = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedData = (parent: string, field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  const handleDiseaseSelection = (selectedDiseases: string[]) => {
    updateProfileData('diseases', selectedDiseases);
  };

  const addCustomDisease = () => {
    if (customDiseaseInput.trim() && !profileData.customDiseases.includes(customDiseaseInput.trim())) {
      const newCustomDiseases = [...profileData.customDiseases, customDiseaseInput.trim()];
      updateProfileData('customDiseases', newCustomDiseases);
      setCustomDiseaseInput('');
    }
  };

  const removeCustomDisease = (diseaseToRemove: string) => {
    const updatedCustomDiseases = profileData.customDiseases.filter(disease => disease !== diseaseToRemove);
    updateProfileData('customDiseases', updatedCustomDiseases);
  };

  const hasOtherSelected = profileData.diseases.includes('other');

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

  const handleComplete = async () => {
    // Validate required fields
    if (!profileData.weight || !profileData.height) {
      Alert.alert('Error', 'Please fill in your weight and height');
      return;
    }

    // Check if "Other" is selected but no custom diseases are added
    if (hasOtherSelected && profileData.customDiseases.length === 0 && customDiseaseInput.trim()) {
      Alert.alert(
        'Add Custom Disease',
        'You have entered a custom disease but haven\'t added it. Would you like to add it now?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Add', 
            onPress: () => {
              addCustomDisease();
              // Don't proceed with completion yet, let user review
            }
          },
        ]
      );
      return;
    }

    setLoading(true);
    try {
      // Combine standard diseases and custom diseases for saving
      const completeProfileData = {
        ...profileData,
        allDiseases: [
          ...profileData.diseases.filter(d => d !== 'other'), // Remove 'other' from the list
          ...profileData.customDiseases // Add custom diseases
        ]
      };
      
      await authService.saveMedicalProfile(completeProfileData);
      onComplete(completeProfileData);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Basic Health Information</Text>
      <Text style={styles.stepDescription}>
        Let's start with your basic measurements to personalize your health journey
      </Text>

      <View style={styles.measurementRow}>
        <View style={styles.measurementContainer}>
          <Text style={styles.inputLabel}>Weight</Text>
          <View style={styles.measurementInputContainer}>
            <TextInput
              style={styles.measurementInput}
              placeholder="70"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={profileData.weight}
              onChangeText={(value) => updateProfileData('weight', value)}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[
                styles.unitButton,
                profileData.weightUnit === 'kg' && styles.unitButtonActive
              ]}
              onPress={() => updateProfileData('weightUnit', 'kg')}
            >
              <Text style={[
                styles.unitText,
                profileData.weightUnit === 'kg' && styles.unitTextActive
              ]}>kg</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitButton,
                profileData.weightUnit === 'lbs' && styles.unitButtonActive
              ]}
              onPress={() => updateProfileData('weightUnit', 'lbs')}
            >
              <Text style={[
                styles.unitText,
                profileData.weightUnit === 'lbs' && styles.unitTextActive
              ]}>lbs</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.measurementContainer}>
          <Text style={styles.inputLabel}>Height</Text>
          <View style={styles.measurementInputContainer}>
            <TextInput
              style={styles.measurementInput}
              placeholder="170"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={profileData.height}
              onChangeText={(value) => updateProfileData('height', value)}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[
                styles.unitButton,
                profileData.heightUnit === 'cm' && styles.unitButtonActive
              ]}
              onPress={() => updateProfileData('heightUnit', 'cm')}
            >
              <Text style={[
                styles.unitText,
                profileData.heightUnit === 'cm' && styles.unitTextActive
              ]}>cm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitButton,
                profileData.heightUnit === 'ft' && styles.unitButtonActive
              ]}
              onPress={() => updateProfileData('heightUnit', 'ft')}
            >
              <Text style={[
                styles.unitText,
                profileData.heightUnit === 'ft' && styles.unitTextActive
              ]}>ft</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Medical Conditions</Text>
      <Text style={styles.stepDescription}>
        Select any medical conditions you currently have or have had in the past
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Current/Past Diseases</Text>
        <CustomDropdown
          items={diseaseItems}
          selectedValues={profileData.diseases}
          onSelectionChange={handleDiseaseSelection}
          placeholder="Select conditions..."
          multiple={true}
          maxHeight={200}
        />
      </View>

      {/* Custom Disease Input - Show when "Other" is selected */}
      {hasOtherSelected && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Specify Other Diseases</Text>
          <Text style={styles.helperText}>
            Enter any medical conditions not listed above. Add one at a time by typing and pressing the + button.
          </Text>
          <View style={styles.customDiseaseContainer}>
            <TextInput
              style={styles.customDiseaseInput}
              placeholder="Enter disease name..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={customDiseaseInput}
              onChangeText={setCustomDiseaseInput}
              onSubmitEditing={addCustomDisease}
              returnKeyType="done"
            />
            <TouchableOpacity 
              style={styles.addButton}
              onPress={addCustomDisease}
              disabled={!customDiseaseInput.trim()}
            >
              <FontAwesome5 name="plus" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {/* Display added custom diseases */}
          {profileData.customDiseases.length > 0 && (
            <View style={styles.customDiseasesDisplay}>
              <Text style={styles.customDiseasesLabel}>Added Diseases:</Text>
              <View style={styles.customDiseasesList}>
                {profileData.customDiseases.map((disease, index) => (
                  <View key={index} style={styles.customDiseaseTag}>
                    <Text style={styles.customDiseaseTagText}>{disease}</Text>
                    <TouchableOpacity
                      onPress={() => removeCustomDisease(disease)}
                      style={styles.removeCustomDiseaseButton}
                    >
                      <FontAwesome5 name="times" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Allergies</Text>
        <TextInput
          style={styles.textArea}
          placeholder="List any allergies (food, medication, environmental)..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={profileData.allergies}
          onChangeText={(value) => updateProfileData('allergies', value)}
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Medical History</Text>
      <Text style={styles.stepDescription}>
        Help us understand your medical background for better recommendations
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Current Medications</Text>
        <TextInput
          style={styles.textArea}
          placeholder="List current medications, dosages, and frequency..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={profileData.medications}
          onChangeText={(value) => updateProfileData('medications', value)}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Past Surgeries</Text>
        <TextInput
          style={styles.textArea}
          placeholder="List any surgeries or major medical procedures..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={profileData.surgeries}
          onChangeText={(value) => updateProfileData('surgeries', value)}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Family Medical History</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Family history of diseases (parents, siblings, grandparents)..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={profileData.familyHistory}
          onChangeText={(value) => updateProfileData('familyHistory', value)}
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Lifestyle & Emergency Contact</Text>
      <Text style={styles.stepDescription}>
        Final details to complete your health profile
      </Text>

      <View style={styles.lifestyleContainer}>
        <Text style={styles.sectionTitle}>Lifestyle Habits</Text>
        
        <View style={styles.lifestyleItem}>
          <Text style={styles.lifestyleLabel}>Smoking</Text>
          <View style={styles.optionRow}>
            {['never', 'former', 'current'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  profileData.lifestyle.smoking === option && styles.optionButtonActive
                ]}
                onPress={() => updateNestedData('lifestyle', 'smoking', option)}
              >
                <Text style={[
                  styles.optionText,
                  profileData.lifestyle.smoking === option && styles.optionTextActive
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.lifestyleItem}>
          <Text style={styles.lifestyleLabel}>Exercise Level</Text>
          <View style={styles.optionRow}>
            {['sedentary', 'light', 'moderate', 'active'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  profileData.lifestyle.exercise === option && styles.optionButtonActive
                ]}
                onPress={() => updateNestedData('lifestyle', 'exercise', option)}
              >
                <Text style={[
                  styles.optionText,
                  profileData.lifestyle.exercise === option && styles.optionTextActive
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.sectionTitle}>Emergency Contact</Text>
        <TextInput
          style={styles.input}
          placeholder="Contact Name"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={profileData.emergencyContact.name}
          onChangeText={(value) => updateNestedData('emergencyContact', 'name', value)}
        />
        <TextInput
          style={styles.input}
          placeholder="Relationship"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={profileData.emergencyContact.relationship}
          onChangeText={(value) => updateNestedData('emergencyContact', 'relationship', value)}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={profileData.emergencyContact.phone}
          onChangeText={(value) => updateNestedData('emergencyContact', 'phone', value)}
          keyboardType="phone-pad"
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
        <Text style={styles.title}>Medical Profile Setup</Text>
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
            <FontAwesome5 name="arrow-left" size={16} color="#667eea" />
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
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    top: -width * 0.3,
    left: -width * 0.2,
  },
  backgroundCircle2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
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
    backgroundColor: '#667eea',
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
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  measurementContainer: {
    width: '48%',
  },
  measurementInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  measurementInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  unitButtonActive: {
    backgroundColor: '#667eea',
  },
  unitText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  unitTextActive: {
    color: '#fff',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
    lineHeight: 16,
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
    marginBottom: 12,
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
  lifestyleContainer: {
    marginBottom: 20,
  },
  lifestyleItem: {
    marginBottom: 16,
  },
  lifestyleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonActive: {
    backgroundColor: '#667eea',
  },
  optionText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  optionTextActive: {
    color: '#fff',
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
    color: '#667eea',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#667eea',
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
  customDiseaseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customDiseaseInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 12,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customDiseasesDisplay: {
    marginTop: 12,
  },
  customDiseasesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  customDiseasesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  customDiseaseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  customDiseaseTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 6,
  },
  removeCustomDiseaseButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PatientMedicalProfile;
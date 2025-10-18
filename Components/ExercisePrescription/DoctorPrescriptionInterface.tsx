import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Dimensions,
  Switch,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { 
  exercisePrescriptionService, 
  ExercisePrescription, 
  PrescribedExercise,
  ExerciseGoal,
  PatientProfile,
  ExerciseRecommendation
} from '../../services/exercisePrescriptionService';

const { width, height } = Dimensions.get('window');

interface DoctorPrescriptionInterfaceProps {
  doctorId: string;
  doctorName: string;
  onClose: () => void;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  conditions: string[];
  fitnessLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
}

const DoctorPrescriptionInterface: React.FC<DoctorPrescriptionInterfaceProps> = ({
  doctorId,
  doctorName,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('prescriptions');
  const [prescriptions, setPrescriptions] = useState<ExercisePrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [recommendations, setRecommendations] = useState<ExerciseRecommendation[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<any[]>([]);

  // Mock patient data
  const [patients] = useState<Patient[]>([
    {
      id: 'p1',
      name: 'Sarah Johnson',
      age: 45,
      conditions: ['knee_pain', 'hypertension'],
      fitnessLevel: 'sedentary'
    },
    {
      id: 'p2',
      name: 'Michael Chen',
      age: 32,
      conditions: [],
      fitnessLevel: 'moderately_active'
    },
    {
      id: 'p3',
      name: 'Emma Davis',
      age: 28,
      conditions: ['back_pain'],
      fitnessLevel: 'very_active'
    }
  ]); 
 // Load prescriptions and exercise library
  useEffect(() => {
    loadPrescriptions();
    loadExerciseLibrary();
  }, []);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const data = await exercisePrescriptionService.getDoctorPrescriptions(doctorId);
      setPrescriptions(data);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      Alert.alert('Error', 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const loadExerciseLibrary = async () => {
    try {
      const library = await exercisePrescriptionService.getExerciseLibrary();
      setExerciseLibrary(library);
    } catch (error) {
      console.error('Error loading exercise library:', error);
    }
  };

  const handleCreatePrescription = async (patient: Patient) => {
    try {
      setSelectedPatient(patient);
      const recs = await exercisePrescriptionService.generateRecommendations({
        patientId: patient.id,
        age: patient.age,
        conditions: patient.conditions,
        fitnessLevel: patient.fitnessLevel,
        goals: ['general_fitness']
      });
      setRecommendations(recs);
      setShowRecommendationsModal(true);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      Alert.alert('Error', 'Failed to generate exercise recommendations');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Exercise Prescriptions</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <FontAwesome5 name="times" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'prescriptions' && styles.activeTab]}
          onPress={() => setActiveTab('prescriptions')}
        >
          <Text style={[styles.tabText, activeTab === 'prescriptions' && styles.activeTabText]}>
            Prescriptions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'patients' && styles.activeTab]}
          onPress={() => setActiveTab('patients')}
        >
          <Text style={[styles.tabText, activeTab === 'patients' && styles.activeTabText]}>
            Patients
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'prescriptions' ? (
          <View>
            {prescriptions.map((prescription) => (
              <View key={prescription.id} style={styles.prescriptionCard}>
                <Text style={styles.patientName}>{prescription.patientId}</Text>
                <Text style={styles.prescriptionDate}>
                  Created: {new Date(prescription.createdAt).toLocaleDateString()}
                </Text>
                <Text style={styles.exerciseCount}>
                  {prescription.exercises.length} exercises prescribed
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View>
            {patients.map((patient) => (
              <View key={patient.id} style={styles.patientCard}>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{patient.name}</Text>
                  <Text style={styles.patientDetails}>Age: {patient.age}</Text>
                  <Text style={styles.patientDetails}>
                    Fitness Level: {patient.fitnessLevel.replace('_', ' ')}
                  </Text>
                  {patient.conditions.length > 0 && (
                    <Text style={styles.patientDetails}>
                      Conditions: {patient.conditions.join(', ')}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.prescribeButton}
                  onPress={() => handleCreatePrescription(patient)}
                >
                  <Text style={styles.prescribeButtonText}>Prescribe</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Recommendations Modal */}
      <Modal
        visible={showRecommendationsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Exercise Recommendations for {selectedPatient?.name}
            </Text>
            <TouchableOpacity
              onPress={() => setShowRecommendationsModal(false)}
              style={styles.closeButton}
            >
              <FontAwesome5 name="times" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationCard}>
                <Text style={styles.exerciseName}>{rec.exerciseName}</Text>
                <Text style={styles.exerciseDescription}>{rec.description}</Text>
                <Text style={styles.exerciseDetails}>
                  {rec.sets} sets × {rec.reps} reps
                </Text>
                <Text style={styles.confidenceScore}>
                  Confidence: {Math.round(rec.confidenceScore * 100)}%
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  prescriptionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  patientDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  prescriptionDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  exerciseCount: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  prescribeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  prescribeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 5,
  },
  confidenceScore: {
    fontSize: 12,
    color: '#999',
  },
});

export default DoctorPrescriptionInterface;
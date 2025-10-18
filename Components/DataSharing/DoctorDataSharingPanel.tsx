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
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { 
  consentService, 
  ConsentRecord, 
  DataSharingRequest 
} from '../../services/consentService';

const { width, height } = Dimensions.get('window');

interface DoctorDataSharingPanelProps {
  doctorId: string;
  doctorName: string;
  onClose: () => void;
}

interface Patient {
  id: string;
  name: string;
  email: string;
  hasActiveConsent: boolean;
}

const DoctorDataSharingPanel: React.FC<DoctorDataSharingPanelProps> = ({
  doctorId,
  doctorName,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('consents');
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [requestForm, setRequestForm] = useState({
    purpose: '',
    dataTypes: [] as string[],
    accessLevel: 'basic' as 'basic' | 'detailed' | 'full',
    expiryDays: 30,
  });

  // Mock patient data - in real app, this would come from patient service
  const [patients] = useState<Patient[]>([
    { id: 'p1', name: 'Sarah Johnson', email: 'sarah@example.com', hasActiveConsent: true },
    { id: 'p2', name: 'Michael Chen', email: 'michael@example.com', hasActiveConsent: true },
    { id: 'p3', name: 'Emma Davis', email: 'emma@example.com', hasActiveConsent: false },
    { id: 'p4', name: 'John Smith', email: 'john@example.com', hasActiveConsent: false },
  ]);

  const dataTypeOptions = [
    { id: 'exercise_sessions', label: 'Exercise Sessions', description: 'Workout data and performance metrics' },
    { id: 'form_analysis', label: 'Form Analysis', description: 'Exercise form feedback and corrections' },
    { id: 'progress_metrics', label: 'Progress Metrics', description: 'Improvement trends and achievements' },
    { id: 'health_vitals', label: 'Health Vitals', description: 'Heart rate, calories, and other vitals' },
    { id: 'goal_tracking', label: 'Goal Tracking', description: 'Patient goals and milestone progress' },
  ];

  useEffect(() => {
    loadConsents();
  }, [doctorId]);

  const loadConsents = async () => {
    try {
      setLoading(true);
      const consentData = await consentService.getConsentRecordsForDoctor(doctorId);
      setConsents(consentData);
    } catch (error) {
      console.error('Error loading consents:', error);
      Alert.alert('Error', 'Failed to load consent information');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDataSharing = async () => {
    if (!selectedPatient || !requestForm.purpose.trim() || requestForm.dataTypes.length === 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + requestForm.expiryDays);

      await consentService.requestDataSharing({
        fromDoctorId: doctorId,
        fromDoctorName: doctorName,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        requestedDataTypes: requestForm.dataTypes,
        purpose: requestForm.purpose,
        accessLevel: requestForm.accessLevel,
        expiryDate: expiryDate.toISOString(),
      });

      Alert.alert('Success', 'Data sharing request sent to patient');
      setShowRequestModal(false);
      resetRequestForm();
      await loadConsents();
    } catch (error) {
      Alert.alert('Error', 'Failed to send data sharing request');
    }
  };

  const resetRequestForm = () => {
    setRequestForm({
      purpose: '',
      dataTypes: [],
      accessLevel: 'basic',
      expiryDays: 30,
    });
    setSelectedPatient(null);
  };

  const toggleDataType = (dataType: string) => {
    setRequestForm(prev => ({
      ...prev,
      dataTypes: prev.dataTypes.includes(dataType)
        ? prev.dataTypes.filter(dt => dt !== dataType)
        : [...prev.dataTypes, dataType]
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getConsentStatusColor = (status: string) => {
    switch (status) {
      case 'granted': return '#4CAF50';
      case 'revoked': return '#F44336';
      case 'pending': return '#FF9800';
      default: return '#666';
    }
  };

  const checkDataAccess = async (patientId: string, dataType: string) => {
    try {
      const hasAccess = await consentService.hasDataAccess(doctorId, patientId, dataType);
      return hasAccess;
    } catch (error) {
      return false;
    }
  };

  const logDataAccess = async (patientId: string, dataType: string, details: string) => {
    try {
      await consentService.logDataAccess(doctorId, patientId, dataType, details);
    } catch (error) {
      console.error('Failed to log data access:', error);
    }
  };

  const renderConsentsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Patient Consents</Text>
        <TouchableOpacity
          style={styles.requestButton}
          onPress={() => setShowRequestModal(true)}
        >
          <FontAwesome5 name="plus" size={16} color="#fff" />
          <Text style={styles.requestButtonText}>Request Access</Text>
        </TouchableOpacity>
      </View>

      {consents.filter(c => c.status === 'granted').length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome5 name="user-shield" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No active consents</Text>
          <Text style={styles.emptyStateSubtext}>
            Request data sharing access from your patients
          </Text>
        </View>
      ) : (
        consents.filter(c => c.status === 'granted').map((consent) => (
          <View key={consent.id} style={styles.consentCard}>
            <View style={styles.consentHeader}>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{consent.patientName}</Text>
                <Text style={styles.consentType}>{consent.consentType.replace('_', ' ')}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getConsentStatusColor(consent.status) }]}>
                <Text style={styles.statusText}>{consent.status}</Text>
              </View>
            </View>

            <Text style={styles.consentPurpose}>{consent.purpose}</Text>

            <View style={styles.consentDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Data Access:</Text>
                <Text style={styles.detailValue}>{consent.dataTypes.join(', ')}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Access Level:</Text>
                <Text style={styles.detailValue}>{consent.accessLevel}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Granted:</Text>
                <Text style={styles.detailValue}>{formatDate(consent.grantedDate!)}</Text>
              </View>
              {consent.expiryDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Expires:</Text>
                  <Text style={styles.detailValue}>{formatDate(consent.expiryDate)}</Text>
                </View>
              )}
            </View>

            <View style={styles.consentActions}>
              <TouchableOpacity
                style={styles.accessButton}
                onPress={() => {
                  logDataAccess(consent.patientId, 'exercise_data', 'Accessed patient exercise dashboard');
                  Alert.alert('Data Access', 'Exercise data accessed and logged');
                }}
              >
                <FontAwesome5 name="eye" size={14} color="#f093fb" />
                <Text style={styles.accessButtonText}>View Data</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => {
                  Alert.alert('Share Data', 'Data sharing functionality would be implemented here');
                }}
              >
                <FontAwesome5 name="share" size={14} color="#4CAF50" />
                <Text style={styles.shareButtonText}>Share Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Revoked/Expired Consents</Text>
      {consents.filter(c => c.status !== 'granted').map((consent) => (
        <View key={consent.id} style={[styles.consentCard, styles.inactiveCard]}>
          <View style={styles.consentHeader}>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{consent.patientName}</Text>
              <Text style={styles.consentType}>{consent.consentType.replace('_', ' ')}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getConsentStatusColor(consent.status) }]}>
              <Text style={styles.statusText}>{consent.status}</Text>
            </View>
          </View>
          {consent.revokedDate && (
            <Text style={styles.revokedDate}>
              Revoked: {formatDate(consent.revokedDate)}
            </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );

  const renderPatientsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Patient Directory</Text>
      {patients.map((patient) => (
        <View key={patient.id} style={styles.patientCard}>
          <View style={styles.patientHeader}>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientEmail}>{patient.email}</Text>
            </View>
            <View style={styles.patientStatus}>
              {patient.hasActiveConsent ? (
                <View style={styles.activeConsentBadge}>
                  <FontAwesome5 name="check-circle" size={16} color="#4CAF50" />
                  <Text style={styles.activeConsentText}>Active Consent</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.requestAccessButton}
                  onPress={() => {
                    setSelectedPatient(patient);
                    setShowRequestModal(true);
                  }}
                >
                  <FontAwesome5 name="plus-circle" size={16} color="#f093fb" />
                  <Text style={styles.requestAccessText}>Request Access</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <FontAwesome5 name="spinner" size={32} color="#f093fb" />
        <Text style={styles.loadingText}>Loading data sharing information...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <FontAwesome5 name="times" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data Sharing Panel</Text>
        <Text style={styles.headerSubtitle}>Manage patient data access</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'consents' && styles.activeTab]}
          onPress={() => setActiveTab('consents')}
        >
          <FontAwesome5 
            name="shield-alt" 
            size={16} 
            color={activeTab === 'consents' ? '#f093fb' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'consents' && styles.activeTabText]}>
            Active Consents
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'patients' && styles.activeTab]}
          onPress={() => setActiveTab('patients')}
        >
          <FontAwesome5 
            name="users" 
            size={16} 
            color={activeTab === 'patients' ? '#f093fb' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'patients' && styles.activeTabText]}>
            Patient Directory
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'consents' && renderConsentsTab()}
      {activeTab === 'patients' && renderPatientsTab()}

      {/* Request Modal */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Request Data Sharing</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowRequestModal(false);
                resetRequestForm();
              }}
            >
              <FontAwesome5 name="times" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Patient Selection */}
            {!selectedPatient && (
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Select Patient</Text>
                {patients.filter(p => !p.hasActiveConsent).map((patient) => (
                  <TouchableOpacity
                    key={patient.id}
                    style={styles.patientSelectCard}
                    onPress={() => setSelectedPatient(patient)}
                  >
                    <Text style={styles.patientSelectName}>{patient.name}</Text>
                    <Text style={styles.patientSelectEmail}>{patient.email}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {selectedPatient && (
              <>
                <View style={styles.selectedPatientCard}>
                  <Text style={styles.selectedPatientName}>{selectedPatient.name}</Text>
                  <TouchableOpacity
                    style={styles.changePatientButton}
                    onPress={() => setSelectedPatient(null)}
                  >
                    <Text style={styles.changePatientText}>Change Patient</Text>
                  </TouchableOpacity>
                </View>

                {/* Purpose */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Purpose of Data Access</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Explain why you need access to this patient's data..."
                    value={requestForm.purpose}
                    onChangeText={(text) => setRequestForm(prev => ({ ...prev, purpose: text }))}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                {/* Data Types */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Requested Data Types</Text>
                  {dataTypeOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.dataTypeOption,
                        requestForm.dataTypes.includes(option.id) && styles.dataTypeOptionSelected
                      ]}
                      onPress={() => toggleDataType(option.id)}
                    >
                      <View style={styles.dataTypeInfo}>
                        <Text style={[
                          styles.dataTypeLabel,
                          requestForm.dataTypes.includes(option.id) && styles.dataTypeLabelSelected
                        ]}>
                          {option.label}
                        </Text>
                        <Text style={styles.dataTypeDescription}>{option.description}</Text>
                      </View>
                      <FontAwesome5 
                        name={requestForm.dataTypes.includes(option.id) ? 'check-circle' : 'circle'} 
                        size={20} 
                        color={requestForm.dataTypes.includes(option.id) ? '#4CAF50' : '#ccc'} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Access Level */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Access Level</Text>
                  {[
                    { value: 'basic', label: 'Basic', description: 'Summary data only' },
                    { value: 'detailed', label: 'Detailed', description: 'Detailed metrics and analysis' },
                    { value: 'full', label: 'Full', description: 'Complete data access' }
                  ].map((level) => (
                    <TouchableOpacity
                      key={level.value}
                      style={[
                        styles.accessLevelOption,
                        requestForm.accessLevel === level.value && styles.accessLevelOptionSelected
                      ]}
                      onPress={() => setRequestForm(prev => ({ ...prev, accessLevel: level.value as any }))}
                    >
                      <View style={styles.accessLevelInfo}>
                        <Text style={[
                          styles.accessLevelLabel,
                          requestForm.accessLevel === level.value && styles.accessLevelLabelSelected
                        ]}>
                          {level.label}
                        </Text>
                        <Text style={styles.accessLevelDescription}>{level.description}</Text>
                      </View>
                      <FontAwesome5 
                        name={requestForm.accessLevel === level.value ? 'dot-circle' : 'circle'} 
                        size={20} 
                        color={requestForm.accessLevel === level.value ? '#f093fb' : '#ccc'} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Expiry */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Access Duration (Days)</Text>
                  <View style={styles.expiryOptions}>
                    {[7, 30, 90, 365].map((days) => (
                      <TouchableOpacity
                        key={days}
                        style={[
                          styles.expiryOption,
                          requestForm.expiryDays === days && styles.expiryOptionSelected
                        ]}
                        onPress={() => setRequestForm(prev => ({ ...prev, expiryDays: days }))}
                      >
                        <Text style={[
                          styles.expiryOptionText,
                          requestForm.expiryDays === days && styles.expiryOptionTextSelected
                        ]}>
                          {days} days
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleRequestDataSharing}
                >
                  <FontAwesome5 name="paper-plane" size={16} color="#fff" />
                  <Text style={styles.submitButtonText}>Send Request</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#f093fb',
    paddingTop: height * 0.08,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: height * 0.08,
    right: 20,
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: 'rgba(240, 147, 251, 0.1)',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#f093fb',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f093fb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  consentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inactiveCard: {
    opacity: 0.6,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  consentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  consentType: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  consentPurpose: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  consentDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    minWidth: 80,
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  consentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(240, 147, 251, 0.1)',
    marginRight: 6,
  },
  accessButtonText: {
    color: '#f093fb',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    marginLeft: 6,
  },
  shareButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  revokedDate: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientEmail: {
    fontSize: 14,
    color: '#666',
  },
  patientStatus: {
    alignItems: 'flex-end',
  },
  activeConsentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeConsentText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  requestAccessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 147, 251, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  requestAccessText: {
    color: '#f093fb',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  patientSelectCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  patientSelectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  patientSelectEmail: {
    fontSize: 14,
    color: '#666',
  },
  selectedPatientCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#f093fb',
  },
  selectedPatientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  changePatientButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(240, 147, 251, 0.1)',
  },
  changePatientText: {
    color: '#f093fb',
    fontSize: 14,
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dataTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dataTypeOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  dataTypeInfo: {
    flex: 1,
  },
  dataTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  dataTypeLabelSelected: {
    color: '#4CAF50',
  },
  dataTypeDescription: {
    fontSize: 14,
    color: '#666',
  },
  accessLevelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  accessLevelOptionSelected: {
    borderColor: '#f093fb',
    backgroundColor: 'rgba(240, 147, 251, 0.05)',
  },
  accessLevelInfo: {
    flex: 1,
  },
  accessLevelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  accessLevelLabelSelected: {
    color: '#f093fb',
  },
  accessLevelDescription: {
    fontSize: 14,
    color: '#666',
  },
  expiryOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expiryOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  expiryOptionSelected: {
    borderColor: '#f093fb',
    backgroundColor: 'rgba(240, 147, 251, 0.1)',
  },
  expiryOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  expiryOptionTextSelected: {
    color: '#f093fb',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f093fb',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default DoctorDataSharingPanel;
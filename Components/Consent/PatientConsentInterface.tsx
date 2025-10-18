import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Switch,
  Dimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { 
  consentService, 
  ConsentRecord, 
  DataAccessRequest, 
  ConsentAuditEntry 
} from '../../services/consentService';

const { width, height } = Dimensions.get('window');

interface PatientConsentInterfaceProps {
  patientId: string;
  onConsentUpdate?: (consents: ConsentRecord[]) => void;
}

const PatientConsentInterface: React.FC<PatientConsentInterfaceProps> = ({
  patientId,
  onConsentUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'consents' | 'requests' | 'audit'>('consents');
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [pendingRequests, setPendingRequests] = useState<DataAccessRequest[]>([]);
  const [auditTrail, setAuditTrail] = useState<ConsentAuditEntry[]>([]);
  const [selectedConsent, setSelectedConsent] = useState<ConsentRecord | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<DataAccessRequest | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [consentData, requestData, auditData] = await Promise.all([
        consentService.getPatientConsents(patientId),
        consentService.getPendingRequests(patientId),
        consentService.getAuditTrail(patientId)
      ]);

      setConsents(consentData);
      setPendingRequests(requestData);
      setAuditTrail(auditData);
      
      if (onConsentUpdate) {
        onConsentUpdate(consentData);
      }
    } catch (error) {
      console.error('Failed to load consent data:', error);
      Alert.alert('Error', 'Failed to load consent information');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeConsent = async (consentId: string, reason?: string) => {
    try {
      await consentService.revokeConsent(consentId, patientId, reason);
      await loadData();
      setShowConsentModal(false);
      Alert.alert('Success', 'Consent has been revoked successfully');
    } catch (error) {
      console.error('Failed to revoke consent:', error);
      Alert.alert('Error', 'Failed to revoke consent');
    }
  };

  const handleApproveRequest = async (requestId: string, expirationDays?: number) => {
    try {
      await consentService.grantConsent(requestId, patientId, expirationDays);
      await loadData();
      setShowRequestModal(false);
      Alert.alert('Success', 'Access has been granted successfully');
    } catch (error) {
      console.error('Failed to grant consent:', error);
      Alert.alert('Error', 'Failed to grant access');
    }
  };

  const handleDenyRequest = async (requestId: string, reason?: string) => {
    try {
      await consentService.denyRequest(requestId, patientId, reason);
      await loadData();
      setShowRequestModal(false);
      Alert.alert('Success', 'Access request has been denied');
    } catch (error) {
      console.error('Failed to deny request:', error);
      Alert.alert('Error', 'Failed to deny access request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'expired': return '#FF9800';
      case 'revoked': return '#F44336';
      case 'pending': return '#2196F3';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return 'check-circle';
      case 'expired': return 'clock';
      case 'revoked': return 'times-circle';
      case 'pending': return 'hourglass-half';
      default: return 'question-circle';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderConsentsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Data Sharing Consents</Text>
        <Text style={styles.sectionSubtitle}>
          Manage who can access your exercise and health data
        </Text>
      </View>

      {consents.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome5 name="shield-alt" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No active consents</Text>
          <Text style={styles.emptyStateSubtext}>
            You haven't granted access to any healthcare providers yet
          </Text>
        </View>
      ) : (
        <View style={styles.consentsList}>
          {consents.map((consent) => (
            <TouchableOpacity
              key={consent.id}
              style={styles.consentCard}
              onPress={() => {
                setSelectedConsent(consent);
                setShowConsentModal(true);
              }}
            >
              <View style={styles.consentHeader}>
                <View style={styles.consentInfo}>
                  <Text style={styles.consentProvider}>Dr. Provider Name</Text>
                  <Text style={styles.consentPurpose}>{consent.purpose}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(consent.status) }]}>
                  <FontAwesome5 
                    name={getStatusIcon(consent.status)} 
                    size={12} 
                    color="#fff" 
                  />
                  <Text style={styles.statusText}>{consent.status}</Text>
                </View>
              </View>

              <View style={styles.consentDetails}>
                <Text style={styles.consentDate}>
                  Granted: {formatDate(consent.grantedAt)}
                </Text>
                {consent.expiresAt && (
                  <Text style={styles.consentExpiry}>
                    Expires: {formatDate(consent.expiresAt)}
                  </Text>
                )}
              </View>

              <View style={styles.dataTypes}>
                {consent.dataTypes.slice(0, 3).map((dataType, index) => (
                  <View key={index} style={styles.dataTypeTag}>
                    <Text style={styles.dataTypeText}>{dataType.category}</Text>
                  </View>
                ))}
                {consent.dataTypes.length > 3 && (
                  <View style={styles.dataTypeTag}>
                    <Text style={styles.dataTypeText}>+{consent.dataTypes.length - 3}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderRequestsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Pending Access Requests</Text>
        <Text style={styles.sectionSubtitle}>
          Healthcare providers requesting access to your data
        </Text>
      </View>

      {pendingRequests.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome5 name="inbox" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No pending requests</Text>
          <Text style={styles.emptyStateSubtext}>
            You don't have any pending access requests
          </Text>
        </View>
      ) : (
        <View style={styles.requestsList}>
          {pendingRequests.map((request) => (
            <TouchableOpacity
              key={request.id}
              style={styles.requestCard}
              onPress={() => {
                setSelectedRequest(request);
                setShowRequestModal(true);
              }}
            >
              <View style={styles.requestHeader}>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestProvider}>Dr. Provider Name</Text>
                  <Text style={styles.requestPurpose}>{request.purpose}</Text>
                </View>
                <View style={styles.requestDate}>
                  <Text style={styles.requestDateText}>
                    {formatDate(request.requestedAt)}
                  </Text>
                </View>
              </View>

              <View style={styles.requestedData}>
                <Text style={styles.requestedDataTitle}>Requested Data:</Text>
                {request.requestedDataTypes.map((dataType, index) => (
                  <View key={index} style={styles.requestedDataItem}>
                    <FontAwesome5 name="circle" size={4} color="#666" />
                    <Text style={styles.requestedDataText}>{dataType.description}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={[styles.requestActionButton, styles.approveButton]}
                  onPress={() => handleApproveRequest(request.id, 180)} // 6 months
                >
                  <FontAwesome5 name="check" size={14} color="#fff" />
                  <Text style={styles.requestActionText}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.requestActionButton, styles.denyButton]}
                  onPress={() => handleDenyRequest(request.id, 'Patient declined')}
                >
                  <FontAwesome5 name="times" size={14} color="#fff" />
                  <Text style={styles.requestActionText}>Deny</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderAuditTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Access History</Text>
        <Text style={styles.sectionSubtitle}>
          Complete log of data access and consent changes
        </Text>
      </View>

      {auditTrail.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome5 name="history" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No activity yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Your data access history will appear here
          </Text>
        </View>
      ) : (
        <View style={styles.auditList}>
          {auditTrail.map((entry) => (
            <View key={entry.id} style={styles.auditItem}>
              <View style={styles.auditIcon}>
                <FontAwesome5 
                  name={entry.action === 'granted' ? 'plus' : 
                        entry.action === 'accessed' ? 'eye' : 
                        entry.action === 'revoked' ? 'minus' : 'edit'} 
                  size={14} 
                  color="#666" 
                />
              </View>
              <View style={styles.auditContent}>
                <Text style={styles.auditAction}>{entry.details}</Text>
                <Text style={styles.auditDate}>{formatDate(entry.timestamp)}</Text>
              </View>
              <View style={styles.auditUser}>
                <Text style={styles.auditUserType}>{entry.userType}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Data Privacy & Consent</Text>
        <Text style={styles.subtitle}>Control who can access your health data</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'consents' && styles.activeTab]}
          onPress={() => setActiveTab('consents')}
        >
          <FontAwesome5 
            name="shield-alt" 
            size={16} 
            color={activeTab === 'consents' ? '#667eea' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'consents' && styles.activeTabText]}>
            Consents
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <FontAwesome5 
            name="inbox" 
            size={16} 
            color={activeTab === 'requests' ? '#667eea' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests ({pendingRequests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'audit' && styles.activeTab]}
          onPress={() => setActiveTab('audit')}
        >
          <FontAwesome5 
            name="history" 
            size={16} 
            color={activeTab === 'audit' ? '#667eea' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'audit' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'consents' && renderConsentsTab()}
      {activeTab === 'requests' && renderRequestsTab()}
      {activeTab === 'audit' && renderAuditTab()}

      {/* Consent Detail Modal */}
      <Modal
        visible={showConsentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowConsentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Consent Details</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowConsentModal(false)}
            >
              <FontAwesome5 name="times" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {selectedConsent && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.consentDetailCard}>
                <View style={styles.consentDetailHeader}>
                  <Text style={styles.consentDetailProvider}>Dr. Provider Name</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedConsent.status) }]}>
                    <FontAwesome5 
                      name={getStatusIcon(selectedConsent.status)} 
                      size={12} 
                      color="#fff" 
                    />
                    <Text style={styles.statusText}>{selectedConsent.status}</Text>
                  </View>
                </View>

                <View style={styles.consentDetailSection}>
                  <Text style={styles.sectionLabel}>Purpose</Text>
                  <Text style={styles.sectionValue}>{selectedConsent.purpose}</Text>
                </View>

                <View style={styles.consentDetailSection}>
                  <Text style={styles.sectionLabel}>Access Level</Text>
                  <Text style={styles.sectionValue}>{selectedConsent.accessLevel}</Text>
                </View>

                <View style={styles.consentDetailSection}>
                  <Text style={styles.sectionLabel}>Data Types</Text>
                  {selectedConsent.dataTypes.map((dataType, index) => (
                    <View key={index} style={styles.dataTypeDetail}>
                      <Text style={styles.dataTypeCategory}>{dataType.category}</Text>
                      <Text style={styles.dataTypeDescription}>{dataType.description}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.consentDetailSection}>
                  <Text style={styles.sectionLabel}>Timeline</Text>
                  <Text style={styles.sectionValue}>
                    Granted: {formatDate(selectedConsent.grantedAt)}
                  </Text>
                  {selectedConsent.expiresAt && (
                    <Text style={styles.sectionValue}>
                      Expires: {formatDate(selectedConsent.expiresAt)}
                    </Text>
                  )}
                  {selectedConsent.revokedAt && (
                    <Text style={styles.sectionValue}>
                      Revoked: {formatDate(selectedConsent.revokedAt)}
                    </Text>
                  )}
                </View>

                {selectedConsent.status === 'active' && (
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.revokeButton]}
                      onPress={() => {
                        Alert.alert(
                          'Revoke Consent',
                          'Are you sure you want to revoke this consent? The provider will no longer be able to access your data.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Revoke', 
                              style: 'destructive',
                              onPress: () => handleRevokeConsent(selectedConsent.id, 'Revoked by patient')
                            }
                          ]
                        );
                      }}
                    >
                      <FontAwesome5 name="ban" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>Revoke Consent</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
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
  header: {
    backgroundColor: '#667eea',
    paddingTop: height * 0.08,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tabNavigation: {
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
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#667eea',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  consentsList: {
    gap: 16,
  },
  consentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  consentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  consentInfo: {
    flex: 1,
  },
  consentProvider: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  consentPurpose: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  consentDetails: {
    marginBottom: 16,
  },
  consentDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  consentExpiry: {
    fontSize: 12,
    color: '#FF9800',
  },
  dataTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dataTypeTag: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  dataTypeText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
  },
  requestsList: {
    gap: 16,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  requestInfo: {
    flex: 1,
  },
  requestProvider: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  requestPurpose: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  requestDate: {
    alignItems: 'flex-end',
  },
  requestDateText: {
    fontSize: 12,
    color: '#666',
  },
  requestedData: {
    marginBottom: 20,
  },
  requestedDataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  requestedDataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requestedDataText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  requestActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  denyButton: {
    backgroundColor: '#F44336',
  },
  requestActionText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  auditList: {
    gap: 12,
  },
  auditItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  auditIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  auditContent: {
    flex: 1,
  },
  auditAction: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  auditDate: {
    fontSize: 12,
    color: '#666',
  },
  auditUser: {
    alignItems: 'flex-end',
  },
  auditUserType: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
    textTransform: 'capitalize',
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
  consentDetailCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  consentDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  consentDetailProvider: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  consentDetailSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionValue: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 4,
  },
  dataTypeDetail: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  dataTypeCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  dataTypeDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  modalActions: {
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  revokeButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default PatientConsentInterface;
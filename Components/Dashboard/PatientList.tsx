import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface PatientListProps {
  patients: any[];
  onBack: () => void;
  onPatientSelect: (patient: any) => void;
}

const PatientList: React.FC<PatientListProps> = ({
  patients,
  onBack,
  onPatientSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.condition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || patient.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return '#2ecc71';
      case 'improving': return '#3498db';
      case 'needs_attention': return '#f39c12';
      case 'critical': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const statusFilters = [
    { key: 'all', label: 'All', count: patients.length },
    { key: 'stable', label: 'Stable', count: patients.filter(p => p.status === 'stable').length },
    { key: 'needs_attention', label: 'Needs Attention', count: patients.filter(p => p.status === 'needs_attention').length },
    { key: 'improving', label: 'Improving', count: patients.filter(p => p.status === 'improving').length },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <FontAwesome5 name="arrow-left" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Patients</Text>
        <TouchableOpacity style={styles.addButton}>
          <FontAwesome5 name="plus" size={20} color="#f093fb" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <FontAwesome5 name="search" size={16} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        {/* Status Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          {statusFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                filterStatus === filter.key && styles.filterButtonActive
              ]}
              onPress={() => setFilterStatus(filter.key)}
            >
              <Text style={[
                styles.filterText,
                filterStatus === filter.key && styles.filterTextActive
              ]}>
                {filter.label} ({filter.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Patient List */}
        <ScrollView style={styles.patientList} showsVerticalScrollIndicator={false}>
          {filteredPatients.map((patient) => (
            <TouchableOpacity
              key={patient.id}
              style={styles.patientCard}
              onPress={() => onPatientSelect(patient)}
            >
              <View style={styles.patientAvatar}>
                <Text style={styles.avatarEmoji}>{patient.avatar}</Text>
              </View>
              
              <View style={styles.patientInfo}>
                <View style={styles.patientHeader}>
                  <Text style={styles.patientName}>{patient.name}</Text>
                  <View style={styles.patientMeta}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(patient.status) }]} />
                    <Text style={styles.healthScore}>{patient.healthScore}%</Text>
                  </View>
                </View>
                
                <Text style={styles.patientAge}>Age: {patient.age}</Text>
                <Text style={styles.patientCondition}>{patient.condition}</Text>
                <Text style={styles.patientLastVisit}>Last visit: {patient.lastVisit}</Text>
                
                <View style={styles.patientActions}>
                  <View style={styles.actionButton}>
                    <FontAwesome5 name="video" size={12} color="#3498db" />
                    <Text style={styles.actionText}>Video Call</Text>
                  </View>
                  <View style={styles.actionButton}>
                    <FontAwesome5 name="chart-line" size={12} color="#f093fb" />
                    <Text style={styles.actionText}>Analytics</Text>
                  </View>
                  <View style={styles.actionButton}>
                    <FontAwesome5 name="prescription-bottle-alt" size={12} color="#2ecc71" />
                    <Text style={styles.actionText}>Prescribe</Text>
                  </View>
                </View>
              </View>
              
              <FontAwesome5 name="chevron-right" size={16} color="#ccc" />
            </TouchableOpacity>
          ))}
          
          {filteredPatients.length === 0 && (
            <View style={styles.emptyState}>
              <FontAwesome5 name="user-friends" size={48} color="#ccc" />
              <Text style={styles.emptyTitle}>No patients found</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Try adjusting your search terms' : 'No patients match the selected filter'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filterButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  filterButtonActive: {
    backgroundColor: '#f093fb',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  patientList: {
    flex: 1,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  patientInfo: {
    flex: 1,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  patientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  healthScore: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  patientAge: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  patientCondition: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  patientLastVisit: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  patientActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  actionText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PatientList;
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput,
    Alert,
    Dimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import {
    exercisePrescriptionService,
    ExercisePrescription,
    PrescriptionTemplate,
    ExerciseRecommendation,
    DifficultyAdjustment
} from '../../services/exercisePrescriptionService';

const { height } = Dimensions.get('window');

interface ProviderPrescriptionInterfaceProps {
    providerId: string;
    selectedPatientId?: string;
    onPrescriptionUpdate?: (prescriptions: ExercisePrescription[]) => void;
}

const ProviderPrescriptionInterface: React.FC<ProviderPrescriptionInterfaceProps> = ({
    providerId,
    selectedPatientId,
    onPrescriptionUpdate,
}) => {
    const [activeTab, setActiveTab] = useState<'prescriptions' | 'templates' | 'recommendations'>('prescriptions');
    const [prescriptions, setPrescriptions] = useState<ExercisePrescription[]>([]);
    const [templates, setTemplates] = useState<PrescriptionTemplate[]>([]);
    const [selectedPrescription, setSelectedPrescription] = useState<ExercisePrescription | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<PrescriptionTemplate | null>(null);
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [recommendations, setRecommendations] = useState<{
        progressions: string[];
        modifications: string[];
        concerns: string[];
        nextSteps: string[];
        exerciseRecommendations: ExerciseRecommendation[];
        difficultyAdjustments: DifficultyAdjustment[];
    } | null>(null);

    // Create prescription form state
    const [newPrescription, setNewPrescription] = useState({
        title: '',
        description: '',
        patientId: selectedPatientId || '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        notes: ''
    });

    useEffect(() => {
        loadData();
    }, [providerId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [prescriptionData, templateData] = await Promise.all([
                exercisePrescriptionService.getProviderPrescriptions(providerId),
                exercisePrescriptionService.getTemplates()
            ]);

            setPrescriptions(prescriptionData);
            setTemplates(templateData);

            if (onPrescriptionUpdate) {
                onPrescriptionUpdate(prescriptionData);
            }
        } catch (error) {
            console.error('Failed to load prescription data:', error);
            Alert.alert('Error', 'Failed to load prescription information');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFromTemplate = async (templateId: string) => {
        if (!newPrescription.patientId) {
            Alert.alert('Error', 'Please select a patient first');
            return;
        }

        try {
            const prescription = await exercisePrescriptionService.createFromTemplate(
                providerId,
                newPrescription.patientId,
                templateId,
                {
                    title: newPrescription.title || undefined,
                    description: newPrescription.description || undefined,
                    startDate: newPrescription.startDate,
                    endDate: newPrescription.endDate || undefined
                }
            );

            await loadData();
            setShowCreateModal(false);
            setSelectedPrescription(prescription);
            setShowPrescriptionModal(true);

            Alert.alert('Success', 'Exercise prescription created successfully');
        } catch (error) {
            console.error('Failed to create prescription:', error);
            Alert.alert('Error', 'Failed to create prescription');
        }
    };

    const handleActivatePrescription = async (prescriptionId: string) => {
        try {
            await exercisePrescriptionService.activatePrescription(prescriptionId, providerId);
            await loadData();
            Alert.alert('Success', 'Prescription activated successfully');
        } catch (error) {
            console.error('Failed to activate prescription:', error);
            Alert.alert('Error', 'Failed to activate prescription');
        }
    };

    const handleAdjustPrescription = async (
        prescriptionId: string,
        exerciseId: string,
        adjustmentType: string,
        parameters: any
    ) => {
        try {
            await exercisePrescriptionService.adjustPrescription(
                prescriptionId,
                providerId,
                [{
                    exerciseId,
                    adjustmentType: adjustmentType as any,
                    parameters,
                    reason: 'Provider adjustment based on patient progress'
                }]
            );

            await loadData();
            Alert.alert('Success', 'Prescription adjusted successfully');
        } catch (error) {
            console.error('Failed to adjust prescription:', error);
            Alert.alert('Error', 'Failed to adjust prescription');
        }
    };

    const handleGenerateRecommendations = async (patientId: string, prescriptionId: string) => {
        try {
            setLoading(true);
            const recs = await exercisePrescriptionService.generateRecommendations(patientId, prescriptionId);
            setRecommendations(recs);
            setShowRecommendationsModal(true);
        } catch (error) {
            console.error('Failed to generate recommendations:', error);
            Alert.alert('Error', 'Failed to generate recommendations');
        } finally {
            setLoading(false);
        }
    };

    const handleAutoAdjustDifficulty = async (prescriptionId: string, patientId: string) => {
        try {
            setLoading(true);
            const result = await exercisePrescriptionService.autoAdjustDifficulty(prescriptionId, patientId);

            if (result.adjustmentsMade) {
                await loadData();
                Alert.alert(
                    'Auto-Adjustment Complete',
                    `Made ${result.adjustments.length} difficulty adjustments based on patient progress.`
                );
            } else {
                Alert.alert('No Adjustments Needed', 'Patient progress does not indicate need for difficulty changes at this time.');
            }
        } catch (error) {
            console.error('Failed to auto-adjust difficulty:', error);
            Alert.alert('Error', 'Failed to auto-adjust difficulty');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return '#4CAF50';
            case 'draft': return '#FF9800';
            case 'completed': return '#2196F3';
            case 'paused': return '#9E9E9E';
            case 'cancelled': return '#F44336';
            default: return '#666';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return 'play-circle';
            case 'draft': return 'edit';
            case 'completed': return 'check-circle';
            case 'paused': return 'pause-circle';
            case 'cancelled': return 'times-circle';
            default: return 'question-circle';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const renderPrescriptionsTab = () => (
        <ScrollView style={styles.tabContent}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Exercise Prescriptions</Text>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => setShowCreateModal(true)}
                >
                    <FontAwesome5 name="plus" size={16} color="#fff" />
                    <Text style={styles.createButtonText}>Create New</Text>
                </TouchableOpacity>
            </View>

            {prescriptions.length === 0 ? (
                <View style={styles.emptyState}>
                    <FontAwesome5 name="prescription" size={48} color="#ccc" />
                    <Text style={styles.emptyStateText}>No prescriptions yet</Text>
                    <Text style={styles.emptyStateSubtext}>
                        Create your first exercise prescription for a patient
                    </Text>
                </View>
            ) : (
                <View style={styles.prescriptionsList}>
                    {prescriptions.map((prescription) => (
                        <TouchableOpacity
                            key={prescription.id}
                            style={styles.prescriptionCard}
                            onPress={() => {
                                setSelectedPrescription(prescription);
                                setShowPrescriptionModal(true);
                            }}
                        >
                            <View style={styles.prescriptionHeader}>
                                <View style={styles.prescriptionInfo}>
                                    <Text style={styles.prescriptionTitle}>{prescription.title}</Text>
                                    <Text style={styles.prescriptionPatient}>Patient ID: {prescription.patientId}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(prescription.status) }]}>
                                    <FontAwesome5
                                        name={getStatusIcon(prescription.status)}
                                        size={12}
                                        color="#fff"
                                    />
                                    <Text style={styles.statusText}>{prescription.status}</Text>
                                </View>
                            </View>

                            <Text style={styles.prescriptionDescription} numberOfLines={2}>
                                {prescription.description}
                            </Text>

                            <View style={styles.prescriptionMetrics}>
                                <View style={styles.metric}>
                                    <FontAwesome5 name="dumbbell" size={14} color="#666" />
                                    <Text style={styles.metricText}>{prescription.exercises.length} exercises</Text>
                                </View>
                                <View style={styles.metric}>
                                    <FontAwesome5 name="calendar" size={14} color="#666" />
                                    <Text style={styles.metricText}>Started: {formatDate(prescription.startDate)}</Text>
                                </View>
                                <View style={styles.metric}>
                                    <FontAwesome5 name="target" size={14} color="#666" />
                                    <Text style={styles.metricText}>{prescription.goals.length} goals</Text>
                                </View>
                            </View>

                            {prescription.status === 'draft' && (
                                <TouchableOpacity
                                    style={styles.activateButton}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        handleActivatePrescription(prescription.id);
                                    }}
                                >
                                    <FontAwesome5 name="play" size={14} color="#4CAF50" />
                                    <Text style={styles.activateButtonText}>Activate</Text>
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </ScrollView>
    );

    const renderTemplatesTab = () => (
        <ScrollView style={styles.tabContent}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Prescription Templates</Text>
                <Text style={styles.sectionSubtitle}>
                    Pre-built exercise programs for common conditions
                </Text>
            </View>

            <View style={styles.templatesList}>
                {templates.map((template) => (
                    <TouchableOpacity
                        key={template.id}
                        style={styles.templateCard}
                        onPress={() => {
                            setSelectedTemplate(template);
                            // Template details would be shown in a modal (not implemented in this demo)
                            Alert.alert('Template Details', `${template.name}\n\n${template.description}`);
                        }}
                    >
                        <View style={styles.templateHeader}>
                            <Text style={styles.templateName}>{template.name}</Text>
                            <View style={styles.templateCategory}>
                                <Text style={styles.templateCategoryText}>{template.category}</Text>
                            </View>
                        </View>

                        <Text style={styles.templateDescription} numberOfLines={2}>
                            {template.description}
                        </Text>

                        <View style={styles.templateMetrics}>
                            <View style={styles.templateMetric}>
                                <FontAwesome5 name="dumbbell" size={12} color="#666" />
                                <Text style={styles.templateMetricText}>{template.exercises.length} exercises</Text>
                            </View>
                            <View style={styles.templateMetric}>
                                <FontAwesome5 name="clock" size={12} color="#666" />
                                <Text style={styles.templateMetricText}>{template.estimatedDuration}</Text>
                            </View>
                            <View style={styles.templateMetric}>
                                <FontAwesome5 name="signal" size={12} color="#666" />
                                <Text style={styles.templateMetricText}>{template.difficultyLevel}</Text>
                            </View>
                        </View>

                        <View style={styles.templateConditions}>
                            {template.targetConditions.slice(0, 3).map((condition, index) => (
                                <View key={index} style={styles.conditionTag}>
                                    <Text style={styles.conditionText}>{condition}</Text>
                                </View>
                            ))}
                            {template.targetConditions.length > 3 && (
                                <View style={styles.conditionTag}>
                                    <Text style={styles.conditionText}>+{template.targetConditions.length - 3}</Text>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={styles.useTemplateButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                setSelectedTemplate(template);
                                setShowCreateModal(true);
                            }}
                        >
                            <FontAwesome5 name="plus" size={14} color="#f093fb" />
                            <Text style={styles.useTemplateButtonText}>Use Template</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );

    const renderRecommendationsTab = () => (
        <ScrollView style={styles.tabContent}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Exercise Recommendations</Text>
                <Text style={styles.sectionSubtitle}>
                    AI-powered suggestions based on patient progress
                </Text>
            </View>

            {prescriptions.length === 0 ? (
                <View style={styles.emptyState}>
                    <FontAwesome5 name="lightbulb" size={48} color="#ccc" />
                    <Text style={styles.emptyStateText}>No active prescriptions</Text>
                    <Text style={styles.emptyStateSubtext}>
                        Create prescriptions to get personalized recommendations
                    </Text>
                </View>
            ) : (
                <View style={styles.recommendationsList}>
                    {prescriptions.filter(p => p.status === 'active').map((prescription) => (
                        <View key={prescription.id} style={styles.recommendationCard}>
                            <View style={styles.recommendationHeader}>
                                <View style={styles.recommendationInfo}>
                                    <Text style={styles.recommendationTitle}>{prescription.title}</Text>
                                    <Text style={styles.recommendationPatient}>Patient: {prescription.patientId}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.generateButton}
                                    onPress={() => handleGenerateRecommendations(prescription.patientId, prescription.id)}
                                >
                                    <FontAwesome5 name="magic" size={14} color="#f093fb" />
                                    <Text style={styles.generateButtonText}>Generate</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.recommendationActions}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => handleAutoAdjustDifficulty(prescription.id, prescription.patientId)}
                                >
                                    <FontAwesome5 name="sliders-h" size={14} color="#4CAF50" />
                                    <Text style={styles.actionButtonText}>Auto-Adjust</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: 'rgba(33, 150, 243, 0.1)' }]}
                                    onPress={() => {
                                        // Navigate to patient progress view
                                        Alert.alert('Info', 'Patient progress view would open here');
                                    }}
                                >
                                    <FontAwesome5 name="chart-line" size={14} color="#2196F3" />
                                    <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>View Progress</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.prescriptionSummary}>
                                <Text style={styles.summaryText}>
                                    {prescription.exercises.length} exercises • {prescription.goals.length} goals
                                </Text>
                                <Text style={styles.summaryText}>
                                    Started: {formatDate(prescription.startDate)}
                                </Text>
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
                <Text style={styles.title}>Exercise Prescriptions</Text>
                <Text style={styles.subtitle}>Create and manage patient exercise programs</Text>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabNavigation}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'prescriptions' && styles.activeTab]}
                    onPress={() => setActiveTab('prescriptions')}
                >
                    <FontAwesome5
                        name="prescription"
                        size={16}
                        color={activeTab === 'prescriptions' ? '#f093fb' : '#666'}
                    />
                    <Text style={[styles.tabText, activeTab === 'prescriptions' && styles.activeTabText]}>
                        Prescriptions
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'templates' && styles.activeTab]}
                    onPress={() => setActiveTab('templates')}
                >
                    <FontAwesome5
                        name="file-medical"
                        size={16}
                        color={activeTab === 'templates' ? '#f093fb' : '#666'}
                    />
                    <Text style={[styles.tabText, activeTab === 'templates' && styles.activeTabText]}>
                        Templates
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'recommendations' && styles.activeTab]}
                    onPress={() => setActiveTab('recommendations')}
                >
                    <FontAwesome5
                        name="lightbulb"
                        size={16}
                        color={activeTab === 'recommendations' ? '#f093fb' : '#666'}
                    />
                    <Text style={[styles.tabText, activeTab === 'recommendations' && styles.activeTabText]}>
                        Recommendations
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Tab Content */}
            {activeTab === 'prescriptions' && renderPrescriptionsTab()}
            {activeTab === 'templates' && renderTemplatesTab()}
            {activeTab === 'recommendations' && renderRecommendationsTab()}

            {/* Create Prescription Modal */}
            <Modal
                visible={showCreateModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {selectedTemplate ? `Create from ${selectedTemplate.name}` : 'Create Prescription'}
                        </Text>
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => {
                                setShowCreateModal(false);
                                setSelectedTemplate(null);
                            }}
                        >
                            <FontAwesome5 name="times" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        <View style={styles.formSection}>
                            <Text style={styles.formLabel}>Patient ID</Text>
                            <TextInput
                                style={styles.formInput}
                                value={newPrescription.patientId}
                                onChangeText={(text) => setNewPrescription(prev => ({ ...prev, patientId: text }))}
                                placeholder="Enter patient ID"
                            />
                        </View>

                        <View style={styles.formSection}>
                            <Text style={styles.formLabel}>Title</Text>
                            <TextInput
                                style={styles.formInput}
                                value={newPrescription.title}
                                onChangeText={(text) => setNewPrescription(prev => ({ ...prev, title: text }))}
                                placeholder={selectedTemplate ? selectedTemplate.name : "Enter prescription title"}
                            />
                        </View>

                        <View style={styles.formSection}>
                            <Text style={styles.formLabel}>Description</Text>
                            <TextInput
                                style={[styles.formInput, styles.textArea]}
                                value={newPrescription.description}
                                onChangeText={(text) => setNewPrescription(prev => ({ ...prev, description: text }))}
                                placeholder={selectedTemplate ? selectedTemplate.description : "Enter description"}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <View style={styles.formRow}>
                            <View style={styles.formSection}>
                                <Text style={styles.formLabel}>Start Date</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={newPrescription.startDate}
                                    onChangeText={(text) => setNewPrescription(prev => ({ ...prev, startDate: text }))}
                                    placeholder="YYYY-MM-DD"
                                />
                            </View>

                            <View style={styles.formSection}>
                                <Text style={styles.formLabel}>End Date (Optional)</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={newPrescription.endDate}
                                    onChangeText={(text) => setNewPrescription(prev => ({ ...prev, endDate: text }))}
                                    placeholder="YYYY-MM-DD"
                                />
                            </View>
                        </View>

                        <View style={styles.formSection}>
                            <Text style={styles.formLabel}>Notes</Text>
                            <TextInput
                                style={[styles.formInput, styles.textArea]}
                                value={newPrescription.notes}
                                onChangeText={(text) => setNewPrescription(prev => ({ ...prev, notes: text }))}
                                placeholder="Additional notes or instructions"
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {selectedTemplate && (
                            <View style={styles.templatePreview}>
                                <Text style={styles.templatePreviewTitle}>Template Preview</Text>
                                <Text style={styles.templatePreviewText}>
                                    {selectedTemplate.exercises.length} exercises • {selectedTemplate.estimatedDuration}
                                </Text>
                                <Text style={styles.templatePreviewText}>
                                    Difficulty: {selectedTemplate.difficultyLevel}
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.createPrescriptionButton}
                            onPress={() => {
                                if (selectedTemplate) {
                                    handleCreateFromTemplate(selectedTemplate.id);
                                } else {
                                    // Handle custom prescription creation
                                    Alert.alert('Info', 'Custom prescription creation not implemented in this demo');
                                }
                            }}
                        >
                            <FontAwesome5 name="plus" size={16} color="#fff" />
                            <Text style={styles.createPrescriptionButtonText}>Create Prescription</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>

            {/* Prescription Detail Modal */}
            <Modal
                visible={showPrescriptionModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowPrescriptionModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Prescription Details</Text>
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setShowPrescriptionModal(false)}
                        >
                            <FontAwesome5 name="times" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {selectedPrescription && (
                        <ScrollView style={styles.modalContent}>
                            <View style={styles.prescriptionDetail}>
                                <View style={styles.prescriptionDetailHeader}>
                                    <Text style={styles.prescriptionDetailTitle}>{selectedPrescription.title}</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedPrescription.status) }]}>
                                        <FontAwesome5
                                            name={getStatusIcon(selectedPrescription.status)}
                                            size={12}
                                            color="#fff"
                                        />
                                        <Text style={styles.statusText}>{selectedPrescription.status}</Text>
                                    </View>
                                </View>

                                <Text style={styles.prescriptionDetailDescription}>
                                    {selectedPrescription.description}
                                </Text>

                                <View style={styles.exercisesList}>
                                    <Text style={styles.exercisesTitle}>Exercises ({selectedPrescription.exercises.length})</Text>
                                    {selectedPrescription.exercises.map((exercise) => (
                                        <View key={exercise.id} style={styles.exerciseItem}>
                                            <View style={styles.exerciseHeader}>
                                                <Text style={styles.exerciseName}>{exercise.name}</Text>
                                                <Text style={styles.exerciseDifficulty}>{exercise.difficulty}</Text>
                                            </View>

                                            <Text style={styles.exerciseDescription}>{exercise.description}</Text>

                                            <View style={styles.exerciseSpecs}>
                                                <Text style={styles.exerciseSpec}>
                                                    {exercise.sets} sets × {
                                                        typeof exercise.reps === 'object'
                                                            ? `${exercise.reps.min}-${exercise.reps.max}`
                                                            : exercise.reps
                                                    } reps
                                                </Text>
                                                <Text style={styles.exerciseSpec}>
                                                    {exercise.frequency.timesPerWeek}x/week
                                                </Text>
                                            </View>

                                            <View style={styles.exerciseActions}>
                                                <TouchableOpacity
                                                    style={styles.adjustButton}
                                                    onPress={() => {
                                                        Alert.alert(
                                                            'Adjust Exercise',
                                                            'Choose adjustment type:',
                                                            [
                                                                { text: 'Cancel', style: 'cancel' },
                                                                {
                                                                    text: 'Increase Difficulty',
                                                                    onPress: () => handleAdjustPrescription(
                                                                        selectedPrescription.id,
                                                                        exercise.id,
                                                                        'increase_difficulty',
                                                                        { repsIncrease: 2 }
                                                                    )
                                                                },
                                                                {
                                                                    text: 'Decrease Difficulty',
                                                                    onPress: () => handleAdjustPrescription(
                                                                        selectedPrescription.id,
                                                                        exercise.id,
                                                                        'decrease_difficulty',
                                                                        { repsDecrease: 2 }
                                                                    )
                                                                },
                                                                {
                                                                    text: 'Get Recommendations',
                                                                    onPress: () => handleGenerateRecommendations(selectedPrescription.patientId, selectedPrescription.id)
                                                                }
                                                            ]
                                                        );
                                                    }}
                                                >
                                                    <FontAwesome5 name="sliders-h" size={14} color="#f093fb" />
                                                    <Text style={styles.adjustButtonText}>Adjust</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>

                                <View style={styles.goalsList}>
                                    <Text style={styles.goalsTitle}>Goals ({selectedPrescription.goals.length})</Text>
                                    {selectedPrescription.goals.map((goal) => (
                                        <View key={goal.id} style={styles.goalItem}>
                                            <View style={styles.goalHeader}>
                                                <Text style={styles.goalType}>{goal.type}</Text>
                                                <Text style={styles.goalPriority}>{goal.priority} priority</Text>
                                            </View>
                                            <Text style={styles.goalDescription}>{goal.description}</Text>
                                            <Text style={styles.goalTimeframe}>Target: {goal.timeframe}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </ScrollView>
                    )}
                </View>
            </Modal>

            {/* Recommendations Modal */}
            <Modal
                visible={showRecommendationsModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowRecommendationsModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Exercise Recommendations</Text>
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setShowRecommendationsModal(false)}
                        >
                            <FontAwesome5 name="times" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {recommendations && (
                        <ScrollView style={styles.modalContent}>
                            {/* Progress Overview */}
                            <View style={styles.recommendationSection}>
                                <Text style={styles.recommendationSectionTitle}>Progress Overview</Text>

                                {recommendations.concerns.length > 0 && (
                                    <View style={styles.concernsSection}>
                                        <Text style={styles.concernsTitle}>⚠️ Areas of Concern</Text>
                                        {recommendations.concerns.map((concern, index) => (
                                            <Text key={index} style={styles.concernText}>• {concern}</Text>
                                        ))}
                                    </View>
                                )}

                                {recommendations.progressions.length > 0 && (
                                    <View style={styles.progressionsSection}>
                                        <Text style={styles.progressionsTitle}>📈 Ready for Progression</Text>
                                        {recommendations.progressions.map((progression, index) => (
                                            <Text key={index} style={styles.progressionText}>• {progression}</Text>
                                        ))}
                                    </View>
                                )}
                            </View>

                            {/* Exercise-Specific Recommendations */}
                            {recommendations.exerciseRecommendations.length > 0 && (
                                <View style={styles.recommendationSection}>
                                    <Text style={styles.recommendationSectionTitle}>Exercise Recommendations</Text>
                                    {recommendations.exerciseRecommendations.map((rec) => (
                                        <View key={rec.id} style={styles.exerciseRecommendationCard}>
                                            <View style={styles.exerciseRecommendationHeader}>
                                                <Text style={styles.exerciseRecommendationName}>{rec.exerciseName}</Text>
                                                <View style={[styles.priorityBadge, {
                                                    backgroundColor: rec.priority === 'high' ? '#FF5722' :
                                                        rec.priority === 'medium' ? '#FF9800' : '#4CAF50'
                                                }]}>
                                                    <Text style={styles.priorityText}>{rec.priority}</Text>
                                                </View>
                                            </View>

                                            <Text style={styles.recommendationType}>{rec.recommendationType.replace('_', ' ').toUpperCase()}</Text>
                                            <Text style={styles.recommendationReason}>{rec.reason}</Text>

                                            <View style={styles.suggestedChanges}>
                                                <Text style={styles.suggestedChangesTitle}>Suggested Changes:</Text>
                                                {rec.suggestedChanges.increaseReps && (
                                                    <Text style={styles.changeText}>• Increase reps by {rec.suggestedChanges.increaseReps}</Text>
                                                )}
                                                {rec.suggestedChanges.increaseSets && (
                                                    <Text style={styles.changeText}>• Add {rec.suggestedChanges.increaseSets} more set(s)</Text>
                                                )}
                                                {rec.suggestedChanges.addFormCues && (
                                                    <Text style={styles.changeText}>• Add form cues: {rec.suggestedChanges.addFormCues.join(', ')}</Text>
                                                )}
                                                {rec.suggestedChanges.reduceIntensity && (
                                                    <Text style={styles.changeText}>• Reduce exercise intensity</Text>
                                                )}
                                                {rec.suggestedChanges.alternativeExercise && (
                                                    <Text style={styles.changeText}>• Consider alternative: {rec.suggestedChanges.alternativeExercise}</Text>
                                                )}
                                            </View>

                                            <Text style={styles.expectedOutcome}>Expected: {rec.expectedOutcome}</Text>

                                            <TouchableOpacity
                                                style={styles.applyRecommendationButton}
                                                onPress={() => {
                                                    Alert.alert(
                                                        'Apply Recommendation',
                                                        `Apply this recommendation for ${rec.exerciseName}?`,
                                                        [
                                                            { text: 'Cancel', style: 'cancel' },
                                                            {
                                                                text: 'Apply',
                                                                onPress: () => {
                                                                    // Apply the recommendation
                                                                    Alert.alert('Success', 'Recommendation applied successfully');
                                                                    setShowRecommendationsModal(false);
                                                                }
                                                            }
                                                        ]
                                                    );
                                                }}
                                            >
                                                <FontAwesome5 name="check" size={14} color="#fff" />
                                                <Text style={styles.applyRecommendationButtonText}>Apply</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Difficulty Adjustments */}
                            {recommendations.difficultyAdjustments.length > 0 && (
                                <View style={styles.recommendationSection}>
                                    <Text style={styles.recommendationSectionTitle}>Difficulty Adjustments</Text>
                                    {recommendations.difficultyAdjustments.map((adjustment, index) => (
                                        <View key={index} style={styles.difficultyAdjustmentCard}>
                                            <Text style={styles.adjustmentType}>{adjustment.adjustmentType.replace('_', ' ').toUpperCase()}</Text>
                                            <Text style={styles.adjustmentReason}>{adjustment.reason}</Text>

                                            <View style={styles.adjustmentParameters}>
                                                {adjustment.parameters.repsIncrease && (
                                                    <Text style={styles.parameterText}>• Increase reps by {adjustment.parameters.repsIncrease}</Text>
                                                )}
                                                {adjustment.parameters.repsReduction && (
                                                    <Text style={styles.parameterText}>• Reduce reps by {adjustment.parameters.repsReduction}</Text>
                                                )}
                                                {adjustment.parameters.setsIncrease && (
                                                    <Text style={styles.parameterText}>• Add {adjustment.parameters.setsIncrease} set(s)</Text>
                                                )}
                                                {adjustment.parameters.addResistance && (
                                                    <Text style={styles.parameterText}>• Add resistance/weight</Text>
                                                )}
                                                {adjustment.parameters.addAssistance && (
                                                    <Text style={styles.parameterText}>• Add assistance/support</Text>
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Next Steps */}
                            {recommendations.nextSteps.length > 0 && (
                                <View style={styles.recommendationSection}>
                                    <Text style={styles.recommendationSectionTitle}>Next Steps</Text>
                                    {recommendations.nextSteps.map((step, index) => (
                                        <Text key={index} style={styles.nextStepText}>• {step}</Text>
                                    ))}
                                </View>
                            )}
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
        backgroundColor: '#f093fb',
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
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f093fb',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
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
    prescriptionsList: {
        gap: 16,
    },
    prescriptionCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    prescriptionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    prescriptionInfo: {
        flex: 1,
    },
    prescriptionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    prescriptionPatient: {
        fontSize: 14,
        color: '#666',
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
    prescriptionDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 16,
    },
    prescriptionMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    metric: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    metricText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 6,
    },
    activateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        paddingVertical: 8,
        borderRadius: 8,
    },
    activateButtonText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
        marginLeft: 8,
    },
    templatesList: {
        gap: 16,
    },
    templateCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    templateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    templateName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    templateCategory: {
        backgroundColor: '#f0f4ff',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    templateCategoryText: {
        fontSize: 12,
        color: '#f093fb',
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    templateDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 16,
    },
    templateMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    templateMetric: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    templateMetricText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 6,
    },
    templateConditions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    conditionTag: {
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 6,
        marginBottom: 6,
    },
    conditionText: {
        fontSize: 10,
        color: '#666',
    },
    // Recommendations styles
    recommendationsList: {
        gap: 16,
    },
    recommendationCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    recommendationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    recommendationInfo: {
        flex: 1,
    },
    recommendationTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    recommendationPatient: {
        fontSize: 14,
        color: '#666',
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(240, 147, 251, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    generateButtonText: {
        fontSize: 12,
        color: '#f093fb',
        fontWeight: '600',
        marginLeft: 6,
    },
    recommendationActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        flex: 1,
        justifyContent: 'center',
    },
    actionButtonText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '600',
        marginLeft: 6,
    },
    prescriptionSummary: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12,
    },
    summaryText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    // Recommendations modal styles
    recommendationSection: {
        marginBottom: 24,
    },
    recommendationSectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 16,
    },
    concernsSection: {
        backgroundColor: '#fff3e0',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#ff9800',
    },
    concernsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#e65100',
        marginBottom: 8,
    },
    concernText: {
        fontSize: 14,
        color: '#bf360c',
        lineHeight: 20,
        marginBottom: 4,
    },
    progressionsSection: {
        backgroundColor: '#e8f5e8',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#4caf50',
    },
    progressionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2e7d32',
        marginBottom: 8,
    },
    progressionText: {
        fontSize: 14,
        color: '#1b5e20',
        lineHeight: 20,
        marginBottom: 4,
    },
    exerciseRecommendationCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    exerciseRecommendationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    exerciseRecommendationName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    priorityText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    recommendationType: {
        fontSize: 12,
        color: '#f093fb',
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    recommendationReason: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 12,
    },
    suggestedChanges: {
        marginBottom: 12,
    },
    suggestedChangesTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
    },
    changeText: {
        fontSize: 13,
        color: '#555',
        lineHeight: 18,
        marginBottom: 2,
    },
    expectedOutcome: {
        fontSize: 13,
        color: '#4caf50',
        fontStyle: 'italic',
        marginBottom: 12,
    },
    applyRecommendationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f093fb',
        paddingVertical: 8,
        borderRadius: 8,
    },
    applyRecommendationButtonText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '600',
        marginLeft: 6,
    },
    difficultyAdjustmentCard: {
        backgroundColor: '#f0f4ff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#2196f3',
    },
    adjustmentType: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1976d2',
        marginBottom: 6,
    },
    adjustmentReason: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
        marginBottom: 10,
    },
    adjustmentParameters: {
        marginTop: 8,
    },
    parameterText: {
        fontSize: 12,
        color: '#555',
        lineHeight: 16,
        marginBottom: 2,
    },
    nextStepText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        marginBottom: 6,
    },
    useTemplateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(240, 147, 251, 0.1)',
        paddingVertical: 8,
        borderRadius: 8,
    },
    useTemplateButtonText: {
        fontSize: 14,
        color: '#f093fb',
        fontWeight: '600',
        marginLeft: 8,
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
        marginBottom: 20,
    },
    formRow: {
        flexDirection: 'row',
        gap: 16,
    },
    formLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    formInput: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    templatePreview: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    templatePreviewTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    templatePreviewText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    createPrescriptionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f093fb',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 20,
    },
    createPrescriptionButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
        marginLeft: 12,
    },
    prescriptionDetail: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    prescriptionDetailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    prescriptionDetailTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
        flex: 1,
    },
    prescriptionDetailDescription: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
        marginBottom: 24,
    },
    exercisesList: {
        marginBottom: 24,
    },
    exercisesTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    exerciseItem: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    exerciseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    exerciseDifficulty: {
        fontSize: 12,
        color: '#f093fb',
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    exerciseDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 12,
    },
    exerciseSpecs: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    exerciseSpec: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    exerciseActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    adjustButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(240, 147, 251, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    adjustButtonText: {
        fontSize: 12,
        color: '#f093fb',
        fontWeight: '600',
        marginLeft: 6,
    },
    goalsList: {
        marginBottom: 24,
    },
    goalsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    goalItem: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    goalType: {
        fontSize: 14,
        fontWeight: '600',
        color: '#f093fb',
        textTransform: 'capitalize',
    },
    goalPriority: {
        fontSize: 12,
        color: '#666',
        textTransform: 'capitalize',
    },
    goalDescription: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        marginBottom: 8,
    },
    goalTimeframe: {
        fontSize: 12,
        color: '#666',
    },
});

export default ProviderPrescriptionInterface;
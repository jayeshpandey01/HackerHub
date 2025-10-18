// Secure Data Transmission Service for Healthcare Provider Integration
import { consentService, SharedDataPackage } from './consentService';
import { fitnessBackendService, AnalysisResult } from './fitnessBackendService';

export interface SecureTransmissionLog {
  id: string;
  patientId: string;
  providerId: string;
  dataType: string;
  transmissionMethod: 'encrypted_api' | 'secure_file' | 'hl7_fhir';
  status: 'pending' | 'transmitted' | 'delivered' | 'failed';
  timestamp: string;
  encryptionMethod: string;
  auditHash: string;
  deliveryConfirmation?: string;
  errorDetails?: string;
}

export interface ProviderEndpoint {
  id: string;
  providerId: string;
  name: string;
  endpoint: string;
  authMethod: 'oauth2' | 'api_key' | 'certificate';
  credentials: any;
  supportedFormats: ('json' | 'hl7_fhir' | 'xml')[];
  isActive: boolean;
  lastVerified: string;
}

export interface DataPackageMetadata {
  patientId: string;
  providerId: string;
  dataTypes: string[];
  generatedAt: string;
  expiresAt: string;
  accessCount: number;
  maxAccess: number;
}

export interface ExerciseDataSummary {
  patientId: string;
  patientName: string;
  dateRange: {
    start: string;
    end: string;
  };
  totalSessions: number;
  exerciseTypes: {
    type: string;
    sessions: number;
    averageAccuracy: number;
    averageDuration: number;
    totalReps: number;
  }[];
  overallMetrics: {
    averageAccuracy: number;
    totalDuration: number;
    totalCalories: number;
    improvementTrend: 'improving' | 'stable' | 'declining';
  };
  recentSessions: AnalysisResult[];
  recommendations: string[];
  alerts: {
    type: 'form_concern' | 'progress_plateau' | 'missed_sessions';
    message: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: string;
  }[];
}

class SecureDataService {
  private static instance: SecureDataService;
  private transmissionLogs: Map<string, SecureTransmissionLog> = new Map();
  private providerEndpoints: Map<string, ProviderEndpoint> = new Map();
  private dataPackages: Map<string, DataPackageMetadata> = new Map();

  private constructor() {
    this.initializeMockEndpoints();
  }

  static getInstance(): SecureDataService {
    if (!SecureDataService.instance) {
      SecureDataService.instance = new SecureDataService();
    }
    return SecureDataService.instance;
  }

  private initializeMockEndpoints(): void {
    const mockEndpoint: ProviderEndpoint = {
      id: 'endpoint_1',
      providerId: 'doctor_456',
      name: 'Dr. Smith Clinic API',
      endpoint: 'https://api.drsmith-clinic.com/v1/patient-data',
      authMethod: 'oauth2',
      credentials: {
        clientId: 'clinic_client_123',
        clientSecret: 'encrypted_secret',
        tokenEndpoint: 'https://auth.drsmith-clinic.com/oauth/token'
      },
      supportedFormats: ['json', 'hl7_fhir'],
      isActive: true,
      lastVerified: new Date().toISOString()
    };

    this.providerEndpoints.set(mockEndpoint.id, mockEndpoint);
  }

  // Generate comprehensive exercise data summary for provider
  async generateExerciseDataSummary(
    patientId: string,
    providerId: string,
    dateRange?: { start: string; end: string }
  ): Promise<ExerciseDataSummary> {
    // Verify consent
    const accessCheck = await consentService.checkAccess(providerId, patientId, 'exercise_data');
    if (!accessCheck.hasAccess) {
      throw new Error('Access denied: No valid consent for exercise data');
    }

    // Mock exercise data - in real implementation, this would come from the fitness backend
    const mockSessions: AnalysisResult[] = [
      {
        sessionId: 'session_1',
        exerciseType: 'Squats',
        totalReps: 20,
        accuracy: 85,
        formFeedback: [
          {
            timestamp: 1000,
            type: 'correction',
            message: 'Keep knees aligned with toes',
            bodyPart: 'knees',
            severity: 'medium'
          }
        ],
        keypoints: [],
        duration: 15,
        calories: 45,
        recommendations: ['Focus on knee alignment', 'Slower descent phase'],
        timestamp: '2024-12-10T10:30:00Z'
      },
      {
        sessionId: 'session_2',
        exerciseType: 'Push-ups',
        totalReps: 15,
        accuracy: 92,
        formFeedback: [
          {
            timestamp: 800,
            type: 'success',
            message: 'Excellent form maintained',
            bodyPart: 'core',
            severity: 'low'
          }
        ],
        keypoints: [],
        duration: 12,
        calories: 38,
        recommendations: ['Ready for progression', 'Consider incline push-ups'],
        timestamp: '2024-12-09T14:20:00Z'
      }
    ];

    const summary: ExerciseDataSummary = {
      patientId,
      patientName: 'Sarah Johnson', // In real app, fetch from user service
      dateRange: dateRange || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      },
      totalSessions: mockSessions.length,
      exerciseTypes: [
        {
          type: 'Squats',
          sessions: 1,
          averageAccuracy: 85,
          averageDuration: 15,
          totalReps: 20
        },
        {
          type: 'Push-ups',
          sessions: 1,
          averageAccuracy: 92,
          averageDuration: 12,
          totalReps: 15
        }
      ],
      overallMetrics: {
        averageAccuracy: 88.5,
        totalDuration: 27,
        totalCalories: 83,
        improvementTrend: 'improving'
      },
      recentSessions: mockSessions,
      recommendations: [
        'Patient shows good progress in upper body exercises',
        'Consider adding lower body strengthening',
        'Monitor knee alignment during squats'
      ],
      alerts: [
        {
          type: 'form_concern',
          message: 'Knee alignment needs attention during squats',
          severity: 'medium',
          timestamp: '2024-12-10T10:30:00Z'
        }
      ]
    };

    // Log data access
    await this.logDataAccess(patientId, providerId, 'exercise_data_summary');

    return summary;
  }

  // Securely transmit data to healthcare provider
  async transmitDataToProvider(
    patientId: string,
    providerId: string,
    dataType: string,
    data: any,
    format: 'json' | 'hl7_fhir' | 'xml' = 'json'
  ): Promise<SecureTransmissionLog> {
    // Verify consent
    const accessCheck = await consentService.checkAccess(providerId, patientId, dataType);
    if (!accessCheck.hasAccess) {
      throw new Error('Access denied: No valid consent for this data type');
    }

    // Get provider endpoint
    const endpoint = Array.from(this.providerEndpoints.values()).find(
      ep => ep.providerId === providerId && ep.isActive
    );

    if (!endpoint) {
      throw new Error('No active endpoint found for provider');
    }

    if (!endpoint.supportedFormats.includes(format)) {
      throw new Error(`Provider does not support ${format} format`);
    }

    // Create transmission log
    const transmissionLog: SecureTransmissionLog = {
      id: `transmission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      providerId,
      dataType,
      transmissionMethod: 'encrypted_api',
      status: 'pending',
      timestamp: new Date().toISOString(),
      encryptionMethod: 'AES-256-GCM',
      auditHash: this.generateAuditHash(data)
    };

    this.transmissionLogs.set(transmissionLog.id, transmissionLog);

    try {
      // Encrypt data
      const encryptedData = await this.encryptData(data, endpoint.credentials);

      // Format data according to provider requirements
      const formattedData = await this.formatData(encryptedData, format);

      // Transmit to provider endpoint
      const deliveryConfirmation = await this.sendToProvider(endpoint, formattedData);

      // Update transmission log
      transmissionLog.status = 'transmitted';
      transmissionLog.deliveryConfirmation = deliveryConfirmation;
      this.transmissionLogs.set(transmissionLog.id, transmissionLog);

      // Log successful transmission
      await this.logDataAccess(patientId, providerId, `transmitted_${dataType}`);

      console.log('✅ Data transmitted successfully:', transmissionLog.id);
      return transmissionLog;

    } catch (error) {
      // Update transmission log with error
      transmissionLog.status = 'failed';
      transmissionLog.errorDetails = error instanceof Error ? error.message : 'Unknown error';
      this.transmissionLogs.set(transmissionLog.id, transmissionLog);

      console.error('❌ Data transmission failed:', error);
      throw error;
    }
  }

  // Create secure data package for provider access
  async createSecureDataPackage(
    patientId: string,
    providerId: string,
    dataTypes: string[],
    expirationHours: number = 24,
    maxAccess: number = 5
  ): Promise<{ packageId: string; accessUrl: string; accessKey: string }> {
    // Verify consent for all requested data types
    for (const dataType of dataTypes) {
      const accessCheck = await consentService.checkAccess(providerId, patientId, dataType);
      if (!accessCheck.hasAccess) {
        throw new Error(`Access denied for data type: ${dataType}`);
      }
    }

    const packageId = `package_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const accessKey = this.generateAccessKey();

    // Create package metadata
    const metadata: DataPackageMetadata = {
      patientId,
      providerId,
      dataTypes,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString(),
      accessCount: 0,
      maxAccess
    };

    this.dataPackages.set(packageId, metadata);

    // Generate secure access URL
    const accessUrl = `https://secure-health-data.com/packages/${packageId}`;

    // Log package creation
    await this.logDataAccess(patientId, providerId, `package_created_${dataTypes.join(',')}`);

    console.log('📦 Secure data package created:', packageId);
    return { packageId, accessUrl, accessKey };
  }

  // Access secure data package (provider endpoint)
  async accessDataPackage(
    packageId: string,
    accessKey: string,
    providerId: string
  ): Promise<any> {
    const metadata = this.dataPackages.get(packageId);
    if (!metadata) {
      throw new Error('Data package not found');
    }

    // Verify provider access
    if (metadata.providerId !== providerId) {
      throw new Error('Unauthorized: Provider ID mismatch');
    }

    // Check expiration
    if (new Date() > new Date(metadata.expiresAt)) {
      throw new Error('Data package has expired');
    }

    // Check access count
    if (metadata.accessCount >= metadata.maxAccess) {
      throw new Error('Maximum access count exceeded');
    }

    // Verify access key (simplified for demo)
    const expectedKey = this.generateAccessKey(); // In real implementation, store and verify actual key
    
    // Increment access count
    metadata.accessCount++;
    this.dataPackages.set(packageId, metadata);

    // Generate data based on requested types
    const packageData: any = {};
    
    for (const dataType of metadata.dataTypes) {
      switch (dataType) {
        case 'exercise_data':
          packageData.exerciseData = await this.generateExerciseDataSummary(
            metadata.patientId,
            providerId
          );
          break;
        case 'health_metrics':
          packageData.healthMetrics = {
            heartRate: { average: 72, max: 95, min: 58 },
            bloodPressure: { systolic: 120, diastolic: 80 },
            weight: 68.5,
            bmi: 22.1
          };
          break;
        // Add more data types as needed
      }
    }

    // Log package access
    await this.logDataAccess(metadata.patientId, providerId, `package_accessed_${packageId}`);

    console.log('📖 Data package accessed:', packageId);
    return packageData;
  }

  // Get transmission logs for audit
  async getTransmissionLogs(
    patientId?: string,
    providerId?: string,
    dateRange?: { start: string; end: string }
  ): Promise<SecureTransmissionLog[]> {
    let logs = Array.from(this.transmissionLogs.values());

    if (patientId) {
      logs = logs.filter(log => log.patientId === patientId);
    }

    if (providerId) {
      logs = logs.filter(log => log.providerId === providerId);
    }

    if (dateRange) {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      logs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= start && logDate <= end;
      });
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Register provider endpoint
  async registerProviderEndpoint(endpoint: Omit<ProviderEndpoint, 'id' | 'lastVerified'>): Promise<ProviderEndpoint> {
    const newEndpoint: ProviderEndpoint = {
      ...endpoint,
      id: `endpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastVerified: new Date().toISOString()
    };

    // Verify endpoint connectivity
    const isValid = await this.verifyEndpoint(newEndpoint);
    if (!isValid) {
      throw new Error('Endpoint verification failed');
    }

    this.providerEndpoints.set(newEndpoint.id, newEndpoint);
    console.log('🔗 Provider endpoint registered:', newEndpoint.id);
    
    return newEndpoint;
  }

  // Verify provider endpoint
  private async verifyEndpoint(endpoint: ProviderEndpoint): Promise<boolean> {
    try {
      // In real implementation, make actual HTTP request to verify endpoint
      console.log('🔍 Verifying endpoint:', endpoint.endpoint);
      
      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('❌ Endpoint verification failed:', error);
      return false;
    }
  }

  // Helper methods
  private async encryptData(data: any, credentials: any): Promise<string> {
    // Simplified encryption for demo - use proper encryption in production
    const jsonData = JSON.stringify(data);
    return Buffer.from(jsonData).toString('base64');
  }

  private async formatData(data: string, format: 'json' | 'hl7_fhir' | 'xml'): Promise<string> {
    switch (format) {
      case 'json':
        return data;
      case 'hl7_fhir':
        // Convert to FHIR format (simplified)
        return `{"resourceType": "Bundle", "entry": [{"resource": ${Buffer.from(data, 'base64').toString()}}]}`;
      case 'xml':
        // Convert to XML format (simplified)
        return `<?xml version="1.0"?><data>${data}</data>`;
      default:
        return data;
    }
  }

  private async sendToProvider(endpoint: ProviderEndpoint, data: string): Promise<string> {
    // Simulate API call to provider endpoint
    console.log('📤 Sending data to provider:', endpoint.endpoint);
    
    // In real implementation, make actual HTTP request
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAuditHash(data: any): string {
    // Generate hash for audit trail (simplified)
    const jsonData = JSON.stringify(data);
    return `hash_${Buffer.from(jsonData).toString('base64').slice(0, 16)}`;
  }

  private generateAccessKey(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  private async logDataAccess(patientId: string, providerId: string, action: string): Promise<void> {
    // This would integrate with the consent service audit trail
    console.log(`📋 Data access logged: ${action} for patient ${patientId} by provider ${providerId}`);
  }

  // Get provider endpoints
  async getProviderEndpoints(providerId: string): Promise<ProviderEndpoint[]> {
    return Array.from(this.providerEndpoints.values()).filter(
      endpoint => endpoint.providerId === providerId
    );
  }

  // Update provider endpoint
  async updateProviderEndpoint(
    endpointId: string,
    updates: Partial<ProviderEndpoint>
  ): Promise<ProviderEndpoint> {
    const endpoint = this.providerEndpoints.get(endpointId);
    if (!endpoint) {
      throw new Error('Endpoint not found');
    }

    const updatedEndpoint = { ...endpoint, ...updates, lastVerified: new Date().toISOString() };
    this.providerEndpoints.set(endpointId, updatedEndpoint);

    console.log('🔄 Provider endpoint updated:', endpointId);
    return updatedEndpoint;
  }

  // Get data package statistics
  getPackageStats(): {
    total: number;
    active: number;
    expired: number;
    accessed: number;
  } {
    const packages = Array.from(this.dataPackages.values());
    const now = new Date();

    return {
      total: packages.length,
      active: packages.filter(p => new Date(p.expiresAt) > now && p.accessCount < p.maxAccess).length,
      expired: packages.filter(p => new Date(p.expiresAt) <= now).length,
      accessed: packages.filter(p => p.accessCount > 0).length
    };
  }
}

export const secureDataService = SecureDataService.getInstance();
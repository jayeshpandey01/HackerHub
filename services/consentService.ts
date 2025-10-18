// Consent Management Service for Healthcare Data Sharing
export interface ConsentRecord {
  id: string;
  patientId: string;
  providerId: string;
  dataTypes: DataType[];
  status: 'active' | 'revoked' | 'expired';
  grantedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  purpose: string;
  accessLevel: 'read' | 'read_write';
  auditTrail: ConsentAuditEntry[];
}

export interface DataType {
  category: 'exercise_data' | 'health_metrics' | 'progress_reports' | 'recommendations';
  subcategories: string[];
  description: string;
}

export interface ConsentAuditEntry {
  id: string;
  action: 'granted' | 'accessed' | 'modified' | 'revoked';
  timestamp: string;
  userId: string;
  userType: 'patient' | 'provider';
  details: string;
  ipAddress?: string;
}

export interface DataAccessRequest {
  id: string;
  providerId: string;
  patientId: string;
  requestedDataTypes: DataType[];
  purpose: string;
  accessLevel: 'read' | 'read_write';
  requestedAt: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  expirationDays?: number;
}

export interface SharedDataPackage {
  id: string;
  consentId: string;
  patientId: string;
  providerId: string;
  dataTypes: DataType[];
  data: any;
  sharedAt: string;
  accessedAt?: string;
  encryptionKey: string;
}

class ConsentService {
  private static instance: ConsentService;
  private consentRecords: Map<string, ConsentRecord> = new Map();
  private accessRequests: Map<string, DataAccessRequest> = new Map();
  private auditLog: ConsentAuditEntry[] = [];

  private constructor() {
    this.initializeMockData();
  }

  static getInstance(): ConsentService {
    if (!ConsentService.instance) {
      ConsentService.instance = new ConsentService();
    }
    return ConsentService.instance;
  }

  // Initialize with mock data for demo
  private initializeMockData(): void {
    const mockConsent: ConsentRecord = {
      id: 'consent_1',
      patientId: 'patient_123',
      providerId: 'doctor_456',
      dataTypes: [
        {
          category: 'exercise_data',
          subcategories: ['workout_sessions', 'form_analysis', 'progress_metrics'],
          description: 'Exercise performance and form analysis data'
        },
        {
          category: 'health_metrics',
          subcategories: ['heart_rate', 'calories_burned', 'duration'],
          description: 'Health metrics collected during exercise'
        }
      ],
      status: 'active',
      grantedAt: '2024-12-01T10:00:00Z',
      expiresAt: '2025-06-01T10:00:00Z',
      purpose: 'Monitor rehabilitation progress and adjust exercise prescription',
      accessLevel: 'read_write',
      auditTrail: [
        {
          id: 'audit_1',
          action: 'granted',
          timestamp: '2024-12-01T10:00:00Z',
          userId: 'patient_123',
          userType: 'patient',
          details: 'Initial consent granted for exercise data sharing'
        }
      ]
    };

    this.consentRecords.set(mockConsent.id, mockConsent);
  }

  // Request consent from patient
  async requestConsent(request: Omit<DataAccessRequest, 'id' | 'requestedAt' | 'status'>): Promise<DataAccessRequest> {
    const accessRequest: DataAccessRequest = {
      ...request,
      id: `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requestedAt: new Date().toISOString(),
      status: 'pending'
    };

    this.accessRequests.set(accessRequest.id, accessRequest);

    // Log the request
    this.addAuditEntry({
      action: 'granted',
      userId: request.providerId,
      userType: 'provider',
      details: `Consent requested for: ${request.purpose}`
    });

    console.log('📋 Consent request created:', accessRequest);
    return accessRequest;
  }

  // Grant consent (patient action)
  async grantConsent(
    requestId: string, 
    patientId: string, 
    expirationDays?: number
  ): Promise<ConsentRecord> {
    const request = this.accessRequests.get(requestId);
    if (!request) {
      throw new Error('Access request not found');
    }

    if (request.patientId !== patientId) {
      throw new Error('Unauthorized: Patient ID mismatch');
    }

    const consent: ConsentRecord = {
      id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patientId: request.patientId,
      providerId: request.providerId,
      dataTypes: request.requestedDataTypes,
      status: 'active',
      grantedAt: new Date().toISOString(),
      expiresAt: expirationDays ? 
        new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString() : 
        undefined,
      purpose: request.purpose,
      accessLevel: request.accessLevel,
      auditTrail: []
    };

    // Update request status
    request.status = 'approved';
    this.accessRequests.set(requestId, request);

    // Store consent
    this.consentRecords.set(consent.id, consent);

    // Add audit entry
    this.addAuditEntry({
      action: 'granted',
      userId: patientId,
      userType: 'patient',
      details: `Consent granted to provider ${request.providerId}`
    });

    console.log('✅ Consent granted:', consent);
    return consent;
  }

  // Revoke consent (patient action)
  async revokeConsent(consentId: string, patientId: string, reason?: string): Promise<void> {
    const consent = this.consentRecords.get(consentId);
    if (!consent) {
      throw new Error('Consent record not found');
    }

    if (consent.patientId !== patientId) {
      throw new Error('Unauthorized: Patient ID mismatch');
    }

    consent.status = 'revoked';
    consent.revokedAt = new Date().toISOString();

    this.consentRecords.set(consentId, consent);

    // Add audit entry
    this.addAuditEntry({
      action: 'revoked',
      userId: patientId,
      userType: 'patient',
      details: `Consent revoked. Reason: ${reason || 'No reason provided'}`
    });

    console.log('🚫 Consent revoked:', consentId);
  }

  // Check if provider has access to specific data
  async checkAccess(
    providerId: string, 
    patientId: string, 
    dataCategory: string
  ): Promise<{ hasAccess: boolean; consentId?: string; accessLevel?: string }> {
    const activeConsents = Array.from(this.consentRecords.values()).filter(
      consent => 
        consent.providerId === providerId &&
        consent.patientId === patientId &&
        consent.status === 'active' &&
        (!consent.expiresAt || new Date(consent.expiresAt) > new Date())
    );

    for (const consent of activeConsents) {
      const hasDataType = consent.dataTypes.some(
        dataType => dataType.category === dataCategory
      );

      if (hasDataType) {
        return {
          hasAccess: true,
          consentId: consent.id,
          accessLevel: consent.accessLevel
        };
      }
    }

    return { hasAccess: false };
  }

  // Get patient's consent records
  async getPatientConsents(patientId: string): Promise<ConsentRecord[]> {
    return Array.from(this.consentRecords.values()).filter(
      consent => consent.patientId === patientId
    );
  }

  // Get provider's access records
  async getProviderAccess(providerId: string): Promise<ConsentRecord[]> {
    return Array.from(this.consentRecords.values()).filter(
      consent => consent.providerId === providerId && consent.status === 'active'
    );
  }

  // Share data with provider (with consent verification)
  async shareData(
    patientId: string,
    providerId: string,
    dataCategory: string,
    data: any
  ): Promise<SharedDataPackage> {
    const accessCheck = await this.checkAccess(providerId, patientId, dataCategory);
    
    if (!accessCheck.hasAccess) {
      throw new Error('Access denied: No valid consent for this data type');
    }

    // Encrypt data (simplified for demo)
    const encryptionKey = this.generateEncryptionKey();
    const encryptedData = this.encryptData(data, encryptionKey);

    const sharedPackage: SharedDataPackage = {
      id: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      consentId: accessCheck.consentId!,
      patientId,
      providerId,
      dataTypes: [{ 
        category: dataCategory as any, 
        subcategories: [], 
        description: `Shared ${dataCategory} data` 
      }],
      data: encryptedData,
      sharedAt: new Date().toISOString(),
      encryptionKey
    };

    // Add audit entry
    this.addAuditEntry({
      action: 'accessed',
      userId: providerId,
      userType: 'provider',
      details: `Data shared: ${dataCategory}`
    });

    console.log('📤 Data shared with provider:', sharedPackage.id);
    return sharedPackage;
  }

  // Get audit trail for a patient
  async getAuditTrail(patientId: string): Promise<ConsentAuditEntry[]> {
    return this.auditLog.filter(entry => 
      // Filter entries related to this patient's consents
      Array.from(this.consentRecords.values()).some(consent => 
        consent.patientId === patientId && 
        (entry.userId === patientId || entry.userId === consent.providerId)
      )
    );
  }

  // Get pending access requests for a patient
  async getPendingRequests(patientId: string): Promise<DataAccessRequest[]> {
    return Array.from(this.accessRequests.values()).filter(
      request => request.patientId === patientId && request.status === 'pending'
    );
  }

  // Deny access request
  async denyRequest(requestId: string, patientId: string, reason?: string): Promise<void> {
    const request = this.accessRequests.get(requestId);
    if (!request) {
      throw new Error('Access request not found');
    }

    if (request.patientId !== patientId) {
      throw new Error('Unauthorized: Patient ID mismatch');
    }

    request.status = 'denied';
    this.accessRequests.set(requestId, request);

    // Add audit entry
    this.addAuditEntry({
      action: 'granted', // Using 'granted' action type but with denial details
      userId: patientId,
      userType: 'patient',
      details: `Access request denied. Reason: ${reason || 'No reason provided'}`
    });

    console.log('❌ Access request denied:', requestId);
  }

  // Helper methods
  private addAuditEntry(entry: Omit<ConsentAuditEntry, 'id' | 'timestamp'>): void {
    const auditEntry: ConsentAuditEntry = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    this.auditLog.push(auditEntry);

    // Also add to relevant consent records
    this.consentRecords.forEach(consent => {
      if (consent.patientId === entry.userId || consent.providerId === entry.userId) {
        consent.auditTrail.push(auditEntry);
      }
    });
  }

  private generateEncryptionKey(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  private encryptData(data: any, key: string): string {
    // Simplified encryption for demo - in production use proper encryption
    const jsonData = JSON.stringify(data);
    return Buffer.from(jsonData).toString('base64');
  }

  private decryptData(encryptedData: string, key: string): any {
    // Simplified decryption for demo
    const jsonData = Buffer.from(encryptedData, 'base64').toString();
    return JSON.parse(jsonData);
  }

  // Clean up expired consents
  async cleanupExpiredConsents(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;

    this.consentRecords.forEach((consent, id) => {
      if (consent.expiresAt && new Date(consent.expiresAt) < now && consent.status === 'active') {
        consent.status = 'expired';
        this.consentRecords.set(id, consent);
        cleanedCount++;

        this.addAuditEntry({
          action: 'revoked',
          userId: 'system',
          userType: 'patient',
          details: 'Consent expired automatically'
        });
      }
    });

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired consents`);
    }

    return cleanedCount;
  }

  // Get consent statistics
  getConsentStats(): {
    total: number;
    active: number;
    expired: number;
    revoked: number;
  } {
    const consents = Array.from(this.consentRecords.values());
    
    return {
      total: consents.length,
      active: consents.filter(c => c.status === 'active').length,
      expired: consents.filter(c => c.status === 'expired').length,
      revoked: consents.filter(c => c.status === 'revoked').length
    };
  }
}

export const consentService = ConsentService.getInstance();
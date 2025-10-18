// Mock API Service for Development and Testing
import { config } from '../config/environment';
import { monitoringService } from './monitoringService';

export interface MockApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

class MockApiService {
  private static instance: MockApiService;
  private isEnabled: boolean;

  private constructor() {
    // Enable mock API in development mode or when backend is not available
    this.isEnabled = config.DEBUG_MODE || config.API_BASE_URL.includes('localhost');
    
    if (this.isEnabled) {
      monitoringService.logInfo('mock_api', 'Mock API service enabled for development');
    }
  }

  static getInstance(): MockApiService {
    if (!MockApiService.instance) {
      MockApiService.instance = new MockApiService();
    }
    return MockApiService.instance;
  }

  // Simulate network delay
  private async simulateDelay(min: number = 100, max: number = 500): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Mock health check endpoint
  async healthCheck(): Promise<MockApiResponse> {
    if (!this.isEnabled) {
      return { success: false, error: 'Mock API disabled', status: 404 };
    }

    await this.simulateDelay(50, 200);
    
    return {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: 'development'
      },
      status: 200
    };
  }

  // Mock prescription endpoints
  async getProviderPrescriptions(providerId: string): Promise<MockApiResponse> {
    if (!this.isEnabled) {
      return { success: false, error: 'Mock API disabled', status: 404 };
    }

    await this.simulateDelay();

    // Return mock prescription data
    const mockPrescriptions = [
      {
        id: `prescription_${providerId}_1`,
        patientId: 'patient_1',
        providerId,
        title: 'Knee Rehabilitation Program',
        description: 'Post-surgery knee rehabilitation exercises',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startDate: new Date().toISOString(),
        exercises: [],
        goals: [],
        restrictions: [],
        progressTracking: [],
        notes: 'Mock prescription for development',
        reviewSchedule: {
          frequency: 'weekly',
          nextReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    ];

    return {
      success: true,
      data: mockPrescriptions,
      status: 200
    };
  }

  async getPatientPrescriptions(patientId: string): Promise<MockApiResponse> {
    if (!this.isEnabled) {
      return { success: false, error: 'Mock API disabled', status: 404 };
    }

    await this.simulateDelay();

    return {
      success: true,
      data: [],
      status: 200
    };
  }

  async createPrescription(prescriptionData: any): Promise<MockApiResponse> {
    if (!this.isEnabled) {
      return { success: false, error: 'Mock API disabled', status: 404 };
    }

    await this.simulateDelay(200, 800);

    const newPrescription = {
      id: `prescription_${Date.now()}`,
      ...prescriptionData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft'
    };

    return {
      success: true,
      data: newPrescription,
      status: 201
    };
  }

  async updatePrescription(prescriptionId: string, updates: any): Promise<MockApiResponse> {
    if (!this.isEnabled) {
      return { success: false, error: 'Mock API disabled', status: 404 };
    }

    await this.simulateDelay();

    return {
      success: true,
      data: {
        id: prescriptionId,
        ...updates,
        updatedAt: new Date().toISOString()
      },
      status: 200
    };
  }

  // Mock patient endpoints
  async getPatients(providerId: string): Promise<MockApiResponse> {
    if (!this.isEnabled) {
      return { success: false, error: 'Mock API disabled', status: 404 };
    }

    await this.simulateDelay();

    const mockPatients = [
      {
        id: 'patient_1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+1-555-0123',
        dateOfBirth: '1985-03-15',
        medicalConditions: ['knee_injury'],
        providerId
      },
      {
        id: 'patient_2',
        name: 'Michael Chen',
        email: 'michael.chen@email.com',
        phone: '+1-555-0124',
        dateOfBirth: '1978-07-22',
        medicalConditions: ['back_pain'],
        providerId
      }
    ];

    return {
      success: true,
      data: mockPatients,
      status: 200
    };
  }

  // Mock exercise session endpoints
  async getExerciseSessions(patientId: string): Promise<MockApiResponse> {
    if (!this.isEnabled) {
      return { success: false, error: 'Mock API disabled', status: 404 };
    }

    await this.simulateDelay();

    const mockSessions = [
      {
        id: 'session_1',
        patientId,
        exerciseType: 'Squats',
        date: new Date().toISOString(),
        duration: 15,
        accuracy: 85,
        totalReps: 20,
        formScore: 82,
        recommendations: ['Keep knees aligned', 'Slower descent phase']
      }
    ];

    return {
      success: true,
      data: mockSessions,
      status: 200
    };
  }

  // Check if mock API should handle a request
  shouldHandleRequest(endpoint: string): boolean {
    return this.isEnabled && (
      config.API_BASE_URL.includes('localhost') ||
      config.DEBUG_MODE
    );
  }

  // Get mock response for any endpoint
  async getMockResponse(endpoint: string, method: string = 'GET', body?: any): Promise<MockApiResponse | null> {
    if (!this.shouldHandleRequest(endpoint)) {
      return null;
    }

    monitoringService.logInfo('mock_api', 'Handling mock request', { endpoint, method });

    // Route to appropriate mock handler
    if (endpoint === '/health') {
      return this.healthCheck();
    }

    if (endpoint.startsWith('/prescriptions/provider/')) {
      const providerId = endpoint.split('/').pop();
      return this.getProviderPrescriptions(providerId!);
    }

    if (endpoint.startsWith('/prescriptions/patient/')) {
      const patientId = endpoint.split('/').pop();
      return this.getPatientPrescriptions(patientId!);
    }

    if (endpoint === '/prescriptions' && method === 'POST') {
      return this.createPrescription(body);
    }

    if (endpoint.startsWith('/patients/provider/')) {
      const providerId = endpoint.split('/').pop();
      return this.getPatients(providerId!);
    }

    if (endpoint.startsWith('/exercise-sessions/patient/')) {
      const patientId = endpoint.split('/').pop();
      return this.getExerciseSessions(patientId!);
    }

    // Default mock response for unhandled endpoints
    await this.simulateDelay(100, 300);
    return {
      success: false,
      error: `Mock endpoint not implemented: ${endpoint}`,
      status: 404
    };
  }
}

export const mockApiService = MockApiService.getInstance();
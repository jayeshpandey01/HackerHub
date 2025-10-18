// Simplified Authentication Service
interface LoginCredentials {
  email: string;
  password: string;
  userType: 'doctor' | 'patient';
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'doctor' | 'patient';
  specialization?: string[];
  patientType?: string[];
}

class SimpleAuthService {
  // Demo credentials
  private demoCredentials = {
    doctor: { email: 'doctor@demo.com', password: 'demo123' },
    patient: { email: 'patient@demo.com', password: 'demo123' }
  };

  async login(email: string, password: string, userType: 'doctor' | 'patient'): Promise<User> {
    console.log('SimpleAuthService: Login attempt', { email, userType });
    
    // Validate credentials
    const validCredentials = this.demoCredentials[userType];
    if (email !== validCredentials.email || password !== validCredentials.password) {
      throw new Error('Invalid credentials');
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return user data
    const user: User = {
      id: `${userType}_${Date.now()}`,
      email,
      firstName: userType === 'doctor' ? 'Dr. John' : 'Jane',
      lastName: userType === 'doctor' ? 'Smith' : 'Doe',
      userType,
      specialization: userType === 'doctor' ? ['general_practice'] : undefined,
      patientType: userType === 'patient' ? ['general_wellness'] : undefined
    };

    console.log('SimpleAuthService: Login successful', user);
    return user;
  }

  async register(formData: any, userType: 'doctor' | 'patient'): Promise<User> {
    console.log('SimpleAuthService: Register attempt', { email: formData.email, userType });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return user data
    const user: User = {
      id: `${userType}_${Date.now()}`,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      userType,
      specialization: userType === 'doctor' ? ['general_practice'] : undefined,
      patientType: userType === 'patient' ? ['general_wellness'] : undefined
    };

    console.log('SimpleAuthService: Registration successful', user);
    return user;
  }
}

export const authService = new SimpleAuthService();
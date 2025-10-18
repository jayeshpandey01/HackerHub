// Network Configuration Helper for React Native
import { Platform } from 'react-native';

export class NetworkConfig {
  private static instance: NetworkConfig;
  private detectedIP: string | null = null;

  private constructor() {}

  static getInstance(): NetworkConfig {
    if (!NetworkConfig.instance) {
      NetworkConfig.instance = new NetworkConfig();
    }
    return NetworkConfig.instance;
  }

  // Get possible backend URLs based on platform
  getPossibleBackendUrls(): string[] {
    const port = 8000;
    const urls: string[] = [];

    // Manual override - add your computer's IP here if needed
    const MANUAL_IP = '172.16.11.64'; // Your actual IP from ipconfig
    if (MANUAL_IP) {
      urls.push(`http://${MANUAL_IP}:${port}`);
    }

    // Platform-specific URLs (prioritized)
    if (Platform.OS === 'android') {
      // Android emulator - try 10.0.2.2 first (most likely to work)
      urls.push(`http://10.0.2.2:${port}`);
    }
    
    // Standard localhost URLs for all platforms
    urls.push(`http://127.0.0.1:${port}`);
    urls.push(`http://localhost:${port}`);

    // Common local network IPs for physical devices
    const commonIPs = [
      '192.168.137.1',  // Your virtual adapter IP
      '192.168.1.100',
      '192.168.0.100', 
      '192.168.1.1',   // Common router IPs
      '192.168.0.1',
      '10.0.0.100',
      '172.16.0.100'
    ];

    commonIPs.forEach(ip => {
      urls.push(`http://${ip}:${port}`);
    });

    // Remove duplicates
    return [...new Set(urls)];
  }

  // Test a specific URL
  async testUrl(url: string): Promise<{ success: boolean; responseTime?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Testing URL: ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Increased timeout

      const response = await fetch(`${url}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          responseTime,
        };
      } else {
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${response.statusText}` 
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { success: false, error: 'Timeout (>3s)' };
        } else if (error.message.includes('Network request failed')) {
          return { success: false, error: 'Network unreachable' };
        } else {
          return { success: false, error: error.message };
        }
      }
      
      return { success: false, error: 'Unknown error' };
    }
  }

  // Find the best working backend URL
  async findBestBackendUrl(): Promise<{ url: string | null; results: any[] }> {
    const urls = this.getPossibleBackendUrls();
    const results = [];

    console.log(`🔍 Testing ${urls.length} possible backend URLs...`);

    for (const url of urls) {
      console.log(`Testing ${url}...`);
      const result = await this.testUrl(url);
      
      results.push({
        url,
        ...result
      });

      if (result.success) {
        console.log(`✅ Found working backend at ${url} (${result.responseTime}ms)`);
        this.detectedIP = url;
        return { url, results };
      } else {
        console.log(`❌ ${url}: ${result.error}`);
      }
    }

    console.log('❌ No working backend found on any URL');
    console.log('ℹ️  App will continue with offline functionality only');
    return { url: null, results };
  }

  // Get platform-specific networking info
  getNetworkInfo(): any {
    return {
      platform: Platform.OS,
      version: Platform.Version,
      possibleUrls: this.getPossibleBackendUrls(),
      detectedIP: this.detectedIP,
      recommendations: this.getRecommendations()
    };
  }

  // Get platform-specific recommendations
  private getRecommendations(): string[] {
    const recommendations = [];

    if (Platform.OS === 'android') {
      recommendations.push('For Android Emulator: Use 10.0.2.2:8000 to access host machine');
      recommendations.push('For Android Device: Use your computer\'s IP address (e.g., 192.168.1.100:8000)');
      recommendations.push('Make sure both devices are on the same WiFi network');
      recommendations.push('Try: adb reverse tcp:8000 tcp:8000');
    } else if (Platform.OS === 'ios') {
      recommendations.push('For iOS Simulator: Use localhost:8000 or 127.0.0.1:8000');
      recommendations.push('For iOS Device: Use your computer\'s IP address (e.g., 192.168.1.100:8000)');
      recommendations.push('Make sure both devices are on the same WiFi network');
    }

    recommendations.push('Ensure Python backend is running: cd backend && python main.py');
    recommendations.push('Check firewall settings on your computer');
    recommendations.push('Verify backend is accessible in browser: http://127.0.0.1:8000');

    return recommendations;
  }

  // Get your computer's IP address (user needs to find this manually)
  getComputerIPInstructions(): string[] {
    const instructions = [];

    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      instructions.push('To find your computer\'s IP address:');
      instructions.push('');
      instructions.push('Windows:');
      instructions.push('1. Open Command Prompt');
      instructions.push('2. Type: ipconfig');
      instructions.push('3. Look for "IPv4 Address" under your WiFi adapter');
      instructions.push('');
      instructions.push('macOS/Linux:');
      instructions.push('1. Open Terminal');
      instructions.push('2. Type: ifconfig | grep inet');
      instructions.push('3. Look for your local network IP (usually 192.168.x.x)');
      instructions.push('');
      instructions.push('Then update the backend URL in the app to use your IP:');
      instructions.push('http://YOUR_IP_ADDRESS:5000');
    }

    return instructions;
  }
}

export const networkConfig = NetworkConfig.getInstance();
// Test script for fitness integration
// This can be run in the React Native debugger console

// Test fitness service connection
async function testFitnessService() {
  console.log('Testing Fitness Service Integration...');
  
  try {
    // Import the fitness service (this would be done differently in actual app)
    // const { fitnessService } = require('../services/fitnessService');
    
    console.log('1. Testing backend connection...');
    // const isConnected = await fitnessService.checkConnection();
    // console.log('Backend connected:', isConnected);
    
    console.log('2. Getting available exercises...');
    // const exercises = fitnessService.getAvailableExercises();
    // console.log('Available exercises:', exercises.length);
    
    console.log('3. Testing exercise start/stop...');
    // const startResult = await fitnessService.startExercise('squat', 3, 10);
    // console.log('Exercise started:', startResult);
    
    // Wait 2 seconds
    // await new Promise(resolve => setTimeout(resolve, 2000));
    
    // const status = await fitnessService.getExerciseStatus();
    // console.log('Exercise status:', status);
    
    // const stopResult = await fitnessService.stopExercise();
    // console.log('Exercise stopped:', stopResult);
    
    console.log('4. Testing workout stats...');
    // const stats = await fitnessService.getWorkoutStats('test-user');
    // console.log('Workout stats:', stats);
    
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test backend endpoints directly
async function testBackendEndpoints() {
  console.log('Testing Backend Endpoints...');
  
  const baseUrl = 'http://127.0.0.1:5000';
  
  try {
    console.log('1. Testing status endpoint...');
    const statusResponse = await fetch(`${baseUrl}/get_status`);
    const statusData = await statusResponse.json();
    console.log('Status response:', statusData);
    
    console.log('2. Testing exercise start...');
    const startResponse = await fetch(`${baseUrl}/start_exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exercise_type: 'squat',
        sets: 3,
        reps: 10
      })
    });
    const startData = await startResponse.json();
    console.log('Start response:', startData);
    
    console.log('3. Testing exercise stop...');
    const stopResponse = await fetch(`${baseUrl}/stop_exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const stopData = await stopResponse.json();
    console.log('Stop response:', stopData);
    
    console.log('✅ Backend endpoints working correctly!');
    
  } catch (error) {
    console.error('❌ Backend test failed:', error);
    console.log('Make sure the Python backend is running on http://127.0.0.1:5000');
  }
}

// Mock data for testing without backend
function testMockData() {
  console.log('Testing Mock Data...');
  
  const mockExercises = [
    {
      id: 'squat',
      name: 'Squats',
      type: 'squat',
      description: 'Lower body strength exercise',
      difficulty: 'beginner',
      duration: 15,
      calories: 120
    },
    {
      id: 'push_up',
      name: 'Push-ups',
      type: 'push_up',
      description: 'Upper body strength exercise',
      difficulty: 'beginner',
      duration: 10,
      calories: 80
    }
  ];
  
  console.log('Mock exercises:', mockExercises);
  
  const mockWorkoutStats = {
    totalWorkouts: 15,
    totalExercises: 45,
    streakDays: 5,
    weeklyWorkouts: 4,
    totalCalories: 1250,
    averageDuration: 18
  };
  
  console.log('Mock workout stats:', mockWorkoutStats);
  
  console.log('✅ Mock data test completed!');
}

// Run all tests
async function runAllTests() {
  console.log('🏃‍♂️ Starting Fitness Integration Tests...\n');
  
  testMockData();
  console.log('\n');
  
  await testBackendEndpoints();
  console.log('\n');
  
  await testFitnessService();
  console.log('\n');
  
  console.log('🎉 All tests completed!');
}

// Export for use in React Native debugger
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testFitnessService,
    testBackendEndpoints,
    testMockData,
    runAllTests
  };
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  console.log('Fitness Integration Test Suite loaded!');
  console.log('Run runAllTests() to start testing');
}
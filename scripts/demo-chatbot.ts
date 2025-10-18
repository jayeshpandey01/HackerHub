/**
 * AI Health Chatbot Demo Script
 * 
 * This script demonstrates the chatbot functionality and can be used for testing
 * the AI responses without running the full mobile app.
 */

import { HuggingFaceService } from '../services/huggingFaceService';

// Mock user data for testing
const mockUserData = {
  id: 'demo-user-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  userType: 'patient' as const,
};

const mockMedicalProfile = {
  userId: 'demo-user-123',
  diseases: ['hypertension', 'diabetes_type2'],
  allergies: ['penicillin'],
  medications: ['metformin', 'lisinopril'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Demo conversation scenarios
const demoQuestions = [
  "I have a headache, what should I do?",
  "What exercises are good for someone with diabetes?",
  "Can you explain my blood pressure readings?",
  "I'm feeling anxious lately, any tips?",
  "What foods should I avoid with my condition?",
  "How often should I check my blood sugar?",
  "I forgot to take my medication, what should I do?",
  "What are the side effects of metformin?",
  "I want to start exercising, where should I begin?",
  "How can I improve my sleep quality?",
];

async function runChatbotDemo() {
  console.log('🤖 AI Health Chatbot Demo');
  console.log('=' .repeat(50));
  
  const huggingFaceService = new HuggingFaceService();
  
  // Create context for the AI
  const context = `
Patient Information:
- Name: ${mockUserData.firstName} ${mockUserData.lastName}
- Medical Profile: ${JSON.stringify(mockMedicalProfile)}
- User Type: ${mockUserData.userType}

Please provide helpful, accurate health information. Always recommend consulting healthcare professionals for serious concerns.
  `;

  console.log('👤 User Profile:');
  console.log(`   Name: ${mockUserData.firstName} ${mockUserData.lastName}`);
  console.log(`   Conditions: ${mockMedicalProfile.diseases.join(', ')}`);
  console.log(`   Medications: ${mockMedicalProfile.medications.join(', ')}`);
  console.log('');

  // Test each demo question
  for (let i = 0; i < demoQuestions.length; i++) {
    const question = demoQuestions[i];
    
    console.log(`💬 Question ${i + 1}: "${question}"`);
    console.log('🤖 AI Response:');
    
    try {
      const response = await huggingFaceService.generateHealthResponse(question, context);
      console.log(`   ${response}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }
    
    console.log('');
    
    // Add delay between requests to respect rate limits
    if (i < demoQuestions.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('✅ Demo completed!');
  console.log('');
  console.log('📝 Notes:');
  console.log('- Responses are generated using keyword-based intelligence');
  console.log('- For enhanced AI responses, add your Hugging Face API key');
  console.log('- All responses include appropriate medical disclaimers');
  console.log('- The chatbot encourages professional medical consultation');
}

// Test keyword extraction
function testKeywordExtraction() {
  console.log('🔍 Keyword Extraction Test');
  console.log('=' .repeat(30));
  
  const huggingFaceService = new HuggingFaceService();
  
  const testMessages = [
    "I have a severe headache and feel dizzy",
    "What's my ideal heart rate during exercise?",
    "I need help with my diabetes medication",
    "Feeling stressed and can't sleep well",
    "Want to start a healthy diet plan",
  ];

  testMessages.forEach((message, index) => {
    console.log(`${index + 1}. "${message}"`);
    // Note: extractHealthKeywords is private, so we'll test through generateHealthResponse
    console.log('   Keywords would be extracted and processed...');
  });
  
  console.log('');
}

// Test available models
function showAvailableModels() {
  console.log('🧠 Available AI Models');
  console.log('=' .repeat(25));
  
  const huggingFaceService = new HuggingFaceService();
  const models = huggingFaceService.getAvailableModels();
  
  models.forEach((model, index) => {
    console.log(`${index + 1}. ${model}`);
  });
  
  console.log('');
  console.log('💡 Tip: All models are free to use with Hugging Face account');
  console.log('');
}

// Main demo function
async function main() {
  console.clear();
  
  try {
    // Show available models
    showAvailableModels();
    
    // Test keyword extraction
    testKeywordExtraction();
    
    // Run full demo
    await runChatbotDemo();
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Export for use in other scripts
export {
  runChatbotDemo,
  testKeywordExtraction,
  showAvailableModels,
  mockUserData,
  mockMedicalProfile,
  demoQuestions,
};

// Run demo if this file is executed directly
if (require.main === module) {
  main();
}
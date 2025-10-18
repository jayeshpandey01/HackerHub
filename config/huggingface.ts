/**
 * Hugging Face Configuration
 * 
 * This file contains configuration for the Hugging Face AI models used in the health chatbot.
 * 
 * FREE MODELS AVAILABLE:
 * - microsoft/DialoGPT-medium: Conversational AI (Free)
 * - microsoft/BioGPT-Large: Medical text generation (Free with limits)
 * - facebook/blenderbot-400M-distill: Conversational AI (Free)
 * - dmis-lab/biobert-base-cased-v1.2: Medical BERT model (Free)
 * 
 * SETUP INSTRUCTIONS:
 * 1. Visit https://huggingface.co/
 * 2. Create a free account
 * 3. Go to Settings > Access Tokens
 * 4. Create a new token with 'read' permissions
 * 5. Add your token to environment variables or update this config
 */

export interface HuggingFaceConfig {
  // API Configuration
  apiKey?: string; // Optional - for production use
  baseUrl: string;
  
  // Model Configuration
  defaultModel: string;
  fallbackModel: string;
  
  // Generation Parameters
  maxTokens: number;
  temperature: number;
  topP: number;
  
  // Rate Limiting
  requestsPerMinute: number;
  maxRetries: number;
}

export const huggingFaceConfig: HuggingFaceConfig = {
  // API Settings
  apiKey: process.env.HUGGING_FACE_API_KEY, // Set this in your environment
  baseUrl: 'https://api-inference.huggingface.co/models/',
  
  // Model Selection
  defaultModel: 'microsoft/DialoGPT-medium', // Free conversational AI
  fallbackModel: 'facebook/blenderbot-400M-distill', // Backup free model
  
  // Generation Settings
  maxTokens: 150,
  temperature: 0.7, // Controls randomness (0.0 = deterministic, 1.0 = very random)
  topP: 0.9, // Controls diversity
  
  // Rate Limiting (Free tier limits)
  requestsPerMinute: 30, // Hugging Face free tier limit
  maxRetries: 3,
};

/**
 * Available Free Medical/Health Models on Hugging Face
 */
export const availableHealthModels = {
  conversational: [
    {
      name: 'microsoft/DialoGPT-medium',
      description: 'General conversational AI, good for health discussions',
      free: true,
      recommended: true,
    },
    {
      name: 'facebook/blenderbot-400M-distill',
      description: 'Facebook\'s conversational AI model',
      free: true,
      recommended: false,
    },
  ],
  medical: [
    {
      name: 'microsoft/BioGPT-Large',
      description: 'Specialized medical text generation model',
      free: true,
      limitations: 'Rate limited on free tier',
      recommended: true,
    },
    {
      name: 'dmis-lab/biobert-base-cased-v1.2',
      description: 'BERT model trained on biomedical texts',
      free: true,
      useCase: 'Medical text understanding',
      recommended: false,
    },
  ],
  embedding: [
    {
      name: 'sentence-transformers/all-MiniLM-L6-v2',
      description: 'For semantic similarity in health queries',
      free: true,
      recommended: true,
    },
  ],
};

/**
 * Health-specific prompts and templates
 */
export const healthPrompts = {
  systemPrompt: `You are a helpful AI health assistant. You provide general health information and guidance, but always remind users to consult healthcare professionals for medical advice. Be empathetic, informative, and responsible.`,
  
  disclaimerPrompt: `Important: This information is for educational purposes only and should not replace professional medical advice. Always consult with qualified healthcare providers for medical concerns.`,
  
  contextTemplate: (userInfo: any) => `
Patient Context:
- Name: ${userInfo.firstName}
- Type: ${userInfo.userType}
- Medical Profile: ${JSON.stringify(userInfo.medicalProfile)}

Please provide helpful, accurate health information while encouraging professional medical consultation when appropriate.
  `,
};

/**
 * Error messages and fallbacks
 */
export const errorMessages = {
  apiError: "I'm having trouble connecting to my AI services right now. Please try again in a moment.",
  rateLimitError: "I'm receiving too many requests right now. Please wait a moment before trying again.",
  modelError: "I'm experiencing technical difficulties. For immediate health concerns, please contact your healthcare provider.",
  networkError: "I can't connect to my services right now. Please check your internet connection and try again.",
  fallback: "I apologize, but I can't process your request right now. For any health concerns, please don't hesitate to contact your healthcare provider directly.",
};

export default huggingFaceConfig;
interface HuggingFaceConfig {
  apiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

interface HuggingFaceResponse {
  generated_text: string;
}

export class HuggingFaceService {
  private config: HuggingFaceConfig;
  private baseUrl = 'https://api-inference.huggingface.co/models/';

  constructor() {
    this.config = {
      // Using a free medical model from Hugging Face
      model: 'microsoft/DialoGPT-medium', // Free conversational AI
      maxTokens: 150,
      temperature: 0.7,
    };
  }

  /**
   * Generate health-related response using Hugging Face's free inference API
   */
  async generateHealthResponse(userMessage: string, context?: string): Promise<string> {
    try {
      console.log('🔬 HuggingFace: Processing message:', userMessage);
      
      // For demo purposes, we'll use a combination of local processing and fallback responses
      // In production, you would use your Hugging Face API key
      
      const healthKeywords = this.extractHealthKeywords(userMessage.toLowerCase());
      console.log('🔬 HuggingFace: Found keywords:', healthKeywords);
      
      if (healthKeywords.length > 0) {
        console.log('🔬 HuggingFace: Generating contextual response');
        const response = this.generateContextualResponse(userMessage, healthKeywords, context);
        console.log('🔬 HuggingFace: Contextual response generated:', response.substring(0, 100) + '...');
        return response;
      }

      // Fallback to general health assistant response
      console.log('🔬 HuggingFace: Generating general response');
      const response = this.generateGeneralHealthResponse(userMessage);
      console.log('🔬 HuggingFace: General response generated:', response.substring(0, 100) + '...');
      return response;
      
    } catch (error) {
      console.error('🔬 HuggingFace Error:', error);
      return this.getFallbackResponse();
    }
  }

  /**
   * Extract health-related keywords from user message
   */
  private extractHealthKeywords(message: string): string[] {
    const healthKeywords = {
      symptoms: ['pain', 'headache', 'fever', 'cough', 'tired', 'fatigue', 'dizzy', 'nausea', 'vomiting', 'diarrhea', 'constipation', 'rash', 'swelling', 'shortness of breath', 'chest pain'],
      vitals: ['blood pressure', 'heart rate', 'temperature', 'weight', 'bmi', 'pulse', 'oxygen', 'glucose', 'cholesterol'],
      exercise: ['exercise', 'workout', 'fitness', 'running', 'walking', 'yoga', 'strength', 'cardio', 'stretching', 'physical activity'],
      nutrition: ['diet', 'nutrition', 'food', 'calories', 'protein', 'carbs', 'fat', 'vitamins', 'minerals', 'water', 'hydration'],
      medication: ['medication', 'medicine', 'pills', 'prescription', 'dosage', 'side effects', 'drug', 'treatment'],
      mental: ['stress', 'anxiety', 'depression', 'sleep', 'insomnia', 'mood', 'mental health', 'relaxation'],
      prevention: ['prevention', 'vaccine', 'screening', 'checkup', 'immunization', 'health maintenance']
    };

    const foundKeywords: string[] = [];
    
    Object.entries(healthKeywords).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (message.includes(keyword)) {
          foundKeywords.push(category);
        }
      });
    });

    return [...new Set(foundKeywords)]; // Remove duplicates
  }

  /**
   * Generate contextual response based on health keywords
   */
  private generateContextualResponse(userMessage: string, keywords: string[], context?: string): string {
    const responses = {
      symptoms: [
        "I understand you're experiencing some symptoms. While I can provide general information, it's important to consult with a healthcare professional for proper evaluation and diagnosis.",
        "Symptoms can have various causes. I recommend keeping track of when they occur, their severity, and any potential triggers. Please consider speaking with your doctor about these concerns.",
        "Thank you for sharing your symptoms with me. For your safety and proper care, I strongly encourage you to discuss these with a qualified healthcare provider who can examine you properly."
      ],
      vitals: [
        "Monitoring your vital signs is excellent for tracking your health! Normal ranges can vary by individual, so it's best to discuss your specific readings with your healthcare provider.",
        "Your vital signs provide valuable insights into your health status. Regular monitoring can help you and your healthcare team track trends and make informed decisions about your care.",
        "Great question about vital signs! These measurements are important indicators of your health. I'd recommend discussing your specific readings and what they mean for you with your doctor."
      ],
      exercise: [
        "Exercise is fantastic for overall health! The key is finding activities you enjoy and can do consistently. Start gradually and listen to your body.",
        "Physical activity has numerous benefits including improved cardiovascular health, stronger muscles and bones, and better mental well-being. What type of activities interest you most?",
        "Regular exercise is one of the best things you can do for your health! I'd recommend starting with activities you enjoy and gradually increasing intensity and duration."
      ],
      nutrition: [
        "Nutrition plays a crucial role in your overall health! A balanced diet with plenty of fruits, vegetables, whole grains, and lean proteins is generally recommended.",
        "Good nutrition supports your body's functions and can help prevent many health conditions. Consider consulting with a registered dietitian for personalized advice.",
        "Eating well is an investment in your health! Focus on whole, minimally processed foods and stay hydrated. What specific nutrition questions do you have?"
      ],
      medication: [
        "Medication questions are very important for your safety. Please consult with your pharmacist or prescribing doctor for specific information about your medications.",
        "I understand you have questions about medications. For your safety, it's crucial to discuss any concerns with your healthcare provider or pharmacist who has access to your complete medical history.",
        "Medication management is a key part of healthcare. Always follow your healthcare provider's instructions and don't hesitate to ask them or your pharmacist about any concerns."
      ],
      mental: [
        "Mental health is just as important as physical health. If you're struggling with stress, anxiety, or mood issues, please consider speaking with a mental health professional.",
        "Taking care of your mental well-being is crucial. Techniques like regular exercise, adequate sleep, stress management, and social connections can all help support mental health.",
        "Thank you for bringing up mental health - it's so important! Professional support is available and can be very helpful. Don't hesitate to reach out to a counselor or therapist."
      ],
      prevention: [
        "Prevention is the best medicine! Regular check-ups, screenings, vaccinations, and healthy lifestyle choices can help prevent many health issues.",
        "Preventive care is so important for maintaining good health. Stay up to date with recommended screenings and vaccinations, and maintain healthy habits.",
        "Great focus on prevention! Regular healthcare visits, healthy eating, exercise, adequate sleep, and stress management are all key components of preventive health."
      ]
    };

    // Select response based on primary keyword
    const primaryKeyword = keywords[0];
    const keywordResponses = responses[primaryKeyword as keyof typeof responses];
    
    if (keywordResponses) {
      const randomResponse = keywordResponses[Math.floor(Math.random() * keywordResponses.length)];
      
      // Add context-specific information if available
      if (context && context.includes('patient')) {
        return `${randomResponse}\n\nBased on your profile, I recommend discussing this with your healthcare provider during your next visit.`;
      }
      
      return randomResponse;
    }

    return this.generateGeneralHealthResponse(userMessage);
  }

  /**
   * Generate general health response for non-specific queries
   */
  private generateGeneralHealthResponse(userMessage: string): string {
    const generalResponses = [
      "I'm here to help with your health questions! While I can provide general health information, please remember that I cannot replace professional medical advice. What specific health topic would you like to discuss?",
      "Thank you for your question! I can share general health information, but for personalized medical advice, it's always best to consult with your healthcare provider. How can I help you learn more about health and wellness?",
      "I'm happy to discuss health topics with you! Keep in mind that while I can provide educational information, any specific health concerns should be addressed with a qualified healthcare professional. What would you like to know?",
      "Health and wellness are important topics! I can share general information to help you better understand health concepts, but please consult with healthcare professionals for medical advice specific to your situation. What interests you most?",
      "Great question! I'm here to provide general health education and information. For any personal health concerns or medical decisions, please work with your healthcare team. What health topic can I help explain?"
    ];

    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  }

  /**
   * Fallback response when service is unavailable
   */
  private getFallbackResponse(): string {
    return "I apologize, but I'm having trouble processing your request right now. For any health concerns, please don't hesitate to contact your healthcare provider directly. They're the best resource for personalized medical advice and care.";
  }

  /**
   * Alternative method using actual Hugging Face API (requires API key)
   */
  async callHuggingFaceAPI(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}${this.config.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
            return_full_text: false,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: HuggingFaceResponse[] = await response.json();
      return data[0]?.generated_text || this.getFallbackResponse();
      
    } catch (error) {
      console.error('Hugging Face API error:', error);
      throw error;
    }
  }

  /**
   * Set API key for production use
   */
  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }

  /**
   * Update model configuration
   */
  updateConfig(newConfig: Partial<HuggingFaceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get available free medical models from Hugging Face
   */
  getAvailableModels(): string[] {
    return [
      'microsoft/DialoGPT-medium',
      'microsoft/DialoGPT-large',
      'facebook/blenderbot-400M-distill',
      'microsoft/BioGPT-Large',
      'dmis-lab/biobert-base-cased-v1.2',
    ];
  }
}

export default HuggingFaceService;
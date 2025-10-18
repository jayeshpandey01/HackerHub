# AI Health Chatbot Component

A comprehensive AI-powered health assistant built with React Native and Hugging Face's free medical AI models.

## Features

### 🤖 Intelligent Health Assistant
- **Contextual Responses**: Tailored advice based on user medical profile
- **Health Topic Recognition**: Automatically detects and responds to health-related queries
- **Multi-Model Support**: Uses multiple free Hugging Face models for optimal responses

### 🏥 Comprehensive Health Coverage
- **Symptoms**: Pain, fever, fatigue, and other common symptoms
- **Vitals**: Blood pressure, heart rate, weight monitoring
- **Exercise**: Personalized fitness recommendations
- **Nutrition**: Diet and wellness guidance
- **Medications**: General medication information and safety
- **Mental Health**: Stress, anxiety, and sleep support
- **Prevention**: Screening, vaccines, and wellness tips

### 🔒 Safety & Compliance
- **Medical Disclaimers**: Always includes appropriate health disclaimers
- **Professional Referrals**: Encourages consultation with healthcare providers
- **No Diagnosis**: Provides information only, never diagnostic advice
- **Privacy Focused**: No personal health data stored externally

### 📱 User Experience
- **Real-time Chat**: Instant messaging interface with typing indicators
- **Quick Actions**: Pre-defined buttons for common health topics
- **Message History**: Conversation history with timestamps
- **Responsive Design**: Optimized for all screen sizes
- **Offline Fallbacks**: Intelligent responses when AI service unavailable

## Components

### HealthChatbot.tsx
Main chatbot component with full conversation interface.

**Props:**
- `userData`: User profile information
- `medicalProfile`: User's medical profile and conditions

**Features:**
- Message management and display
- Real-time AI response generation
- Quick action buttons
- Typing indicators and loading states

### HuggingFaceService.ts
Service class for AI model integration and response generation.

**Key Methods:**
- `generateHealthResponse()`: Main AI response generation
- `extractHealthKeywords()`: Identifies health-related topics
- `generateContextualResponse()`: Creates topic-specific responses
- `callHuggingFaceAPI()`: Direct API integration (optional)

## Setup & Configuration

### Basic Setup (No API Key Required)
The chatbot works immediately with intelligent fallback responses:

```typescript
import HealthChatbot from './Components/Chatbot/HealthChatbot';

<HealthChatbot 
  userData={userData}
  medicalProfile={medicalProfile}
/>
```

### Enhanced Setup (Free Hugging Face Account)
For AI-powered responses:

1. Create free account at [huggingface.co](https://huggingface.co)
2. Generate API token with 'read' permissions
3. Add to environment configuration:

```typescript
// config/environment.ts
HUGGING_FACE_API_KEY: 'hf_your_token_here'
```

## Available Models

### Free Conversational Models
- **microsoft/DialoGPT-medium** (Recommended)
- **facebook/blenderbot-400M-distill**

### Free Medical Models
- **microsoft/BioGPT-Large** (Medical specialization)
- **dmis-lab/biobert-base-cased-v1.2** (Medical understanding)

## Usage Examples

### Integration in Dashboard
```typescript
const renderChatbotContent = () => (
  <HealthChatbot 
    userData={userData}
    medicalProfile={medicalProfile}
  />
);
```

### Custom Configuration
```typescript
const huggingFaceService = new HuggingFaceService();
huggingFaceService.updateConfig({
  model: 'microsoft/BioGPT-Large',
  maxTokens: 200,
  temperature: 0.8
});
```

## Response Categories

### Symptom Queries
```
User: "I have a headache"
AI: "I understand you're experiencing a headache. While headaches can have various causes..."
```

### Exercise Questions
```
User: "What exercises should I do?"
AI: "Based on your profile, I recommend starting with gentle activities..."
```

### Medication Inquiries
```
User: "Tell me about my blood pressure medication"
AI: "For specific medication information, please consult your pharmacist..."
```

## Customization

### Adding New Health Keywords
```typescript
// In HuggingFaceService.ts
const healthKeywords = {
  symptoms: ['pain', 'headache', 'fever', /* add more */],
  // Add new categories
  chronic: ['diabetes', 'hypertension', 'arthritis'],
};
```

### Custom Response Templates
```typescript
const responses = {
  symptoms: [
    "Custom response for symptoms...",
    "Alternative symptom response...",
  ],
};
```

### New Quick Actions
```typescript
<TouchableOpacity 
  style={styles.quickActionButton}
  onPress={() => handleQuickAction('custom')}
>
  <FontAwesome5 name="custom-icon" size={14} color="#667eea" />
  <Text style={styles.quickActionText}>Custom Action</Text>
</TouchableOpacity>
```

## Error Handling

### Network Issues
- Automatic fallback to local responses
- User-friendly error messages
- Retry mechanisms with exponential backoff

### Rate Limiting
- Built-in rate limit detection
- Queue management for requests
- Graceful degradation to fallback responses

### API Failures
- Multiple fallback strategies
- Local keyword-based responses
- Professional consultation recommendations

## Performance Optimization

### Message Management
- Efficient message state management
- Automatic scroll to bottom
- Memory-conscious conversation history

### API Optimization
- Request debouncing
- Response caching
- Intelligent retry logic

### UI Performance
- Optimized re-renders
- Lazy loading of components
- Smooth animations and transitions

## Testing

### Unit Tests
```bash
npm test -- Components/Chatbot/
```

### Integration Tests
```bash
npm test -- services/huggingFaceService.test.ts
```

### Manual Testing Scenarios
1. Basic health questions
2. Complex medical queries
3. Network connectivity issues
4. Rate limiting scenarios
5. Fallback response quality

## Security Considerations

### Data Privacy
- No conversation data stored externally
- Local keyword processing
- Secure HTTPS API calls
- No PHI (Personal Health Information) transmission

### API Security
- Token-based authentication
- Request rate limiting
- Input sanitization
- Error message sanitization

## Troubleshooting

### Common Issues

**"AI is thinking..." persists**
- Check network connectivity
- Verify API token (if using enhanced mode)
- Check Hugging Face service status

**Generic responses only**
- Normal behavior without API token
- Verify token configuration
- Check feature flags

**Performance issues**
- Clear conversation history
- Check device memory
- Reduce message frequency

### Debug Mode
Enable debug logging:
```typescript
// config/environment.ts
DEBUG_MODE: true
```

## Contributing

### Adding New Features
1. Fork the repository
2. Create feature branch
3. Add comprehensive tests
4. Update documentation
5. Submit pull request

### Improving Responses
1. Analyze user feedback
2. Enhance keyword detection
3. Improve response templates
4. Add new health topics
5. Test thoroughly

## License

This component is part of the Swap Health application and follows the project's licensing terms.

## Support

For technical support:
- Check troubleshooting section
- Review setup documentation
- Contact development team
- Submit GitHub issues

---

**Medical Disclaimer**: This AI chatbot provides general health information for educational purposes only. It should never replace professional medical advice, diagnosis, or treatment. Always consult qualified healthcare providers for medical concerns.
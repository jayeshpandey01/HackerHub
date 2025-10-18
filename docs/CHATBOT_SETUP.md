# AI Health Chatbot Setup Guide

This guide will help you set up the AI Health Chatbot powered by Hugging Face's free medical AI models.

## Overview

The chatbot uses Hugging Face's free inference API to provide health-related responses. It includes:
- **Free Medical AI Models**: No API key required for basic functionality
- **Contextual Health Responses**: Tailored responses based on user medical profile
- **Safety Features**: Always recommends consulting healthcare professionals
- **Fallback Responses**: Works offline with pre-programmed health guidance

## Quick Start (No API Key Required)

The chatbot works out of the box with intelligent fallback responses:

1. **Navigate to the chatbot**: Open the app and go to the "AI Assistant" tab
2. **Start chatting**: Ask health-related questions
3. **Use quick actions**: Tap on suggested topics for instant responses

## Enhanced Setup (Optional - Free Hugging Face Account)

For enhanced AI responses, set up a free Hugging Face account:

### Step 1: Create Hugging Face Account
1. Visit [https://huggingface.co/](https://huggingface.co/)
2. Click "Sign Up" and create a free account
3. Verify your email address

### Step 2: Generate API Token
1. Go to [Settings > Access Tokens](https://huggingface.co/settings/tokens)
2. Click "New token"
3. Name it "SwapHealth-Chatbot"
4. Select "Read" permissions
5. Click "Generate a token"
6. Copy the token (starts with `hf_...`)

### Step 3: Configure the App
Add your token to the environment configuration:

```typescript
// In config/environment.ts
export const environment = {
  // ... other config
  huggingFace: {
    apiKey: 'hf_your_token_here', // Replace with your token
  }
};
```

Or set it as an environment variable:
```bash
export HUGGING_FACE_API_KEY=hf_your_token_here
```

## Available Free Models

### Conversational AI Models
- **microsoft/DialoGPT-medium** (Recommended)
  - Best for general health conversations
  - Free with rate limits
  - Good response quality

- **facebook/blenderbot-400M-distill**
  - Alternative conversational model
  - Free with rate limits
  - Smaller model, faster responses

### Medical Specialized Models
- **microsoft/BioGPT-Large**
  - Specialized for medical text generation
  - Free with stricter rate limits
  - More accurate medical terminology

- **dmis-lab/biobert-base-cased-v1.2**
  - Medical BERT model
  - Good for understanding medical queries
  - Free with rate limits

## Features

### 🤖 Intelligent Health Assistant
- Contextual responses based on user medical profile
- Recognizes health-related keywords and topics
- Provides appropriate guidance and recommendations

### 🔒 Safety First
- Always includes medical disclaimers
- Encourages professional medical consultation
- No diagnostic or prescriptive advice

### 📱 User-Friendly Interface
- Quick action buttons for common health topics
- Real-time typing indicators
- Message history and timestamps
- Responsive design for all screen sizes

### 🏥 Health Topic Coverage
- **Symptoms**: Pain, fever, fatigue, etc.
- **Vitals**: Blood pressure, heart rate, weight
- **Exercise**: Fitness recommendations and tips
- **Nutrition**: Diet and wellness advice
- **Medications**: General medication information
- **Mental Health**: Stress, anxiety, sleep support
- **Prevention**: Screening, vaccines, wellness

## Usage Examples

### Basic Health Questions
```
User: "I have a headache, what should I do?"
AI: "I understand you're experiencing a headache. While headaches can have various causes, here are some general suggestions..."
```

### Exercise Guidance
```
User: "What exercises are good for my back?"
AI: "For back health, gentle exercises like walking, swimming, and specific stretches can be beneficial..."
```

### Medication Questions
```
User: "Can you tell me about my blood pressure medication?"
AI: "For specific information about your medications, please consult with your pharmacist or prescribing doctor..."
```

## Rate Limits (Free Tier)

Hugging Face free tier includes:
- **30 requests per minute**
- **10,000 requests per month**
- **No cost** for basic usage

The app includes intelligent rate limiting and fallback responses to ensure smooth operation.

## Troubleshooting

### Common Issues

**"AI is thinking..." stays too long**
- Check internet connection
- Verify API token if using enhanced mode
- Try again in a few moments (rate limiting)

**Generic responses only**
- Normal behavior without API token
- Upgrade to enhanced mode for AI-powered responses

**Error messages**
- Check network connectivity
- Verify Hugging Face service status
- Contact support if issues persist

### Fallback Mode
If the AI service is unavailable, the chatbot automatically switches to:
- Pre-programmed health responses
- Keyword-based guidance
- Safety recommendations
- Professional consultation reminders

## Privacy & Security

- **No Personal Data Stored**: Conversations are not saved on external servers
- **Local Processing**: Keyword detection happens on-device
- **Secure API Calls**: All requests use HTTPS encryption
- **No Medical Records**: No access to actual medical records or PHI

## Support

For technical support or questions:
1. Check this documentation
2. Review the troubleshooting section
3. Contact the development team
4. Submit issues on the project repository

## Contributing

To improve the chatbot:
1. Add new health keywords in `services/huggingFaceService.ts`
2. Enhance response templates
3. Improve error handling
4. Add new quick action buttons
5. Expand medical topic coverage

---

**Disclaimer**: This AI chatbot provides general health information only and should never replace professional medical advice, diagnosis, or treatment. Always consult qualified healthcare providers for medical concerns.
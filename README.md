# Swap Health - AI-Powered Fitness & Healthcare App

A comprehensive React Native mobile application that combines AI-powered exercise tracking, medical consultations, and health monitoring capabilities. Built with pose estimation technology and integrated healthcare provider dashboards.

## 🌟 Features

### 🏃‍♂️ AI-Powered Exercise Tracking
- **Real-time Pose Estimation**: MediaPipe-powered exercise form analysis
- **25+ Exercise Types**: From strength training to therapeutic exercises
- **Live Form Feedback**: Real-time corrections and rep counting
- **Video Analysis**: Upload workout videos for detailed analysis
- **Progress Tracking**: Monitor improvements over time

### 🤖 AI Health Assistant
- **Medical Chatbot**: Powered by Hugging Face's free medical AI models
- **Contextual Responses**: Tailored advice based on user medical profile
- **Safety-First Design**: Always recommends professional medical consultation
- **Offline Fallback**: Works without internet connection

### 👩‍⚕️ Healthcare Provider Dashboard
- **Doctor Portal**: Specialized dashboard for healthcare providers
- **Patient Management**: Monitor patient progress and prescribe exercises
- **Medical Profiles**: Comprehensive health history tracking
- **Exercise Prescriptions**: Customized workout plans

### 📱 Cross-Platform Mobile App
- **React Native**: Runs on both iOS and Android
- **Expo Framework**: Fast development and deployment
- **Camera Integration**: Real-time video capture and analysis
- **Offline Support**: Core features work without internet

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │   FastAPI       │    │   AI Services   │
│   Mobile App    │◄──►│   Backend       │◄──►│   (Hugging Face)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Expo Camera   │    │   SQLite DB     │    │   TensorFlow/   │
│   MediaPipe     │    │   File Storage  │    │   MediaPipe     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Python 3.8+
- npm/yarn
- iOS/Android development environment

### Mobile App Setup

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Start the development server:**
   ```bash
   npm start
   # or
   yarn start
   ```

3. **Run on device:**
   ```bash
   # iOS
   npm run ios
   # or
   yarn ios
   
   # Android
   npm run android
   # or
   yarn android
   ```

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the server:**
   ```bash
   python main.py
   ```

4. **Access API documentation:**
   - Interactive docs: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## 📋 Tech Stack

### Frontend (React Native)
- **React Native**: `0.81.4` - Cross-platform mobile development
- **React**: `19.1.0` - UI component library
- **TypeScript**: `~5.9.2` - Type-safe JavaScript
- **Expo**: `~54.0.13` - Development platform
- **Expo Camera**: Camera access and video capture
- **React Native Reanimated**: Advanced animations

### Backend (Python)
- **FastAPI**: `0.104.1` - Modern web framework
- **SQLite**: Embedded database
- **JWT Authentication**: Secure user authentication
- **BCrypt**: Password hashing
- **Uvicorn**: ASGI server

### AI & Computer Vision
- **MediaPipe**: `0.10.7` - Pose estimation
- **OpenCV**: `4.8.1.78` - Computer vision
- **TensorFlow**: Machine learning framework
- **Hugging Face**: Free medical AI models
- **NumPy**: Numerical computing

## 🏋️‍♀️ Supported Exercises

### Strength Training
- Squat - Lower body strength
- Push Up - Upper body strength
- Hammer Curl - Bicep training
- Core Strengthening - Core stability
- Resistance Band Training

### Flexibility & Mobility
- Chair Yoga - Seated yoga poses
- Gentle Stretching - Basic stretching
- Range of Motion - Joint mobility
- Pelvic Tilts - Core flexibility
- Wrist Stretches - Wrist mobility

### Balance & Coordination
- Single Leg Balance - Balance training
- Side Step - Lateral movement
- Seated Marching - Seated cardio

### Therapeutic Exercises
- Breathing Exercise - Respiratory training
- Pelvic Floor Exercises - Pelvic health
- Tennis Elbow Exercise - Elbow rehabilitation
- Prenatal Yoga - Pregnancy-safe exercises

## 🤖 AI Health Chatbot

### Free Setup (No API Key Required)
The chatbot works out of the box with intelligent fallback responses.

### Enhanced Setup (Optional)
1. Create a free Hugging Face account at [huggingface.co](https://huggingface.co/)
2. Generate an API token in Settings > Access Tokens
3. Add to environment configuration:
   ```typescript
   // config/environment.ts
   HUGGING_FACE_API_KEY: 'hf_your_token_here'
   ```

### Available Free Models
- **microsoft/DialoGPT-medium** - Conversational AI
- **microsoft/BioGPT-Large** - Medical text generation
- **facebook/blenderbot-400M-distill** - Alternative conversational AI
- **dmis-lab/biobert-base-cased-v1.2** - Medical BERT model

## 🏥 Healthcare Features

### User Types
- **Patients**: Exercise tracking, health monitoring, AI assistant
- **Doctors**: Patient management, exercise prescriptions, progress monitoring

### Medical Profiles
- Comprehensive health history
- Disease tracking
- Medication management
- Emergency contacts
- Lifestyle factors

### Security & Privacy
- JWT token authentication
- Encrypted data transmission
- Local data storage
- HIPAA-compliant design
- No PHI transmission to external services

## 📊 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info

### Exercise Analysis
- `POST /api/analyze-video` - Full video analysis
- `POST /api/analyze-frame` - Real-time frame analysis
- `GET /api/exercise-config/{type}` - Exercise configuration

### User Management
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile

## 🔧 Configuration

### Environment Variables
```typescript
// Development
API_BASE_URL: 'http://localhost:8000'
ENABLE_POSE_ESTIMATION: true
CAMERA_QUALITY: 'medium'
DEBUG_MODE: true

// Production
API_BASE_URL: 'https://api.swaphealth.com'
CAMERA_QUALITY: 'high'
DEBUG_MODE: false
```

### Feature Flags
- `POSE_ESTIMATION_V2`: Enhanced pose estimation
- `ADVANCED_ANALYTICS`: Detailed performance metrics
- `PROVIDER_DASHBOARD`: Healthcare provider features
- `AI_HEALTH_CHATBOT`: AI assistant functionality

## 🧪 Testing

### Backend Testing
```bash
cd backend
python test_endpoints.py
```

### Mobile App Testing
```bash
# Unit tests
npm test
# or
yarn test

# Integration tests
npm run test:integration
# or
yarn test:integration
```

## 📱 Deployment

### Mobile App
- **iOS**: Build with Xcode and deploy to App Store
- **Android**: Build APK/AAB and deploy to Google Play Store
- **Expo**: Use Expo Application Services for automated builds

### Backend
- **Docker**: Containerized deployment
- **Cloud Providers**: AWS, Google Cloud, Azure
- **Local**: Direct Python deployment

## 🔒 Security Considerations

- Change `SECRET_KEY` in production
- Use HTTPS in production
- Configure CORS for your domain
- Implement rate limiting
- Regular security updates
- Backup database regularly

## 📖 Documentation

- [Setup Guide](docs/SETUP.md) - Detailed setup instructions
- [Tech Stack](docs/TECH_STACK.md) - Complete technology overview
- [Chatbot Setup](docs/CHATBOT_SETUP.md) - AI assistant configuration
- [API Documentation](http://localhost:8000/docs) - Interactive API docs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## 📄 License

This project is licensed under the 0BSD License - see the LICENSE file for details.

## 🆘 Support

### Common Issues

**Backend Connection Failed**
- Verify backend server is running
- Check API_BASE_URL configuration
- Ensure network connectivity

**Camera Permissions Denied**
- Check iOS Info.plist and Android permissions
- Grant camera permissions in device settings

**Video Upload Failed**
- Check file size limits (max 100MB)
- Verify video format compatibility
- Check network connection

**Pose Analysis Not Working**
- Ensure full body is visible in camera
- Check lighting conditions
- Verify MediaPipe installation

### Getting Help
1. Check this documentation
2. Review troubleshooting guides
3. Check GitHub issues
4. Contact development team

## 🎯 Roadmap

- [ ] Advanced exercise analytics
- [ ] Wearable device integration
- [ ] Telemedicine video calls
- [ ] Multi-language support
- [ ] Offline exercise library
- [ ] Social features and challenges
- [ ] Integration with health records

---

**Disclaimer**: This application provides general health and fitness information only and should never replace professional medical advice, diagnosis, or treatment. Always consult qualified healthcare providers for medical concerns.

## 📞 Contact

For questions, support, or contributions, please contact the development team or submit an issue on GitHub.

---

Built with ❤️ for better health and fitness outcomes.
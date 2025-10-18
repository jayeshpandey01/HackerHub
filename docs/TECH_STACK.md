# Swap Health - Complete Tech Stack Overview

## 🏗️ Architecture Overview

**Swap Health** is a comprehensive fitness and healthcare application with AI-powered exercise tracking, medical consultations, and health monitoring capabilities.

### **System Architecture:**
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

---

## 📱 Frontend Stack (React Native)

### **Core Framework:**
- **React Native**: `0.81.4` - Cross-platform mobile development
- **React**: `19.1.0` - UI component library
- **TypeScript**: `~5.9.2` - Type-safe JavaScript
- **Expo**: `~54.0.13` - React Native development platform

### **UI & Navigation:**
- **@expo/vector-icons**: `^15.0.2` - Icon library (FontAwesome5, MaterialIcons, Ionicons)
- **react-native-reanimated**: `~4.1.1` - Advanced animations and gestures

### **Device & Hardware:**
- **expo-camera**: `~17.0.8` - Camera access and photo/video capture
- **expo-haptics**: `~15.0.7` - Haptic feedback
- **expo-media-library**: `^18.2.0` - Media storage and access
- **expo-file-system**: `^19.0.17` - File system operations

### **Storage & Network:**
- **@react-native-async-storage/async-storage**: `^2.2.0` - Local data persistence
- **@react-native-community/netinfo**: `^11.4.1` - Network connectivity monitoring

### **Status & System:**
- **expo-status-bar**: `~3.0.8` - Status bar configuration

---

## 🚀 Backend Stack (Python)

### **Web Framework:**
- **FastAPI**: `0.104.1` - Modern, fast web framework for APIs
- **Uvicorn**: `0.24.0` - ASGI server for FastAPI
- **python-multipart**: `0.0.6` - Multipart form data handling

### **Authentication & Security:**
- **PyJWT**: `2.8.0` - JSON Web Token implementation
- **python-jose[cryptography]**: `3.3.0` - JWT and cryptographic operations
- **passlib[bcrypt]**: `1.7.4` - Password hashing library
- **bcrypt**: `4.1.2` - Password hashing algorithm

### **Data Validation & Models:**
- **pydantic[email]**: `2.5.0` - Data validation and serialization
- **email-validator**: `2.1.0` - Email address validation

### **Database:**
- **SQLite3**: Built-in Python - Lightweight relational database
- **sqlite3**: Built-in Python module for database operations

---

## 🤖 AI & Computer Vision Stack

### **Pose Estimation & Exercise Tracking:**
- **MediaPipe**: `0.10.7` - Google's ML framework for pose estimation
- **OpenCV**: `4.8.1.78` - Computer vision and image processing
- **NumPy**: `1.24.3` - Numerical computing and array operations
- **TensorFlow**: (Implicit via MediaPipe) - Machine learning framework

### **AI Chatbot & NLP:**
- **Hugging Face Transformers**: (API-based) - Pre-trained language models
- **Free Medical Models Used:**
  - `microsoft/DialoGPT-medium` - Conversational AI
  - `microsoft/BioGPT-Large` - Medical text generation
  - `facebook/blenderbot-400M-distill` - Alternative conversational AI
  - `dmis-lab/biobert-base-cased-v1.2` - Medical BERT model

### **Image Processing:**
- **Pillow**: `10.1.0` - Python Imaging Library for image manipulation
- **Base64**: Built-in Python - Image encoding/decoding

---

## 🗄️ Database & Storage

### **Primary Database:**
- **SQLite**: Embedded relational database
- **Tables:**
  - `users` - User authentication and profiles
  - `doctor_profiles` - Healthcare provider information
  - `patient_profiles` - Patient basic information
  - `patient_medical_profiles` - Detailed medical history
  - `doctor_medical_profiles` - Doctor credentials and specializations

### **File Storage:**
- **Local File System**: Video and image storage
- **Base64 Encoding**: Image data transmission
- **Temporary Files**: Video processing cache

---

## 🌐 Additional Services & APIs

### **External APIs:**
- **Hugging Face Inference API**: Free AI model hosting
- **Camera API**: Device camera access
- **File System API**: Local storage operations

### **Development Tools:**
- **Flask**: `(fitness app)` - Alternative web framework for fitness module
- **Logging**: Built-in Python logging
- **JSON**: Data serialization
- **CORS**: Cross-origin resource sharing

---

## 📊 Exercise Tracking Modules

### **Supported Exercises (Python Classes):**

#### **Strength Training:**
- `Squat` - Lower body strength
- `PushUp` - Upper body strength  
- `HammerCurl` - Bicep training
- `CoreStrengthening` - Core stability
- `ResistanceBandStrengthening` - Resistance training

#### **Flexibility & Mobility:**
- `ChairYoga` - Seated yoga poses
- `GentleStretching` - Basic stretching
- `RangeOfMotion` - Joint mobility
- `PelvicTilts` - Core flexibility
- `WristExtensorStretch` - Wrist mobility

#### **Balance & Coordination:**
- `SingleLegBalance` - Balance training
- `BalanceExercises` - Stability work
- `SideStep` - Lateral movement
- `SeatedMarching` - Seated cardio

#### **Therapeutic Exercises:**
- `BreathingExercise` - Respiratory training
- `PelvicFloorExercises` - Pelvic health
- `TennisElbowExercise` - Elbow rehabilitation
- `EccentricStrengthening` - Injury recovery

#### **Specialized Programs:**
- `PrenatalYoga` - Pregnancy-safe exercises
- `LightWalking` - Low-impact cardio
- `FingerTapping` - Fine motor skills
- `FootFlexes` - Ankle mobility

---

## 🔧 Development & Build Tools

### **Package Management:**
- **npm/yarn**: JavaScript package management
- **pip**: Python package management
- **requirements.txt**: Python dependency specification

### **Development Environment:**
- **Expo CLI**: React Native development tools
- **TypeScript Compiler**: Type checking and compilation
- **ESLint/Prettier**: Code formatting and linting

### **Build & Deployment:**
- **Expo Build Service**: Mobile app compilation
- **Uvicorn**: Production ASGI server
- **Docker**: (Optional) Containerization

---

## 🧪 Testing & Quality Assurance

### **Testing Frameworks:**
- **Custom Test Scripts**: Python-based testing
- **Manual Testing**: Device-specific testing
- **Performance Monitoring**: Built-in monitoring service

### **Code Quality:**
- **TypeScript**: Static type checking
- **Pydantic**: Runtime data validation
- **Error Handling**: Comprehensive error management
- **Logging**: Detailed application logging

---

## 📈 Monitoring & Analytics

### **Performance Monitoring:**
- **Custom Monitoring Service**: Real-time performance tracking
- **Health Checks**: System status monitoring
- **Error Tracking**: Exception logging and reporting
- **Metrics Collection**: Usage and performance metrics

### **Analytics:**
- **Exercise Performance**: Rep counting and form analysis
- **User Progress**: Workout statistics and improvements
- **System Performance**: API response times and success rates

---

## 🔐 Security & Privacy

### **Authentication:**
- **JWT Tokens**: Secure user authentication
- **BCrypt Hashing**: Password security
- **HTTPS**: Encrypted data transmission
- **CORS**: Cross-origin request security

### **Data Privacy:**
- **Local Storage**: Sensitive data kept on device
- **No PHI Transmission**: Medical data privacy compliance
- **Secure API Calls**: Encrypted communication
- **User Consent**: Privacy-focused design

---

## 🚀 Deployment Architecture

### **Mobile App:**
- **Expo Application Services**: App store deployment
- **Over-the-Air Updates**: Instant app updates
- **Platform-Specific Builds**: iOS and Android optimization

### **Backend Services:**
- **FastAPI Server**: RESTful API endpoints
- **SQLite Database**: Embedded database
- **File Storage**: Local file system
- **AI Services**: Hugging Face API integration

---

## 📋 Complete Python Libraries List

### **Core Backend Libraries:**
```python
fastapi==0.104.1                 # Web framework
uvicorn[standard]==0.24.0        # ASGI server
pydantic[email]==2.5.0           # Data validation
python-multipart==0.0.6          # Form handling
```

### **Authentication & Security:**
```python
PyJWT==2.8.0                     # JWT tokens
python-jose[cryptography]==3.3.0 # Cryptography
passlib[bcrypt]==1.7.4           # Password hashing
bcrypt==4.1.2                    # Hashing algorithm
email-validator==2.1.0           # Email validation
```

### **AI & Computer Vision:**
```python
opencv-python==4.8.1.78          # Computer vision
mediapipe==0.10.7                # Pose estimation
numpy==1.24.3                    # Numerical computing
Pillow==10.1.0                   # Image processing
tensorflow                       # (Implicit via MediaPipe)
```

### **Built-in Python Modules:**
```python
sqlite3          # Database operations
json             # JSON serialization
base64           # Data encoding
datetime         # Date/time handling
os               # Operating system interface
tempfile         # Temporary file handling
contextmanager   # Context management
typing           # Type hints
logging          # Application logging
```

### **Fitness App Additional Libraries:**
```python
flask            # Alternative web framework
cv2              # OpenCV Python bindings
threading        # Multi-threading support
time             # Time operations
sys              # System operations
traceback        # Error tracing
```

---

## 🎯 Key Features Enabled by Tech Stack

### **Real-time Exercise Tracking:**
- MediaPipe pose estimation
- OpenCV image processing
- Custom exercise algorithms
- Real-time feedback system

### **AI Health Assistant:**
- Hugging Face language models
- Medical knowledge base
- Contextual health advice
- Safety-first recommendations

### **Cross-platform Mobile App:**
- React Native framework
- Expo development platform
- Native device capabilities
- Consistent user experience

### **Secure Healthcare Data:**
- JWT authentication
- Encrypted data transmission
- Local data storage
- Privacy compliance

### **Comprehensive Exercise Library:**
- 25+ exercise types
- Therapeutic programs
- Adaptive difficulty
- Progress tracking

This tech stack provides a robust, scalable, and secure foundation for a comprehensive healthcare and fitness application with AI-powered features.
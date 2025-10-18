# Camera Dependencies Installation Guide

This guide will help you install the required dependencies for camera-based exercise tracking.

## Required Dependencies

### 1. Expo Camera
```bash
npx expo install expo-camera
```

### 2. Camera Permissions (if not already installed)
```bash
npx expo install expo-permissions
```

### 3. Additional Media Libraries (optional)
```bash
npx expo install expo-media-library
npx expo install expo-av
```

## Configuration

### 1. Update app.json/app.config.js
Add camera permissions to your Expo configuration:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera for exercise tracking."
        }
      ]
    ],
    "permissions": [
      "CAMERA",
      "RECORD_AUDIO"
    ]
  }
}
```

### 2. For React Native CLI projects
Add permissions to android/app/src/main/AndroidManifest.xml:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

Add to ios/YourApp/Info.plist:

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs access to camera for exercise tracking</string>
<key>NSMicrophoneUsageDescription</key>
<string>This app needs access to microphone for exercise feedback</string>
```

## Features Enabled

With these dependencies installed, the exercise tracker will provide:

### Camera-Based Exercise Tracking
- **Real-time Camera Feed**: Live camera view during exercises
- **Manual Rep Counting**: Tap to count repetitions
- **Set Management**: Automatic set progression with rest timers
- **Exercise Timer**: Track workout duration
- **Form Guidance**: On-screen instructions for proper form

### Exercise Flow
1. **Exercise Selection**: Choose from available exercises
2. **Camera Setup**: Front/back camera toggle
3. **Live Tracking**: Real-time exercise monitoring
4. **Rep Counting**: Manual tap-to-count system
5. **Rest Periods**: Automatic 30-second rest between sets
6. **Workout Completion**: Summary and statistics

### Supported Exercises
- **Squats**: Lower body strength training
- **Push-ups**: Upper body strength training
- **Hammer Curls**: Arm strengthening
- **Chair Yoga**: Gentle stretching
- **Breathing Exercises**: Mindfulness and relaxation

## Usage Instructions

### 1. Start Exercise
- Select an exercise from the list
- Customize sets and reps
- Grant camera permissions when prompted
- Tap "Start Exercise"

### 2. During Exercise
- Position yourself in camera view
- Follow on-screen instructions
- Tap the "Rep" button to count each repetition
- Rest automatically between sets

### 3. Complete Workout
- Finish all sets and reps
- View workout summary
- Data is logged to your health profile

## Troubleshooting

### Camera Permission Issues
- Check device settings for camera permissions
- Restart the app after granting permissions
- Ensure no other apps are using the camera

### Performance Issues
- Close other camera-using apps
- Restart the device if camera is unresponsive
- Check available storage space

### Exercise Tracking
- Ensure good lighting for camera visibility
- Position camera to see full body for exercises
- Use front camera for better self-monitoring

## Alternative Modes

### Backend Connected Mode
When Python backend is running:
- Automatic pose detection
- Real-time form analysis
- Automatic rep counting
- Advanced exercise feedback

### Demo Mode (Camera Only)
When backend is not available:
- Manual rep counting
- Exercise timer and set management
- Basic form guidance
- Workout logging

## Development Notes

### Camera Component Structure
```
CameraExerciseTracker/
├── Camera permissions handling
├── Exercise timer and set management
├── Manual rep counting interface
├── Rest period management
└── Workout completion handling
```

### Integration Points
- Connects with fitness service for exercise data
- Integrates with health dashboard for workout logging
- Supports both backend and standalone modes
- Provides consistent user experience

This camera-based system ensures users can track exercises even without the Python backend, providing a complete fitness solution within the React Native app.
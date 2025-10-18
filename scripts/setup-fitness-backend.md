# Fitness Backend Setup Guide

This guide will help you set up the Python Flask backend for real-time exercise tracking with pose estimation.

## Prerequisites

1. **Python 3.8 or higher** installed on your system
2. **Webcam** connected to your computer
3. **Node.js** for the React Native app

## Backend Setup

### 1. Navigate to the fitness directory
```bash
cd fitness
```

### 2. Install Python dependencies
```bash
pip install -r requirements.txt
```

If you don't have the requirements.txt file, install these packages:
```bash
pip install flask opencv-python mediapipe numpy
```

### 3. Start the Flask backend
```bash
python app.py
```

The backend will start on `http://127.0.0.1:5000`

### 4. Verify the backend is running
Open your browser and go to `http://127.0.0.1:5000` - you should see the fitness trainer interface.

## Frontend Integration

The React Native app will automatically detect if the backend is running and switch between:
- **Live Tracking Mode**: When backend is connected, provides real-time pose detection
- **Demo Mode**: When backend is not available, shows mock exercise tracking

## Available Exercises

The backend supports these exercises with real-time pose detection:

1. **Squats** - Lower body strength training
2. **Push-ups** - Upper body strength training  
3. **Hammer Curls** - Arm strengthening (requires weights)
4. **Chair Yoga** - Gentle stretching and flexibility
5. **Breathing Exercises** - Relaxation and mindfulness

## Troubleshooting

### Backend won't start
- Check if Python is installed: `python --version`
- Install missing dependencies: `pip install -r requirements.txt`
- Check if port 5000 is available

### Camera not working
- Ensure webcam is connected and not used by other applications
- Check camera permissions
- Try restarting the backend

### Connection issues
- Verify backend is running on `http://127.0.0.1:5000`
- Check firewall settings
- Ensure both frontend and backend are on the same network

## Features

### Real-time Pose Detection
- Uses MediaPipe for accurate pose estimation
- Tracks exercise form and counts repetitions
- Provides real-time feedback

### Exercise Tracking
- Customizable sets and repetitions
- Workout logging and statistics
- Progress tracking over time

### Health Integration
- Adapts exercises based on medical profile
- Provides appropriate difficulty levels
- Safe exercise recommendations

## API Endpoints

The backend provides these REST API endpoints:

- `GET /` - Main dashboard
- `GET /video_feed` - Live camera feed
- `POST /start_exercise` - Start exercise session
- `POST /stop_exercise` - Stop exercise session
- `GET /get_status` - Get current exercise status
- `GET /dashboard` - Workout statistics

## Next Steps

1. Start the Python backend
2. Launch the React Native app
3. Navigate to the Exercise tab
4. Select an exercise and start tracking!

The app will automatically detect the backend connection and enable live pose tracking features.
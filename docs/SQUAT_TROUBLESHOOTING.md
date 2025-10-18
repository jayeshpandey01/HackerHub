# Squat Tracking Troubleshooting Guide

This guide helps resolve common issues with squat tracking functionality.

## Quick Diagnosis

### 1. Run the Test Script
```bash
cd scripts
python test-squat-analysis.py
```

This will test:
- Backend connectivity
- Pose analysis functionality
- Rep counting logic
- Form analysis feedback

### 2. Check Backend Status
```bash
curl http://localhost:8000/health
```

Expected response: `{"status": "healthy"}`

## Common Issues & Solutions

### Issue 1: "Squats not working" - No Analysis Response

**Symptoms:**
- No rep counting
- No form feedback
- Camera shows but no analysis

**Diagnosis:**
```bash
# Check if backend is running
curl http://localhost:8000/api/analyze-frame -X POST -H "Content-Type: application/json" -d '{"frame":"test","exercise_type":"squat"}'
```

**Solutions:**

1. **Backend Not Running**
   ```bash
   cd backend
   python main.py
   ```

2. **Missing Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **TensorFlow/MediaPipe Issues**
   ```bash
   cd backend
   python scripts/fix-tensorflow-warnings.py
   ```

### Issue 2: Inaccurate Rep Counting

**Symptoms:**
- Reps not counting
- False positive reps
- Inconsistent counting

**Diagnosis:**
Check the squat analysis thresholds in `backend/main.py`:

```python
# Look for these values in analyze_squat_form_accurate
hip_knee_distance = hip_center_y - knee_center_y

# Stage determination
if hip_knee_distance > 0.08:  # Up position
    stage = "up"
elif hip_knee_distance < -0.03:  # Down position (good depth)
    stage = "down"
```

**Solutions:**

1. **Adjust Depth Thresholds**
   ```python
   # In backend/main.py - analyze_squat_form_accurate function
   # Make thresholds more/less sensitive
   if hip_knee_distance > 0.06:  # Less sensitive for "up"
       stage = "up"
   elif hip_knee_distance < -0.05:  # More sensitive for "down"
       stage = "down"
   ```

2. **Improve Camera Position**
   - Ensure full body is visible
   - Position camera at waist height
   - Maintain consistent distance (6-8 feet)
   - Good lighting conditions

3. **Use Improved Squat Tracker**
   ```typescript
   // Replace basic squat tracking with improved version
   import { ImprovedSquatTracker } from '../exercises/improved_squat_tracker.py';
   ```

### Issue 3: Poor Form Analysis

**Symptoms:**
- Inaccurate form scores
- Missing feedback
- Incorrect warnings

**Solutions:**

1. **Update Form Analysis Logic**
   ```python
   # In backend/main.py - enhance analyze_squat_form_accurate
   
   # Better depth analysis
   if hip_knee_distance < -0.05:  # Excellent depth
       warnings.append("Excellent depth! 🎯")
       formScore += 5
   elif hip_knee_distance < -0.02:  # Good depth
       warnings.append("Good depth! 👍")
   elif hip_knee_distance > 0.05:  # Too shallow
       warnings.append("Go deeper - hips should go below knees")
       formScore -= 20
   ```

2. **Improve Keypoint Detection**
   ```python
   # Ensure all required keypoints are detected
   if len(keypoints) < 33:
       return 70.0, ["Incomplete pose detection - ensure full body is visible"], "up", 0
   ```

### Issue 4: Camera/Permission Issues

**Symptoms:**
- Black camera screen
- Permission denied errors
- Camera not starting

**Solutions:**

1. **Check Camera Permissions**
   ```typescript
   // In SquatTracker.tsx
   const { status } = await Camera.requestCameraPermissionsAsync();
   if (status !== 'granted') {
       // Handle permission denied
   }
   ```

2. **Test Camera Functionality**
   ```typescript
   // Add camera test in component
   const testCamera = async () => {
       try {
           const photo = await cameraRef.current?.takePictureAsync({
               base64: true,
               quality: 0.7,
           });
           console.log('Camera test successful:', !!photo);
       } catch (error) {
           console.error('Camera test failed:', error);
       }
   };
   ```

### Issue 5: Performance Issues

**Symptoms:**
- Slow analysis
- App freezing
- High CPU usage

**Solutions:**

1. **Optimize Analysis Frequency**
   ```typescript
   // In SquatTracker.tsx - reduce analysis frequency
   analysisIntervalRef.current = setInterval(async () => {
       await captureAndAnalyze();
   }, 2000); // Analyze every 2 seconds instead of 1
   ```

2. **Reduce Image Quality**
   ```typescript
   const photo = await cameraRef.current.takePictureAsync({
       base64: true,
       quality: 0.5, // Reduce from 0.7 to 0.5
       skipProcessing: true,
   });
   ```

3. **Use Squat Analysis Service**
   ```typescript
   // Use the optimized service
   import { squatAnalysisService } from '../../services/squatAnalysisService';
   
   const result = await squatAnalysisService.analyzeSquatFrame(photo.base64);
   ```

## Advanced Debugging

### Enable Debug Logging

1. **Backend Logging**
   ```python
   # In backend/main.py
   import logging
   logging.basicConfig(level=logging.DEBUG)
   
   # Add debug prints in analysis functions
   print(f"Debug: Hip-knee distance: {hip_knee_distance}")
   print(f"Debug: Stage determined: {stage}")
   ```

2. **Frontend Logging**
   ```typescript
   // In SquatTracker.tsx
   console.log('Analysis result:', result);
   console.log('Metrics updated:', metrics);
   ```

### Test Individual Components

1. **Test Backend Analysis**
   ```bash
   cd scripts
   python test-squat-analysis.py
   ```

2. **Test Frontend Service**
   ```typescript
   // In React Native app
   import { squatAnalysisService } from '../services/squatAnalysisService';
   
   const testAnalysis = async () => {
       const stats = squatAnalysisService.getPerformanceMetrics();
       console.log('Service stats:', stats);
   };
   ```

### Monitor Performance

1. **Backend Performance**
   ```python
   import time
   
   def analyze_squat_form_accurate(keypoints):
       start_time = time.time()
       # ... analysis code ...
       processing_time = time.time() - start_time
       print(f"Analysis took: {processing_time:.3f}s")
   ```

2. **Frontend Performance**
   ```typescript
   const captureAndAnalyze = async () => {
       const startTime = Date.now();
       // ... analysis code ...
       const processingTime = Date.now() - startTime;
       console.log(`Frame analysis took: ${processingTime}ms`);
   };
   ```

## Configuration Tuning

### Squat Detection Thresholds

```python
# In backend/main.py - adjust these values for better detection
SQUAT_THRESHOLDS = {
    'up_position': 0.08,      # Hip-knee distance for "up"
    'down_position': -0.03,   # Hip-knee distance for "down"
    'excellent_depth': -0.05, # Excellent squat depth
    'min_confidence': 0.7,    # Minimum pose confidence
    'form_score_base': 100.0  # Starting form score
}
```

### Camera Settings

```typescript
// In SquatTracker.tsx - optimize camera settings
const cameraConfig = {
    type: Camera.Constants.Type.front,
    ratio: "16:9",
    quality: Camera.Constants.VideoQuality['720p'],
    pictureSize: "640x480", // Smaller size for faster processing
};
```

## Validation Checklist

Before reporting issues, verify:

- [ ] Backend server is running (`http://localhost:8000/health`)
- [ ] Camera permissions granted
- [ ] Full body visible in camera
- [ ] Good lighting conditions
- [ ] Stable internet connection
- [ ] Latest app version installed
- [ ] TensorFlow warnings resolved

## Getting Help

If issues persist:

1. **Collect Debug Information**
   ```bash
   # Run diagnostic script
   python scripts/test-squat-analysis.py > debug_output.txt 2>&1
   ```

2. **Check Logs**
   - Backend logs: Check console output
   - Frontend logs: Check React Native debugger
   - Monitoring logs: Use monitoring service

3. **Report Issue**
   Include:
   - Debug output
   - Steps to reproduce
   - Expected vs actual behavior
   - Device/platform information
   - Screenshots/videos if applicable

## Performance Benchmarks

**Expected Performance:**
- Frame analysis: < 500ms
- Rep detection: < 1 second delay
- Form feedback: Real-time
- Memory usage: < 100MB additional
- CPU usage: < 30% on modern devices

**If performance is below these benchmarks, apply the optimization solutions above.**
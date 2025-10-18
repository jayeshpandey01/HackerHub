"""
Improved Squat Tracker with Enhanced Form Analysis
This module provides accurate squat tracking with real-time feedback
"""

import cv2
import numpy as np
import math
from typing import Tuple, List, Dict, Any

class ImprovedSquatTracker:
    def __init__(self):
        self.counter = 0
        self.stage = "up"  # up, down, transition
        self.previous_stage = "up"
        self.form_score = 100.0
        self.warnings = []
        
        # Tracking variables for better rep counting
        self.min_angle_reached = 180
        self.max_depth_reached = 0
        self.rep_in_progress = False
        
        # Smoothing for angle calculations
        self.angle_history = []
        self.history_size = 5
        
        # Thresholds for squat analysis
        self.DEPTH_THRESHOLD = 90  # Minimum angle for good depth
        self.EXCELLENT_DEPTH = 70  # Angle for excellent depth
        self.UP_THRESHOLD = 160    # Angle to consider "up" position
        
    def calculate_angle(self, point1: List[float], point2: List[float], point3: List[float]) -> float:
        """Calculate angle between three points"""
        try:
            # Convert to numpy arrays
            a = np.array(point1)
            b = np.array(point2)  # Vertex point
            c = np.array(point3)
            
            # Calculate vectors
            ba = a - b
            bc = c - b
            
            # Calculate angle using dot product
            cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
            
            # Clamp cosine to valid range to avoid numerical errors
            cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
            
            angle = np.arccos(cosine_angle)
            return np.degrees(angle)
            
        except Exception as e:
            print(f"Error calculating angle: {e}")
            return 180.0  # Default to straight line
    
    def smooth_angle(self, angle: float) -> float:
        """Apply smoothing to angle measurements"""
        self.angle_history.append(angle)
        
        # Keep only recent history
        if len(self.angle_history) > self.history_size:
            self.angle_history.pop(0)
        
        # Return moving average
        return sum(self.angle_history) / len(self.angle_history)
    
    def analyze_squat_form(self, landmarks, frame_shape) -> Tuple[float, List[str], str, int]:
        """
        Comprehensive squat form analysis
        Returns: (form_score, warnings, stage, rep_count)
        """
        try:
            if not landmarks or len(landmarks) < 33:
                return 0.0, ["No pose detected - ensure full body is visible"], "up", 0
            
            # Extract key landmarks (MediaPipe format)
            left_shoulder = [landmarks[11].x * frame_shape[1], landmarks[11].y * frame_shape[0]]
            right_shoulder = [landmarks[12].x * frame_shape[1], landmarks[12].y * frame_shape[0]]
            left_hip = [landmarks[23].x * frame_shape[1], landmarks[23].y * frame_shape[0]]
            right_hip = [landmarks[24].x * frame_shape[1], landmarks[24].y * frame_shape[0]]
            left_knee = [landmarks[25].x * frame_shape[1], landmarks[25].y * frame_shape[0]]
            right_knee = [landmarks[26].x * frame_shape[1], landmarks[26].y * frame_shape[0]]
            left_ankle = [landmarks[27].x * frame_shape[1], landmarks[27].y * frame_shape[0]]
            right_ankle = [landmarks[28].x * frame_shape[1], landmarks[28].y * frame_shape[0]]
            
            # Calculate primary angles (hip-knee-ankle for squat depth)
            left_leg_angle = self.calculate_angle(left_hip, left_knee, left_ankle)
            right_leg_angle = self.calculate_angle(right_hip, right_knee, right_ankle)
            
            # Use average of both legs for primary analysis
            avg_leg_angle = (left_leg_angle + right_leg_angle) / 2
            smoothed_angle = self.smooth_angle(avg_leg_angle)
            
            # Calculate torso angle (shoulder-hip-knee for posture)
            left_torso_angle = self.calculate_angle(left_shoulder, left_hip, left_knee)
            right_torso_angle = self.calculate_angle(right_shoulder, right_hip, right_knee)
            avg_torso_angle = (left_torso_angle + right_torso_angle) / 2
            
            # Reset form analysis
            self.form_score = 100.0
            self.warnings = []
            
            # Determine squat stage and count reps
            self.previous_stage = self.stage
            
            if smoothed_angle > self.UP_THRESHOLD:
                self.stage = "up"
                if self.rep_in_progress and self.previous_stage == "down":
                    # Completed a rep
                    self.counter += 1
                    self.rep_in_progress = False
                    self.warnings.append(f"Rep {self.counter} completed! 🎉")
                    
            elif smoothed_angle < self.DEPTH_THRESHOLD:
                self.stage = "down"
                if not self.rep_in_progress:
                    self.rep_in_progress = True
                    
            else:
                self.stage = "transition"
            
            # Track depth metrics
            if smoothed_angle < self.min_angle_reached:
                self.min_angle_reached = smoothed_angle
            
            # Form analysis
            
            # 1. Depth Analysis
            if smoothed_angle <= self.EXCELLENT_DEPTH:
                self.warnings.append("Excellent depth! 🎯")
                self.form_score += 5  # Bonus for excellent depth
            elif smoothed_angle <= self.DEPTH_THRESHOLD:
                self.warnings.append("Good depth! 👍")
            elif self.stage == "down":
                self.warnings.append("Go deeper - aim for 90° knee angle")
                self.form_score -= 20
            
            # 2. Symmetry Analysis
            leg_angle_diff = abs(left_leg_angle - right_leg_angle)
            if leg_angle_diff > 15:
                self.warnings.append("Keep both legs symmetric")
                self.form_score -= 10
            else:
                self.warnings.append("Good leg symmetry! 👌")
            
            # 3. Posture Analysis
            if avg_torso_angle < 160:  # Leaning forward too much
                self.warnings.append("Keep chest up and back straight")
                self.form_score -= 15
            elif avg_torso_angle > 200:  # Leaning backward
                self.warnings.append("Don't lean back - maintain neutral spine")
                self.form_score -= 10
            else:
                self.warnings.append("Great posture! 💪")
            
            # 4. Knee Alignment (check if knees are tracking properly)
            knee_width = abs(left_knee[0] - right_knee[0])
            ankle_width = abs(left_ankle[0] - right_ankle[0])
            
            if knee_width < ankle_width * 0.8:  # Knees caving in
                self.warnings.append("Keep knees aligned with toes")
                self.form_score -= 15
            elif knee_width > ankle_width * 1.3:  # Knees too wide
                self.warnings.append("Knees slightly too wide")
                self.form_score -= 5
            
            # 5. Range of Motion Feedback
            if self.stage == "up" and smoothed_angle > 170:
                self.warnings.append("Ready position - start your squat")
            elif self.stage == "transition":
                if self.previous_stage == "up":
                    self.warnings.append("Descending - control the movement")
                else:
                    self.warnings.append("Ascending - drive through heels")
            
            # Ensure score is within bounds
            self.form_score = max(0, min(100, self.form_score))
            
            # Add overall performance message
            if self.form_score >= 90:
                self.warnings.insert(0, "Perfect form! 🔥")
            elif self.form_score >= 80:
                self.warnings.insert(0, "Great form! 💪")
            elif self.form_score >= 70:
                self.warnings.insert(0, "Good form, minor adjustments needed")
            else:
                self.warnings.insert(0, "Focus on form improvements")
            
            return self.form_score, self.warnings, self.stage, self.counter
            
        except Exception as e:
            return 50.0, [f"Analysis error: {str(e)}"], "up", self.counter
    
    def draw_squat_analysis(self, frame, landmarks):
        """Draw squat analysis visualization on frame"""
        try:
            if not landmarks or len(landmarks) < 33:
                return frame
            
            # Extract key points
            left_shoulder = [int(landmarks[11].x * frame.shape[1]), int(landmarks[11].y * frame.shape[0])]
            right_shoulder = [int(landmarks[12].x * frame.shape[1]), int(landmarks[12].y * frame.shape[0])]
            left_hip = [int(landmarks[23].x * frame.shape[1]), int(landmarks[23].y * frame.shape[0])]
            right_hip = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]
            left_knee = [int(landmarks[25].x * frame.shape[1]), int(landmarks[25].y * frame.shape[0])]
            right_knee = [int(landmarks[26].x * frame.shape[1]), int(landmarks[26].y * frame.shape[0])]
            left_ankle = [int(landmarks[27].x * frame.shape[1]), int(landmarks[27].y * frame.shape[0])]
            right_ankle = [int(landmarks[28].x * frame.shape[1]), int(landmarks[28].y * frame.shape[0])]
            
            # Draw skeleton lines
            # Left side (purple)
            cv2.line(frame, left_shoulder, left_hip, (178, 102, 255), 3)
            cv2.line(frame, left_hip, left_knee, (178, 102, 255), 3)
            cv2.line(frame, left_knee, left_ankle, (178, 102, 255), 3)
            
            # Right side (blue)
            cv2.line(frame, right_shoulder, right_hip, (51, 153, 255), 3)
            cv2.line(frame, right_hip, right_knee, (51, 153, 255), 3)
            cv2.line(frame, right_knee, right_ankle, (51, 153, 255), 3)
            
            # Draw joint circles
            joints = [left_shoulder, right_shoulder, left_hip, right_hip, 
                     left_knee, right_knee, left_ankle, right_ankle]
            colors = [(178, 102, 255), (51, 153, 255)] * 4
            
            for joint, color in zip(joints, colors):
                cv2.circle(frame, joint, 8, color, -1)
                cv2.circle(frame, joint, 10, (255, 255, 255), 2)
            
            # Calculate and display angles
            left_angle = self.calculate_angle(left_hip, left_knee, left_ankle)
            right_angle = self.calculate_angle(right_hip, right_knee, right_ankle)
            
            # Display angle information
            cv2.putText(frame, f'L: {int(left_angle)}°', 
                       (left_knee[0] - 30, left_knee[1] - 20), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (178, 102, 255), 2)
            
            cv2.putText(frame, f'R: {int(right_angle)}°', 
                       (right_knee[0] + 10, right_knee[1] - 20), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (51, 153, 255), 2)
            
            # Display rep counter and stage
            cv2.rectangle(frame, (10, 10), (300, 120), (0, 0, 0), -1)
            cv2.rectangle(frame, (10, 10), (300, 120), (255, 255, 255), 2)
            
            cv2.putText(frame, f'Reps: {self.counter}', (20, 40), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            cv2.putText(frame, f'Stage: {self.stage.title()}', (20, 70), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            cv2.putText(frame, f'Form: {int(self.form_score)}%', (20, 100), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, 
                       (0, 255, 0) if self.form_score >= 80 else (0, 255, 255) if self.form_score >= 60 else (0, 0, 255), 2)
            
            # Display warnings/feedback
            if self.warnings:
                y_offset = 150
                for i, warning in enumerate(self.warnings[:3]):  # Show max 3 warnings
                    cv2.putText(frame, warning, (20, y_offset + i * 30), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            return frame
            
        except Exception as e:
            print(f"Error drawing squat analysis: {e}")
            return frame
    
    def get_session_stats(self) -> Dict[str, Any]:
        """Get current session statistics"""
        return {
            "total_reps": self.counter,
            "current_stage": self.stage,
            "form_score": self.form_score,
            "min_angle_reached": self.min_angle_reached,
            "warnings": self.warnings
        }
    
    def reset_session(self):
        """Reset the tracking session"""
        self.counter = 0
        self.stage = "up"
        self.previous_stage = "up"
        self.form_score = 100.0
        self.warnings = []
        self.min_angle_reached = 180
        self.max_depth_reached = 0
        self.rep_in_progress = False
        self.angle_history = []

# Example usage
if __name__ == "__main__":
    print("Improved Squat Tracker initialized")
    tracker = ImprovedSquatTracker()
    print("Ready for squat analysis!")
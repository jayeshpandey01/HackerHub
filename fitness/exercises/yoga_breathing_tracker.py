import cv2
import mediapipe as mp
import time
import numpy as np

# Helper function to calculate distance between two points
def calculate_distance(a, b):
    a = np.array(a)
    b = np.array(b)
    return np.linalg.norm(a - b)

# Yoga Breathing: Tracks chest expansion/contraction for breathing cycles
class YogaBreathing:
    def __init__(self):
        self.breath_counter = 0
        self.stage = "Initial"
        self.distance_threshold_max = None  # Calibrated dynamically
        self.distance_threshold_min = None  # Calibrated dynamically
        self.last_update = time.time()
        self.pace = 0  # Breaths per minute
        self.start_time = time.time()
        self.breath_times = []  # Track times of breaths for pace calculation
        self.distances = []  # Store distances for calibration
        self.calibration_frames = 30  # Number of frames to calibrate thresholds
        self.frame_count = 0

    def track_breathing(self, landmarks, frame):
        # Use shoulder landmarks to measure chest expansion (distance between shoulders)
        left_shoulder = [int(landmarks[11].x * frame.shape[1]), int(landmarks[11].y * frame.shape[0])]
        right_shoulder = [int(landmarks[12].x * frame.shape[1]), int(landmarks[12].y * frame.shape[0])]

        # Calculate distance between shoulders
        distance = calculate_distance(left_shoulder, right_shoulder)

        # Draw lines and points
        cv2.line(frame, left_shoulder, right_shoulder, (0, 255, 0), 2)
        cv2.circle(frame, left_shoulder, 5, (0, 0, 255), -1)
        cv2.circle(frame, right_shoulder, 5, (0, 0, 255), -1)

        # Display distance
        mid_point = [(left_shoulder[0] + right_shoulder[0]) // 2, (left_shoulder[1] + right_shoulder[1]) // 2]
        cv2.putText(frame, f'Shoulder Distance: {int(distance)}', (mid_point[0] + 10, mid_point[1] - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        current_time = time.time()

        # Calibration phase: Collect distances to set thresholds
        if self.frame_count < self.calibration_frames:
            self.distances.append(distance)
            self.frame_count += 1
            self.stage = f"Calibrating ({self.frame_count}/{self.calibration_frames})"
            if self.frame_count == self.calibration_frames:
                # Set thresholds based on collected distances
                self.distance_threshold_max = max(self.distances) * 0.95  # Slightly below max for inhale
                self.distance_threshold_min = min(self.distances) * 1.05  # Slightly above min for exhale
            return self.breath_counter, self.stage, self.pace

        # Logic: Count a breath cycle when chest expands (inhale) and contracts (exhale)
        if distance > self.distance_threshold_max and self.stage != "Inhale":
            self.stage = "Inhale"
        elif distance < self.distance_threshold_min and self.stage == "Inhale":
            self.stage = "Exhale"
            if current_time - self.last_update > 2:  # Ensure slow breathing (min 2s per cycle)
                self.breath_counter += 1
                self.last_update = current_time
                self.breath_times.append(current_time)
                # Calculate pace (breaths per minute) over last 10 breaths or 60 seconds
                if len(self.breath_times) > 1:
                    recent_breaths = [t for t in self.breath_times if current_time - t < 60]
                    self.breath_times = recent_breaths
                    if len(recent_breaths) >= 2:
                        time_span = recent_breaths[-1] - recent_breaths[0]
                        self.pace = (len(recent_breaths) - 1) * 60 / time_span if time_span > 0 else 0

        # Display breath count and pace
        cv2.putText(frame, f'Breaths: {self.breath_counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Pace: {int(self.pace)} breaths/min', (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        return self.breath_counter, self.stage, self.pace

# Main running model
if __name__ == "__main__":
    print("Starting Yoga Breathing Tracker (Restorative/Gentle Hatha Yoga)")
    print("Focus on slow, deep breathing. Press 'q' to quit.")

    mp_drawing = mp.solutions.drawing_utils
    mp_pose = mp.solutions.pose
    exercise = YogaBreathing()
    
    cap = cv2.VideoCapture(0)  # Open webcam

    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                print("Camera error. Exiting.")
                break

            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            results = pose.process(image)
            image.flags.writeable = True
            frame = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            if results.pose_landmarks:
                mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
                breaths, stage, pace = exercise.track_breathing(results.pose_landmarks.landmark, frame)
            else:
                cv2.putText(frame, 'No person detected', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('Yoga Breathing Tracker', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
    print(f"Exercise complete. Total breaths: {exercise.breath_counter}")
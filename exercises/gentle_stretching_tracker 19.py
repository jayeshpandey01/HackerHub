import cv2
import mediapipe as mp
import time
import numpy as np

# Helper function to calculate angle between three points
def calculate_angle(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    ba = a - b
    bc = c - b
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
    return np.degrees(angle)

# Gentle Stretching: Tracks safe forward bending to avoid overstretching
class GentleStretching:
    def __init__(self):
        self.counter = 0
        self.stage = "Initial"
        self.angle_threshold_max = 120  # Max torso angle for gentle forward bend (safe limit)
        self.angle_threshold_min = 160  # Neutral standing or slight bend
        self.last_update = time.time()

    def track_stretch(self, landmarks, frame):
        # Use right shoulder, right hip, and right knee to approximate torso angle
        shoulder = [int(landmarks[12].x * frame.shape[1]), int(landmarks[12].y * frame.shape[0])]
        hip = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]
        knee = [int(landmarks[26].x * frame.shape[1]), int(landmarks[26].y * frame.shape[0])]

        # Calculate torso angle
        angle = calculate_angle(shoulder, hip, knee)

        # Draw lines and points
        cv2.line(frame, shoulder, hip, (0, 255, 0), 2)
        cv2.line(frame, hip, knee, (0, 255, 0), 2)
        cv2.circle(frame, hip, 5, (0, 0, 255), -1)

        # Display angle
        cv2.putText(frame, f'Torso Angle: {int(angle)}', (hip[0] + 10, hip[1] - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        current_time = time.time()

        # Logic: Count a stretch when torso bends forward gently and returns
        if angle < self.angle_threshold_max:
            self.stage = "Stretched"
        elif self.angle_threshold_min > angle >= self.angle_threshold_max and self.stage == "Stretched":
            self.stage = "Returning"
            if current_time - self.last_update > 1:  # Prevent rapid counting
                self.counter += 1
                self.last_update = current_time
        elif angle >= self.angle_threshold_min:
            self.stage = "Neutral"

        # Display stretch count and stage
        cv2.putText(frame, f'Stretches: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        return self.counter, self.stage, angle

# Main running model
if __name__ == "__main__":
    print("Starting Gentle Stretching Tracker")
    print("Perform gentle forward bending with care, avoiding overstretching. Press 'q' to quit.")

    mp_drawing = mp.solutions.drawing_utils
    mp_pose = mp.solutions.pose
    exercise = GentleStretching()
    
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
                reps, stage, angle = exercise.track_stretch(results.pose_landmarks.landmark, frame)
            else:
                cv2.putText(frame, 'No person detected', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('Gentle Stretching Tracker', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
    print(f"Exercise complete. Total stretches: {exercise.counter}")
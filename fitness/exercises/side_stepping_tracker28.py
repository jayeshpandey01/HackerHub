import cv2
import mediapipe as mp
import time
import numpy as np

# Side Stepping: Tracks side-to-side steps in small spaces
class SideStepping:
    def __init__(self):
        self.counter = 0
        self.stage = "Initial"
        self.last_update = time.time()
        self.hip_shift_threshold = 50  # Pixel difference for significant hip shift
        self.initial_hip_x = None

    def track_side_step(self, landmarks, frame):
        # Use hip positions to detect lateral movement
        right_hip = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]
        left_hip = [int(landmarks[23].x * frame.shape[1]), int(landmarks[23].y * frame.shape[0])]
        hip_midpoint_x = (right_hip[0] + left_hip[0]) // 2

        # Initialize initial hip position
        if self.initial_hip_x is None:
            self.initial_hip_x = hip_midpoint_x

        # Draw hip points
        cv2.circle(frame, right_hip, 5, (0, 0, 255), -1)
        cv2.circle(frame, left_hip, 5, (0, 0, 255), -1)

        # Calculate horizontal displacement
        hip_shift = hip_midpoint_x - self.initial_hip_x

        # Display hip shift
        cv2.putText(frame, f'Hip Shift: {int(hip_shift)}px', (right_hip[0] + 10, right_hip[1] - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        current_time = time.time()

        # Logic: Count a side step cycle (right to left or left to right)
        if hip_shift > self.hip_shift_threshold and self.stage != "Stepped Right":
            self.stage = "Stepped Right"
        elif hip_shift < -self.hip_shift_threshold and self.stage == "Stepped Right":
            self.stage = "Stepped Left"
            if current_time - self.last_update > 1:  # Prevent rapid counting
                self.counter += 1
                self.last_update = current_time
        elif abs(hip_shift) < self.hip_shift_threshold / 2:
            self.stage = "Neutral"

        # Display step count and stage
        cv2.putText(frame, f'Steps: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, 'Perform side-to-side steps in a small space.', (10, 90), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        return self.counter, self.stage, hip_shift

# Main running model
if __name__ == "__main__":
    print("Starting Side Stepping Tracker")
    print("Perform side-to-side steps in a small space. Press 'q' to quit.")

    mp_drawing = mp.solutions.drawing_utils
    mp_pose = mp.solutions.pose
    exercise = SideStepping()
    
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
                steps, stage, hip_shift = exercise.track_side_step(results.pose_landmarks.landmark, frame)
            else:
                cv2.putText(frame, 'No person detected', (10, 30), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('Side Stepping Tracker', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
    print(f"Exercise complete. Total step cycles: {exercise.counter}")
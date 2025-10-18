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

# Back Extensions: Tracks gentle prone lifting of head and shoulders
class BackExtensions:
    def __init__(self):
        self.counter = 0
        self.stage = "Initial"
        self.angle_threshold_max = 170  # Max back angle (slight lift, gentle extension)
        self.angle_threshold_min = 150  # Neutral prone position
        self.last_update = time.time()

    def track_extension(self, landmarks, frame):
        # Use right shoulder, mid-back (approximated), and right hip
        shoulder = [int(landmarks[12].x * frame.shape[1]), int(landmarks[12].y * frame.shape[0])]
        hip = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]
        # Approximate mid-back as midpoint between shoulders (11 and 12)
        mid_back = [
            int((landmarks[11].x + landmarks[12].x) * frame.shape[1] / 2),
            int((landmarks[11].y + landmarks[12].y) * frame.shape[0] / 2)
        ]

        # Calculate back angle
        angle = calculate_angle(shoulder, mid_back, hip)

        # Draw lines and points
        cv2.line(frame, shoulder, mid_back, (0, 255, 0), 2)
        cv2.line(frame, mid_back, hip, (0, 255, 0), 2)
        cv2.circle(frame, mid_back, 5, (0, 0, 255), -1)

        # Display angle
        cv2.putText(frame, f'Back Angle: {int(angle)}', (mid_back[0] + 10, mid_back[1] - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        current_time = time.time()

        # Logic: Count a back extension when shoulders lift gently and return
        if angle < self.angle_threshold_max:
            self.stage = "Lifted"
        elif self.angle_threshold_min < angle <= self.angle_threshold_max and self.stage == "Lifted":
            self.stage = "Lowering"
            if current_time - self.last_update > 1:  # Prevent rapid counting
                self.counter += 1
                self.last_update = current_time
        elif angle >= self.angle_threshold_min:
            self.stage = "Neutral"

        # Display repetition count and stage
        cv2.putText(frame, f'Reps: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        return self.counter, self.stage, angle

# Main running model
if __name__ == "__main__":
    print("Starting Back Extensions Tracker")
    print("Perform gentle prone lifting of head and shoulders. Press 'q' to quit.")

    mp_drawing = mp.solutions.drawing_utils
    mp_pose = mp.solutions.pose
    exercise = BackExtensions()
    
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
                reps, stage, angle = exercise.track_extension(results.pose_landmarks.landmark, frame)
            else:
                cv2.putText(frame, 'No person detected', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('Back Extensions Tracker', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
    print(f"Exercise complete. Total reps: {exercise.counter}")
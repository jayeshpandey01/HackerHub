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

# Supported Arm Raises: Tracks arm raises with light weight or support band
class SupportedArmRaises:
    def __init__(self):
        self.counter = 0
        self.stage = "Initial"
        self.angle_threshold_max = 90  # Max shoulder angle (arm at shoulder level, comfortable)
        self.angle_threshold_min = 30  # Min angle (arm relaxed, near body)
        self.last_update = time.time()

    def track_arm_raise(self, landmarks, frame):
        # Use right shoulder, hip, and elbow for shoulder angle
        shoulder = [int(landmarks[12].x * frame.shape[1]), int(landmarks[12].y * frame.shape[0])]
        hip = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]
        elbow = [int(landmarks[14].x * frame.shape[1]), int(landmarks[14].y * frame.shape[0])]

        # Calculate shoulder angle
        angle = calculate_angle(hip, shoulder, elbow)

        # Draw lines and points
        cv2.line(frame, shoulder, hip, (0, 255, 0), 2)
        cv2.line(frame, shoulder, elbow, (0, 255, 0), 2)
        cv2.circle(frame, shoulder, 5, (0, 0, 255), -1)

        # Display angle
        cv2.putText(frame, f'Angle: {int(angle)}', (shoulder[0] + 10, shoulder[1] - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        current_time = time.time()

        # Logic: Count a motion when arm raises within comfortable range and returns
        if angle > self.angle_threshold_max:
            self.stage = "Raised"
        elif self.angle_threshold_min < angle < self.angle_threshold_max and self.stage == "Raised":
            self.stage = "Lowering"
            if current_time - self.last_update > 1:  # Prevent rapid counting
                self.counter += 1
                self.last_update = current_time
        elif angle < self.angle_threshold_min:
            self.stage = "Arm Relaxed"

        # Display repetition count and stage
        cv2.putText(frame, f'Reps: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        return self.counter, self.stage, angle

# Main running model
if __name__ == "__main__":
    print("Starting Supported Arm Raises Tracker")
    print("Perform arm raises with a light weight or support band. Press 'q' to quit.")

    mp_drawing = mp.solutions.drawing_utils
    mp_pose = mp.solutions.pose
    exercise = SupportedArmRaises()
    
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
                reps, stage, angle = exercise.track_arm_raise(results.pose_landmarks.landmark, frame)
            else:
                cv2.putText(frame, 'No person detected', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('Supported Arm Raises Tracker', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
    print(f"Exercise complete. Total reps: {exercise.counter}")
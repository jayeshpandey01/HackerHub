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

# Range-of-Motion: Tracks elbow joint flexion and extension
class RangeOfMotion:
    def __init__(self):
        self.counter = 0
        self.stage = "Initial"
        self.angle_threshold_max = 150  # Max elbow angle (near full extension, comfortable)
        self.angle_threshold_min = 60   # Min elbow angle (flexed, comfortable)
        self.last_update = time.time()

    def track_motion(self, landmarks, frame):
        # Use right arm: shoulder, elbow, wrist
        shoulder = [int(landmarks[12].x * frame.shape[1]), int(landmarks[12].y * frame.shape[0])]
        elbow = [int(landmarks[14].x * frame.shape[1]), int(landmarks[14].y * frame.shape[0])]
        wrist = [int(landmarks[16].x * frame.shape[1]), int(landmarks[16].y * frame.shape[0])]

        # Calculate elbow angle
        angle = calculate_angle(shoulder, elbow, wrist)

        # Draw lines and points
        cv2.line(frame, shoulder, elbow, (0, 255, 0), 2)
        cv2.line(frame, elbow, wrist, (0, 255, 0), 2)
        cv2.circle(frame, elbow, 5, (0, 0, 255), -1)

        # Display angle
        cv2.putText(frame, f'Angle: {int(angle)}', (elbow[0] + 10, elbow[1] - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        current_time = time.time()

        # Logic: Count a motion when elbow flexes and extends within comfortable range
        if angle < self.angle_threshold_min:
            self.stage = "Flexed"
        elif self.angle_threshold_min < angle < self.angle_threshold_max and self.stage == "Flexed":
            self.stage = "Extending"
            if current_time - self.last_update > 1:  # Prevent rapid counting
                self.counter += 1
                self.last_update = current_time
        elif angle > self.angle_threshold_max:
            self.stage = "Extended"

        # Display motion count and stage
        cv2.putText(frame, f'Reps: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        return self.counter, self.stage, angle

# Main running model
if __name__ == "__main__":
    print("Starting Range-of-Motion Tracker")
    print("Perform passive or active elbow flexion and extension within a comfortable range. Press 'q' to quit.")

    mp_drawing = mp.solutions.drawing_utils
    mp_pose = mp.solutions.pose
    exercise = RangeOfMotion()
    
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
                reps, stage, angle = exercise.track_motion(results.pose_landmarks.landmark, frame)
            else:
                cv2.putText(frame, 'No person detected', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('Range-of-Motion Tracker', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
    print(f"Exercise complete. Total reps: {exercise.counter}")
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

# Gentle Stretching: Tracks elbow extension for tendon stretching
class GentleStretch:
    def __init__(self):
        self.counter = 0
        self.stage = "Initial"
        self.angle_threshold_max = 160  # Max elbow angle (near full extension, safe)
        self.angle_threshold_min = 120  # Min angle to avoid pain
        self.last_update = time.time()

    def track_stretch(self, landmarks, frame):
        # Use right arm (shoulder, elbow, wrist)
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

        # Logic: Count a stretch when arm extends within safe range and returns
        if angle > self.angle_threshold_max:
            self.stage = "Extended"
        elif self.angle_threshold_min < angle < self.angle_threshold_max and self.stage == "Extended":
            self.stage = "Returning"
            if current_time - self.last_update > 1:  # Prevent rapid counting
                self.counter += 1
                self.last_update = current_time
        elif angle < self.angle_threshold_min:
            self.stage = "Warning: Too Bent (Avoid Pain)"

        # Display stretch count and stage
        cv2.putText(frame, f'Stretches: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        return self.counter, self.stage, angle

# Main running model
if __name__ == "__main__":
    print("Starting Gentle Stretching Tracker")
    print("Perform gentle arm stretches (elbow extension) within a pain-free range. Press 'q' to quit.")

    mp_drawing = mp.solutions.drawing_utils
    mp_pose = mp.solutions.pose
    exercise = GentleStretch()
    
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
                stretches, stage, angle = exercise.track_stretch(results.pose_landmarks.landmark, frame)
            else:
                cv2.putText(frame, 'No person detected', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('Gentle Stretching Tracker', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
    print(f"Exercise complete. Total stretches: {exercise.counter}")
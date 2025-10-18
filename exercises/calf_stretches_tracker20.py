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

# Calf Stretches: Tracks wall stretch with proper form for 20-30 seconds
class CalfStretches:
    def __init__(self):
        self.counter = 0
        self.stage = "Initial"
        self.start_time = None
        self.stretch_duration = 0
        self.min_hold_time = 20  # Minimum hold time in seconds
        self.max_hold_time = 30  # Maximum hold time in seconds
        self.angle_threshold_min = 150  # Minimum ankle angle for proper stretch form
        self.angle_threshold_max = 180  # Maximum ankle angle (near straight leg)
        self.last_update = time.time()

    def track_stretch(self, landmarks, frame):
        # Use right leg: hip, knee, ankle
        hip = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]
        knee = [int(landmarks[26].x * frame.shape[1]), int(landmarks[26].y * frame.shape[0])]
        ankle = [int(landmarks[28].x * frame.shape[1]), int(landmarks[28].y * frame.shape[0])]

        # Calculate ankle angle
        angle = calculate_angle(hip, knee, ankle)

        # Draw lines and points
        cv2.line(frame, hip, knee, (0, 255, 0), 2)
        cv2.line(frame, knee, ankle, (0, 255, 0), 2)
        cv2.circle(frame, knee, 5, (0, 0, 255), -1)

        # Display angle
        cv2.putText(frame, f'Ankle Angle: {int(angle)}', (knee[0] + 10, knee[1] - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        current_time = time.time()

        # Logic: Track stretch duration and form
        if self.angle_threshold_min <= angle <= self.angle_threshold_max:
            if self.stage != "Holding Stretch":
                self.stage = "Holding Stretch"
                self.start_time = current_time
            self.stretch_duration = current_time - self.start_time
            if self.min_hold_time <= self.stretch_duration <= self.max_hold_time:
                self.stage = "Stretch Complete"
                if current_time - self.last_update > 1:  # Prevent rapid counting
                    self.counter += 1
                    self.last_update = current_time
                    self.start_time = None  # Reset for next stretch
                    self.stretch_duration = 0
        else:
            self.stage = "Incorrect Form"
            self.stretch_duration = 0
            self.start_time = None

        # Display stretch count, duration, and stage
        cv2.putText(frame, f'Stretches: {self.counter}', (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Duration: {int(self.stretch_duration)}s', (10, 90), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, 'Hold stretch for 20-30 seconds with straight back leg.', (10, 120), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        return self.counter, self.stage, self.stretch_duration, angle

# Main running model
if __name__ == "__main__":
    print("Starting Calf Stretches Tracker")
    print("Perform wall calf stretches, holding for 20-30 seconds with proper form. Press 'q' to quit.")

    mp_drawing = mp.solutions.drawing_utils
    mp_pose = mp.solutions.pose
    exercise = CalfStretches()
    
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
                reps, stage, duration, angle = exercise.track_stretch(results.pose_landmarks.landmark, frame)
            else:
                cv2.putText(frame, 'No person detected', (10, 30), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('Calf Stretches Tracker', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
    print(f"Exercise complete. Total stretches: {exercise.counter}")
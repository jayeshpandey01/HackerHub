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

# Core Strengthening: Tracks bird-dog and plank exercises
class CoreStrengthening:
    def __init__(self, exercise_type):
        self.exercise_type = exercise_type  # 'bird_dog' or 'plank'
        self.counter = 0
        self.stage = "Initial"
        self.start_time = None
        self.last_update = time.time()
        # Bird-dog thresholds
        self.elbow_angle_threshold = 150  # Near straight arm
        self.knee_angle_threshold = 150  # Near straight leg
        # Plank thresholds
        self.torso_angle_threshold_min = 160  # For straight body alignment
        self.torso_angle_threshold_max = 180
        self.plank_duration = 0

    def track_bird_dog(self, landmarks, frame):
        # Right arm: shoulder, elbow, wrist
        shoulder = [int(landmarks[12].x * frame.shape[1]), int(landmarks[12].y * frame.shape[0])]
        elbow = [int(landmarks[14].x * frame.shape[1]), int(landmarks[14].y * frame.shape[0])]
        wrist = [int(landmarks[16].x * frame.shape[1]), int(landmarks[16].y * frame.shape[0])]
        # Left leg: hip, knee, ankle
        hip = [int(landmarks[23].x * frame.shape[1]), int(landmarks[23].y * frame.shape[0])]
        knee = [int(landmarks[25].x * frame.shape[1]), int(landmarks[25].y * frame.shape[0])]
        ankle = [int(landmarks[27].x * frame.shape[1]), int(landmarks[27].y * frame.shape[0])]

        # Calculate angles
        elbow_angle = calculate_angle(shoulder, elbow, wrist)
        knee_angle = calculate_angle(hip, knee, ankle)

        # Draw lines and points
        cv2.line(frame, shoulder, elbow, (0, 255, 0), 2)
        cv2.line(frame, elbow, wrist, (0, 255, 0), 2)
        cv2.line(frame, hip, knee, (0, 255, 0), 2)
        cv2.line(frame, knee, ankle, (0, 255, 0), 2)
        cv2.circle(frame, elbow, 5, (0, 0, 255), -1)
        cv2.circle(frame, knee, 5, (0, 0, 255), -1)

        # Display angles
        cv2.putText(frame, f'Elbow Angle: {int(elbow_angle)}', (elbow[0] + 10, elbow[1] - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        cv2.putText(frame, f'Knee Angle: {int(knee_angle)}', (knee[0] + 10, knee[1] - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        current_time = time.time()

        # Logic: Count a bird-dog rep when arm and opposite leg extend and return
        if elbow_angle > self.elbow_angle_threshold and knee_angle > self.knee_angle_threshold:
            self.stage = "Extended"
        elif (elbow_angle < self.elbow_angle_threshold - 20 or knee_angle < self.knee_angle_threshold - 20) and self.stage == "Extended":
            self.stage = "Returning"
            if current_time - self.last_update > 1:  # Prevent rapid counting
                self.counter += 1
                self.last_update = current_time
        else:
            self.stage = "Neutral"

        # Display repetition count and stage
        cv2.putText(frame, f'Reps: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        return self.counter, self.stage, elbow_angle, knee_angle

    def track_plank(self, landmarks, frame):
        # Torso alignment: shoulder, hip, ankle
        shoulder = [int(landmarks[12].x * frame.shape[1]), int(landmarks[12].y * frame.shape[0])]
        hip = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]
        ankle = [int(landmarks[28].x * frame.shape[1]), int(landmarks[28].y * frame.shape[0])]

        # Calculate torso angle
        torso_angle = calculate_angle(shoulder, hip, ankle)

        # Draw lines and points
        cv2.line(frame, shoulder, hip, (0, 255, 0), 2)
        cv2.line(frame, hip, ankle, (0, 255, 0), 2)
        cv2.circle(frame, hip, 5, (0, 0, 255), -1)

        # Display angle
        cv2.putText(frame, f'Torso Angle: {int(torso_angle)}', (hip[0] + 10, hip[1] - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        current_time = time.time()

        # Logic: Track plank duration and alignment
        if self.torso_angle_threshold_min <= torso_angle <= self.torso_angle_threshold_max:
            if self.stage != "Holding Plank":
                self.stage = "Holding Plank"
                self.start_time = current_time
            self.plank_duration = current_time - self.start_time
        else:
            self.stage = "Incorrect Alignment"
            self.plank_duration = 0
            self.start_time = None

        # Display duration and stage
        cv2.putText(frame, f'Duration: {int(self.plank_duration)}s', (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        return self.plank_duration, self.stage, torso_angle

# Main running model
if __name__ == "__main__":
    exercise_choice = input("Choose exercise (bird_dog or plank): ").lower()
    if exercise_choice not in ['bird_dog', 'plank']:
        print("Invalid choice. Defaulting to bird_dog.")
        exercise_choice = 'bird_dog'

    print(f"Starting Core Strengthening Tracker ({exercise_choice.replace('_', ' ').title()})")
    print(f"Perform {exercise_choice.replace('_', ' ')} with proper form. Press 'q' to quit.")

    mp_drawing = mp.solutions.drawing_utils
    mp_pose = mp.solutions.pose
    exercise = CoreStrengthening(exercise_choice)
    
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
                if exercise.exercise_type == 'bird_dog':
                    reps, stage, elbow_angle, knee_angle = exercise.track_bird_dog(results.pose_landmarks.landmark, frame)
                else:  # plank
                    duration, stage, torso_angle = exercise.track_plank(results.pose_landmarks.landmark, frame)
            else:
                cv2.putText(frame, 'No person detected', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('Core Strengthening Tracker', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
    if exercise.exercise_type == 'bird_dog':
        print(f"Exercise complete. Total reps: {exercise.counter}")
    else:
        print(f"Exercise complete. Total plank duration: {int(exercise.plank_duration)} seconds")
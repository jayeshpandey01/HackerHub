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

# Foot Flexes: Tracks toe curling and extension (e.g., towel or object picking)
class FootFlexes:
    def __init__(self):
        self.counter = 0
        self.stage = "Initial"
        self.angle_threshold_curl = 140  # Angle for toe curl (flexed toes)
        self.angle_threshold_extend = 160  # Angle for extended toes (neutral)
        self.last_update = time.time()

    def track_foot_flex(self, landmarks, frame):
        # Use right foot: toe (landmark 28), ankle (landmark 28), and heel (landmark 30)
        toe = [int(landmarks[28].x * frame.shape[1]), int(landmarks[28].y * frame.shape[0])]
        ankle = [int(landmarks[28].x * frame.shape[1]), int(landmarks[28].y * frame.shape[0])]  # Same as toe for approximation
        heel = [int(landmarks[30].x * frame.shape[1]), int(landmarks[30].y * frame.shape[0])]

        # Approximate toe angle using foot landmarks (since MediaPipe pose has limited foot detail)
        # Use knee (26) as a proxy for upper foot reference to detect curl
        knee = [int(landmarks[26].x * frame.shape[1]), int(landmarks[26].y * frame.shape[0])]
        angle = calculate_angle(knee, ankle, heel)

        # Draw lines and points
        cv2.line(frame, knee, ankle, (0, 255, 0), 2)
        cv2.line(frame, ankle, heel, (0, 255, 0), 2)
        cv2.circle(frame, ankle, 5, (0, 0, 255), -1)

        # Display angle
        cv2.putText(frame, f'Foot Angle: {int(angle)}', (ankle[0] + 10, ankle[1] - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        current_time = time.time()

        # Logic: Count a toe curl when angle decreases (curl) and increases (extend)
        if angle < self.angle_threshold_curl and self.stage != "Curled":
            self.stage = "Curled"
        elif angle > self.angle_threshold_extend and self.stage == "Curled":
            self.stage = "Extended"
            if current_time - self.last_update > 1:  # Prevent rapid counting
                self.counter += 1
                self.last_update = current_time
        elif angle >= self.angle_threshold_extend:
            self.stage = "Extended"

        # Display repetition count and stage
        cv2.putText(frame, f'Reps: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, 'Curl and extend toes (e.g., towel or object picking).', (10, 90), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        return self.counter, self.stage, angle

# Main running model
if __name__ == "__main__":
    print("Starting Foot Flexes Tracker")
    print("Perform toe curling and extension (e.g., around a towel or picking objects). Press 'q' to quit.")

    mp_drawing = mp.solutions.drawing_utils
    mp_pose = mp.solutions.pose
    exercise = FootFlexes()
    
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
                reps, stage, angle = exercise.track_foot_flex(results.pose_landmarks.landmark, frame)
            else:
                cv2.putText(frame, 'No person detected', (10, 30), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('Foot Flexes Tracker', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
    print(f"Exercise complete. Total reps: {exercise.counter}")
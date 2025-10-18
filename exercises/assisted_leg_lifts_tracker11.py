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

# Assisted Leg Lifts: Tracks leg raises with caregiver or strap support
class AssistedLegLifts:
    def __init__(self):
        self.counter = 0
        self.stage = "Initial"
        self.angle_threshold_high = 120  # Knee angle for raised leg (assisted lift)
        self.angle_threshold_low = 160  # Knee angle for leg lowered (near straight)
        self.last_update = time.time()

    def track_leg_lift(self, landmarks, frame):
        # Use right leg: hip, knee, ankle
        hip = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]
        knee = [int(landmarks[26].x * frame.shape[1]), int(landmarks[26].y * frame.shape[0])]
        ankle = [int(landmarks[28].x * frame.shape[1]), int(landmarks[28].y * frame.shape[0])]

        # Calculate knee angle
        angle = calculate_angle(hip, knee, ankle)

        # Draw lines and points
        cv2.line(frame, hip, knee, (0, 255, 0), 2)
        cv2.line(frame, knee, ankle, (0, 255, 0), 2)
        cv2.circle(frame, knee, 5, (0, 0, 255), -1)

        # Display angle
        cv2.putText(frame, f'Knee Angle: {int(angle)}', (knee[0] + 10, knee[1] - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        current_time = time.time()

        # Logic: Count a leg lift when knee angle decreases (leg raised) and increases (leg lowered)
        if angle < self.angle_threshold_high and self.stage != "Raised":
            self.stage = "Raised"
        elif angle > self.angle_threshold_low and self.stage == "Raised":
            self.stage = "Lowered"
            if current_time - self.last_update > 1:  # Prevent rapid counting (min 1s between reps)
                self.counter += 1
                self.last_update = current_time
        elif angle >= self.angle_threshold_low:
            self.stage = "Lowered"

        # Display repetition count and stage
        cv2.putText(frame, f'Reps: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        return self.counter, self.stage, angle

# Main running model
if __name__ == "__main__":
    print("Starting Assisted Leg Lifts Tracker")
    print("Perform leg lifts with caregiver or strap support. Press 'q' to quit.")

    mp_drawing = mp.solutions.drawing_utils
    mp_pose = mp.solutions.pose
    exercise = AssistedLegLifts()
    
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
                reps, stage, angle = exercise.track_leg_lift(results.pose_landmarks.landmark, frame)
            else:
                cv2.putText(frame, 'No person detected', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('Assisted Leg Lifts Tracker', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
    print(f"Exercise complete. Total reps: {exercise.counter}")
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

# Seated Marching: Tracks alternating leg lifts while seated
class SeatedMarching:
    def __init__(self):
        self.counter = 0
        self.stage = "Initial"
        self.last_update = time.time()
        self.right_knee_raised = False
        self.left_knee_raised = False
        # Knee angle thresholds
        self.knee_angle_threshold_raised = 90   # Angle for raised knee
        self.knee_angle_threshold_lowered = 150  # Angle for lowered knee

    def track_marching(self, landmarks, frame):
        # Use right and left leg: hip, knee, ankle
        right_hip = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]
        right_knee = [int(landmarks[26].x * frame.shape[1]), int(landmarks[26].y * frame.shape[0])]
        right_ankle = [int(landmarks[28].x * frame.shape[1]), int(landmarks[28].y * frame.shape[0])]
        left_hip = [int(landmarks[23].x * frame.shape[1]), int(landmarks[23].y * frame.shape[0])]
        left_knee = [int(landmarks[25].x * frame.shape[1]), int(landmarks[25].y * frame.shape[0])]
        left_ankle = [int(landmarks[27].x * frame.shape[1]), int(landmarks[27].y * frame.shape[0])]

        # Calculate knee angles
        right_knee_angle = calculate_angle(right_hip, right_knee, right_ankle)
        left_knee_angle = calculate_angle(left_hip, left_knee, left_ankle)

        # Draw lines and points
        cv2.line(frame, right_hip, right_knee, (0, 255, 0), 2)
        cv2.line(frame, right_knee, right_ankle, (0, 255, 0), 2)
        cv2.line(frame, left_hip, left_knee, (0, 255, 0), 2)
        cv2.line(frame, left_knee, left_ankle, (0, 255, 0), 2)
        cv2.circle(frame, right_knee, 5, (0, 0, 255), -1)
        cv2.circle(frame, left_knee, 5, (0, 0, 255), -1)

        # Display angles
        cv2.putText(frame, f'Right Knee Angle: {int(right_knee_angle)}', (right_knee[0] + 10, right_knee[1] - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        cv2.putText(frame, f'Left Knee Angle: {int(left_knee_angle)}', (left_knee[0] + 10, left_knee[1] - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        current_time = time.time()

        # Logic: Track alternating leg lifts
        if right_knee_angle < self.knee_angle_threshold_raised and not self.right_knee_raised:
            self.stage = "Right Knee Raised"
            self.right_knee_raised = True
        elif right_knee_angle > self.knee_angle_threshold_lowered and self.right_knee_raised and not self.left_knee_raised:
            self.stage = "Right Knee Lowered"
            self.right_knee_raised = False
        elif left_knee_angle < self.knee_angle_threshold_raised and not self.left_knee_raised and not self.right_knee_raised:
            self.stage = "Left Knee Raised"
            self.left_knee_raised = True
        elif left_knee_angle > self.knee_angle_threshold_lowered and self.left_knee_raised:
            self.stage = "Left Knee Lowered"
            self.left_knee_raised = False
            if current_time - self.last_update > 1:  # Prevent rapid counting
                self.counter += 1
                self.last_update = current_time
        elif not self.right_knee_raised and not self.left_knee_raised:
            self.stage = "Neutral"

        # Display repetition count and stage
        cv2.putText(frame, f'Reps: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, 'Alternate lifting legs while seated.', (10, 90), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        return self.counter, self.stage, right_knee_angle, left_knee_angle

# Main running model
if __name__ == "__main__":
    print("Starting Seated Marching Tracker")
    print("Perform seated marching by alternating leg lifts. Press 'q' to quit.")

    mp_drawing = mp.solutions.drawing_utils
    mp_pose = mp.solutions.pose
    exercise = SeatedMarching()
    
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
                reps, stage, right_angle, left_angle = exercise.track_marching(results.pose_landmarks.landmark, frame)
            else:
                cv2.putText(frame, 'No person detected', (10, 30), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('Seated Marching Tracker', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
    print(f"Exercise complete. Total reps: {exercise.counter}")
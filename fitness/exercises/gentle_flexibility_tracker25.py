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

# Flexibility: Tracks gentle side bend stretching to improve range of motion
class GentleFlexibility:
    def __init__(self):
        self.counter = 0
        self.stage = "Initial"
        self.angle_threshold_max = 150  # Max torso angle for gentle side bend (safe limit)
        self.angle_threshold_min = 170  # Neutral standing or slight bend
        self.last_update = time.time()

    def track_side_bend(self, landmarks, frame):
        # Use right shoulder, right hip, and left hip to approximate torso angle for side bend
        shoulder = [int(landmarks[12].x * frame.shape[1]), int(landmarks[12].y * frame.shape[0])]
        right_hip = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]
        left_hip = [int(landmarks[23].x * frame.shape[1]), int(landmarks[23].y * frame.shape[0])]

        # Calculate torso angle
        angle = calculate_angle(shoulder, right_hip, left_hip)

        # Draw lines and points
        cv2.line(frame, shoulder, right_hip, (0, 255, 0), 2)
        cv2.line(frame, right_hip, left_hip, (0, 255, 0), 2)
        cv2.circle(frame, right_hip, 5, (0, 0, 255), -1)

        # Display angle
        cv2.putText(frame, f'Torso Angle: {int(angle)}', (right_hip[0] + 10, right_hip[1] - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        current_time = time.time()

        # Logic: Count a side bend when torso bends laterally and returns
        if angle < self.angle_threshold_max:
            self.stage = "Bent"
        elif self.angle_threshold_min > angle >= self.angle_threshold_max and self.stage == "Bent":
            self.stage = "Returning"
            if current_time - self.last_update > 1:  # Prevent rapid counting
                self.counter += 1
                self.last_update = current_time
        elif angle >= self.angle_threshold_min:
            self.stage = "Neutral"

        # Display stretch count and stage
        cv2.putText(frame, f'Stretches: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, 'Perform gentle side bend stretches.', (10, 90), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        return self.counter, self.stage, angle

# Main running model
if __name__ == "__main__":
    print("Starting Gentle Flexibility Tracker")
    print("Perform gentle side bend stretches to improve range of motion. Press 'q' to quit.")

    mp_drawing = mp.solutions.drawing_utils
    mp_pose = mp.solutions.pose
    exercise = GentleFlexibility()
    
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
                reps, stage, angle = exercise.track_side_bend(results.pose_landmarks.landmark, frame)
            else:
                cv2.putText(frame, 'No person detected', (10, 30), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('Gentle Flexibility Tracker', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
    print(f"Exercise complete. Total stretches: {exercise.counter}")
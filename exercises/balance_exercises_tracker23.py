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

# Balance Exercises: Tracks weight shifts and toe-heel rocking
class BalanceExercises:
    def __init__(self, exercise_type):
        self.exercise_type = exercise_type  # 'weight_shift' or 'toe_heel_rocking'
        self.counter = 0
        self.stage = "Initial"
        self.last_update = time.time()
        # Weight shift thresholds
        self.hip_shift_threshold = 50  # Pixel difference for significant hip shift
        self.initial_hip_x = None
        # Toe-heel rocking thresholds
        self.ankle_angle_threshold_toe = 160  # Angle for toe-up position
        self.ankle_angle_threshold_heel = 140  # Angle for heel-up position

    def track_weight_shift(self, landmarks, frame):
        # Use hip positions to detect weight shift
        right_hip = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]
        left_hip = [int(landmarks[23].x * frame.shape[1]), int(landmarks[23].y * frame.shape[0])]
        hip_midpoint_x = (right_hip[0] + left_hip[0]) // 2

        # Initialize initial hip position
        if self.initial_hip_x is None:
            self.initial_hip_x = hip_midpoint_x

        # Draw hip points
        cv2.circle(frame, right_hip, 5, (0, 0, 255), -1)
        cv2.circle(frame, left_hip, 5, (0, 0, 255), -1)

        # Display hip shift
        hip_shift = hip_midpoint_x - self.initial_hip_x
        cv2.putText(frame, f'Hip Shift: {int(hip_shift)}px', (right_hip[0] + 10, right_hip[1] - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        current_time = time.time()

        # Logic: Count a weight shift cycle (left to right or right to left)
        if hip_shift > self.hip_shift_threshold and self.stage != "Shifted Right":
            self.stage = "Shifted Right"
        elif hip_shift < -self.hip_shift_threshold and self.stage == "Shifted Right":
            self.stage = "Shifted Left"
            if current_time - self.last_update > 1:  # Prevent rapid counting
                self.counter += 1
                self.last_update = current_time
        elif abs(hip_shift) < self.hip_shift_threshold / 2:
            self.stage = "Neutral"

        # Display repetition count and stage
        cv2.putText(frame, f'Reps: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        return self.counter, self.stage, hip_shift

    def track_toe_heel_rocking(self, landmarks, frame):
        # Use right leg: knee, ankle, heel (landmark 30)
        knee = [int(landmarks[26].x * frame.shape[1]), int(landmarks[26].y * frame.shape[0])]
        ankle = [int(landmarks[28].x * frame.shape[1]), int(landmarks[28].y * frame.shape[0])]
        heel = [int(landmarks[30].x * frame.shape[1]), int(landmarks[30].y * frame.shape[0])]

        # Calculate ankle angle
        angle = calculate_angle(knee, ankle, heel)

        # Draw lines and points
        cv2.line(frame, knee, ankle, (0, 255, 0), 2)
        cv2.line(frame, ankle, heel, (0, 255, 0), 2)
        cv2.circle(frame, ankle, 5, (0, 0, 255), -1)

        # Display angle
        cv2.putText(frame, f'Ankle Angle: {int(angle)}', (ankle[0] + 10, ankle[1] - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        current_time = time.time()

        # Logic: Count a toe-heel rock cycle
        if angle > self.ankle_angle_threshold_toe and self.stage != "Toe Up":
            self.stage = "Toe Up"
        elif angle < self.ankle_angle_threshold_heel and self.stage == "Toe Up":
            self.stage = "Heel Up"
            if current_time - self.last_update > 1:  # Prevent rapid counting
                self.counter += 1
                self.last_update = current_time
        elif self.ankle_angle_threshold_heel < angle < self.ankle_angle_threshold_toe:
            self.stage = "Neutral"

        # Display repetition count and stage
        cv2.putText(frame, f'Reps: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        return self.counter, self.stage, angle

# Main running model
if __name__ == "__main__":
    exercise_choice = input("Choose exercise (weight_shift or toe_heel_rocking): ").lower()
    if exercise_choice not in ['weight_shift', 'toe_heel_rocking']:
        print("Invalid choice. Defaulting to weight_shift.")
        exercise_choice = 'weight_shift'

    print(f"Starting Balance Exercises Tracker ({exercise_choice.replace('_', ' ').title()})")
    print(f"Perform {exercise_choice.replace('_', ' ')} near a support for safety. Press 'q' to quit.")

    mp_drawing = mp.solutions.drawing_utils
    mp_pose = mp.solutions.pose
    exercise = BalanceExercises(exercise_choice)
    
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
                if exercise.exercise_type == 'weight_shift':
                    reps, stage, hip_shift = exercise.track_weight_shift(results.pose_landmarks.landmark, frame)
                else:  # toe_heel_rocking
                    reps, stage, angle = exercise.track_toe_heel_rocking(results.pose_landmarks.landmark, frame)
            else:
                cv2.putText(frame, 'No person detected', (10, 30), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('Balance Exercises Tracker', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
    print(f"Exercise complete. Total reps: {exercise.counter}")
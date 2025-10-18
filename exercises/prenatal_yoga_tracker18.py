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

# Prenatal Yoga: Tracks pelvic tilts and diaphragmatic breathing
class PrenatalYoga:
    def __init__(self, exercise_type):
        self.exercise_type = exercise_type  # 'pelvic_tilt' or 'breathing'
        self.counter = 0
        self.stage = "Initial"
        self.last_update = time.time()
        self.current_cycle_start = time.time()
        # Pelvic tilt thresholds
        self.pelvic_angle_threshold_max = 170  # Anterior pelvic tilt
        self.pelvic_angle_threshold_min = 150  # Neutral or posterior tilt
        # Breathing durations
        self.inhale_duration = 4  # Seconds for inhale
        self.exhale_duration = 4  # Seconds for exhale
        self.rest_duration = 2    # Seconds for rest between breaths

    def track_pelvic_tilt(self, landmarks, frame):
        # Use right hip, left hip, and midpoint of shoulders to approximate pelvic tilt
        right_hip = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]
        left_hip = [int(landmarks[23].x * frame.shape[1]), int(landmarks[23].y * frame.shape[0])]
        # Midpoint of shoulders (11 and 12)
        shoulder_mid = [
            int((landmarks[11].x + landmarks[12].x) * frame.shape[1] / 2),
            int((landmarks[11].y + landmarks[12].y) * frame.shape[0] / 2)
        ]

        # Calculate pelvic angle (approximation using hips and shoulder midpoint)
        angle = calculate_angle(right_hip, left_hip, shoulder_mid)

        # Draw lines and points
        cv2.line(frame, right_hip, left_hip, (0, 255, 0), 2)
        cv2.line(frame, left_hip, shoulder_mid, (0, 255, 0), 2)
        cv2.circle(frame, left_hip, 5, (0, 0, 255), -1)

        # Display angle
        cv2.putText(frame, f'Pelvic Angle: {int(angle)}', (left_hip[0] + 10, left_hip[1] - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        current_time = time.time()

        # Logic: Count a pelvic tilt when pelvis moves anteriorly and returns
        if angle < self.pelvic_angle_threshold_max:
            self.stage = "Tilted"
        elif self.pelvic_angle_threshold_min < angle <= self.pelvic_angle_threshold_max and self.stage == "Tilted":
            self.stage = "Returning"
            if current_time - self.last_update > 1:  # Prevent rapid counting
                self.counter += 1
                self.last_update = current_time
        elif angle >= self.pelvic_angle_threshold_min:
            self.stage = "Neutral"

        # Display repetition count and stage
        cv2.putText(frame, f'Reps: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        return self.counter, self.stage, angle

    def track_breathing(self, frame):
        current_time = time.time()
        elapsed_time = current_time - self.current_cycle_start

        # Logic: Guide through inhale, exhale, and rest phases
        if self.stage == "Rest" and elapsed_time >= self.rest_duration:
            self.stage = "Inhale"
            self.current_cycle_start = current_time
            elapsed_time = 0
        elif self.stage == "Inhale" and elapsed_time >= self.inhale_duration:
            self.stage = "Exhale"
            self.current_cycle_start = current_time
            elapsed_time = 0
        elif self.stage == "Exhale" and elapsed_time >= self.exhale_duration:
            self.stage = "Rest"
            self.current_cycle_start = current_time
            self.counter += 1  # Count a full breathing cycle
            self.last_update = current_time
            elapsed_time = 0

        # Create a blank frame for text display
        frame = np.zeros((480, 640, 3), dtype=np.uint8)

        # Display instructions, stage, and timer
        cv2.putText(frame, 'Prenatal Yoga Breathing Tracker', (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 70), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Breaths: {self.counter}', (10, 110), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Time in Stage: {int(elapsed_time)}s', (10, 150), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, 'Inhale deeply and exhale slowly as guided.', (10, 190), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.putText(frame, 'Press "q" to quit.', (10, 230), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        return self.counter, self.stage, elapsed_time

# Main running model
if __name__ == "__main__":
    exercise_choice = input("Choose exercise (pelvic_tilt or breathing): ").lower()
    if exercise_choice not in ['pelvic_tilt', 'breathing']:
        print("Invalid choice. Defaulting to pelvic_tilt.")
        exercise_choice = 'pelvic_tilt'

    print(f"Starting Prenatal Yoga Tracker ({exercise_choice.replace('_', ' ').title()})")
    print(f"Perform {exercise_choice.replace('_', ' ')} gently. Press 'q' to quit.")

    mp_drawing = mp.solutions.drawing_utils
    mp_pose = mp.solutions.pose
    exercise = PrenatalYoga(exercise_choice)
    
    if exercise.exercise_type == 'pelvic_tilt':
        cap = cv2.VideoCapture(0)  # Open webcam for pelvic tilt tracking
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
                    reps, stage, angle = exercise.track_pelvic_tilt(results.pose_landmarks.landmark, frame)
                else:
                    cv2.putText(frame, 'No person detected', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

                cv2.imshow('Prenatal Yoga Tracker', frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break

        cap.release()
    else:  # Breathing exercise
        while True:
            frame = np.zeros((480, 640, 3), dtype=np.uint8)  # Blank frame for breathing GUI
            reps, stage, elapsed_time = exercise.track_breathing(frame)
            
            cv2.imshow('Prenatal Yoga Tracker', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cv2.destroyAllWindows()
    print(f"Exercise complete. Total {'reps' if exercise.exercise_type == 'pelvic_tilt' else 'breaths'}: {exercise.counter}")
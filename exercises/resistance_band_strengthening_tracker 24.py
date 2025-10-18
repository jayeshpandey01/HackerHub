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

# Strengthening: Tracks resistance band exercises for upper (bicep curl) and lower (leg extension) body
class ResistanceBandStrengthening:
    def __init__(self, exercise_type):
        self.exercise_type = exercise_type  # 'bicep_curl' or 'leg_extension'
        self.counter = 0
        self.stage = "Initial"
        self.last_update = time.time()
        # Bicep curl thresholds
        self.elbow_angle_threshold_contracted = 60  # Elbow angle for contracted bicep
        self.elbow_angle_threshold_extended = 150  # Elbow angle for extended arm
        # Leg extension thresholds
        self.knee_angle_threshold_contracted = 170  # Knee angle for extended leg
        self.knee_angle_threshold_bent = 90  # Knee angle for bent leg

    def track_bicep_curl(self, landmarks, frame):
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
        cv2.putText(frame, f'Elbow Angle: {int(angle)}', (elbow[0] + 10, elbow[1] - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        current_time = time.time()

        # Logic: Count a bicep curl cycle
        if angle < self.elbow_angle_threshold_contracted and self.stage != "Contracted":
            self.stage = "Contracted"
        elif angle > self.elbow_angle_threshold_extended and self.stage == "Contracted":
            self.stage = "Extended"
            if current_time - self.last_update > 1:  # Prevent rapid counting
                self.counter += 1
                self.last_update = current_time
        elif angle >= self.elbow_angle_threshold_extended:
            self.stage = "Extended"

        # Display repetition count and stage
        cv2.putText(frame, f'Reps: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, 'Perform bicep curls with resistance band.', (10, 90), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        return self.counter, self.stage, angle

    def track_leg_extension(self, landmarks, frame):
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

        # Logic: Count a leg extension cycle
        if angle > self.knee_angle_threshold_contracted and self.stage != "Extended":
            self.stage = "Extended"
        elif angle < self.knee_angle_threshold_bent and self.stage == "Extended":
            self.stage = "Bent"
            if current_time - self.last_update > 1:  # Prevent rapid counting
                self.counter += 1
                self.last_update = current_time
        elif angle <= self.knee_angle_threshold_bent:
            self.stage = "Bent"

        # Display repetition count and stage
        cv2.putText(frame, f'Reps: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, 'Perform leg extensions with resistance band.', (10, 90), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        return self.counter, self.stage, angle

# Main running model
if __name__ == "__main__":
    exercise_choice = input("Choose exercise (bicep_curl or leg_extension): ").lower()
    if exercise_choice not in ['bicep_curl', 'leg_extension']:
        print("Invalid choice. Defaulting to bicep_curl.")
        exercise_choice = 'bicep_curl'

    print(f"Starting Resistance Band Strengthening Tracker ({exercise_choice.replace('_', ' ').title()})")
    print(f"Perform {exercise_choice.replace('_', ' ')} with a resistance band. Press 'q' to quit.")

    mp_drawing = mp.solutions.drawing_utils
    mp_pose = mp.solutions.pose
    exercise = ResistanceBandStrengthening(exercise_choice)
    
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
                if exercise.exercise_type == 'bicep_curl':
                    reps, stage, angle = exercise.track_bicep_curl(results.pose_landmarks.landmark, frame)
                else:  # leg_extension
                    reps, stage, angle = exercise.track_leg_extension(results.pose_landmarks.landmark, frame)
            else:
                cv2.putText(frame, 'No person detected', (10, 30), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('Resistance Band Strengthening Tracker', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
    print(f"Exercise complete. Total reps: {exercise.counter}")
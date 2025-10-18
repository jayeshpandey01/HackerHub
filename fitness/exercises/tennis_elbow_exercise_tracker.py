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

# Light Aerobic: Tracks marching or walking indoors by detecting knee lifts
class LightAerobic:
    def __init__(self):
        self.step_counter = 0
        self.stage = "Initial"
        self.angle_threshold_high = 120  # Knee angle for high knee lift (step up)
        self.angle_threshold_low = 160  # Knee angle for leg down (near straight)
        self.last_update = time.time()
        self.pace = 0  # Steps per minute
        self.start_time = time.time()
        self.step_times = []  # Track times of steps for pace calculation

    def track_marching(self, landmarks, frame):
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

        # Logic: Count a step when knee lifts high and returns to near straight
        if angle < self.angle_threshold_high and self.stage != "Up":
            self.stage = "Up"
        elif angle > self.angle_threshold_low and self.stage == "Up":
            self.stage = "Down"
            if current_time - self.last_update > 0.3:  # Prevent rapid counting (min 0.3s between steps)
                self.step_counter += 1
                self.last_update = current_time
                self.step_times.append(current_time)
                # Calculate pace (steps per minute) over last 10 steps or 30 seconds
                if len(self.step_times) > 1:
                    recent_steps = [t for t in self.step_times if current_time - t < 30]
                    self.step_times = recent_steps
                    if len(recent_steps) >= 2:
                        time_span = recent_steps[-1] - recent_steps[0]
                        self.pace = (len(recent_steps) - 1) * 60 / time_span if time_span > 0 else 0

        # Display step count and pace
        cv2.putText(frame, f'Steps: {self.step_counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Pace: {int(self.pace)} steps/min', (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        return self.step_counter, self.stage, self.pace

# Main running model
if __name__ == "__main__":
    print("Starting Light Aerobic Tracker (Marching/Walking Indoors)")
    print("Perform marching or walking in place. Press 'q' to quit.")

    mp_drawing = mp.solutions.drawing_utils
    mp_pose = mp.solutions.pose
    exercise = LightAerobic()
    
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
                steps, stage, pace = exercise.track_marching(results.pose_landmarks.landmark, frame)
            else:
                cv2.putText(frame, 'No person detected', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('Light Aerobic Tracker', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
    print(f"Exercise complete. Total steps: {exercise.step_counter}")
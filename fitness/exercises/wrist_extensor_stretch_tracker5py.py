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

# Wrist Extensor Stretch: Tracks wrist extension with fingers pointing down
class WristExtensorStretch:
    def __init__(self):
        self.counter = 0
        self.stage = "Initial"
        self.angle_threshold_max = 60  # Max wrist extension angle (fingers down, gentle stretch)
        self.angle_threshold_min = 20  # Neutral to slight extension
        self.last_update = time.time()

    def track_stretch(self, hand_landmarks, frame, mp_drawing, mp_hands):
        if not hand_landmarks:
            self.stage = "No hand detected"
            return self.counter, self.stage, 0

        # Use right hand: wrist, index MCP, and index tip
        lm = hand_landmarks[0].landmark
        wrist = [int(lm[0].x * frame.shape[1]), int(lm[0].y * frame.shape[0])]
        index_mcp = [int(lm[5].x * frame.shape[1]), int(lm[5].y * frame.shape[0])]
        index_tip = [int(lm[8].x * frame.shape[1]), int(lm[8].y * frame.shape[0])]

        # Calculate wrist extension angle
        angle = calculate_angle(index_mcp, wrist, index_tip)

        # Draw hand landmarks and lines
        mp_drawing.draw_landmarks(frame, hand_landmarks[0], mp_hands.HAND_CONNECTIONS)
        cv2.line(frame, wrist, index_mcp, (0, 255, 0), 2)
        cv2.line(frame, wrist, index_tip, (0, 255, 0), 2)
        cv2.circle(frame, wrist, 5, (0, 0, 255), -1)

        # Display angle
        cv2.putText(frame, f'Angle: {int(angle)}', (wrist[0] + 10, wrist[1] - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        current_time = time.time()

        # Logic: Count a stretch when wrist extends within safe range and returns
        if angle > self.angle_threshold_max:
            self.stage = "Extended (Fingers Down)"
        elif self.angle_threshold_min < angle < self.angle_threshold_max and self.stage == "Extended (Fingers Down)":
            self.stage = "Returning"
            if current_time - self.last_update > 1:  # Prevent rapid counting
                self.counter += 1
                self.last_update = current_time
        elif angle < self.angle_threshold_min:
            self.stage = "Neutral"

        # Display stretch count and stage
        cv2.putText(frame, f'Stretches: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        return self.counter, self.stage, angle

# Main running model
if __name__ == "__main__":
    print("Starting Wrist Extensor Stretch Tracker")
    print("Extend wrist with fingers pointing down gently. Press 'q' to quit.")

    mp_drawing = mp.solutions.drawing_utils
    mp_hands = mp.solutions.hands
    exercise = WristExtensorStretch()
    
    cap = cv2.VideoCapture(0)  # Open webcam

    with mp_hands.Hands(min_detection_confidence=0.5, min_tracking_confidence=0.5, max_num_hands=1) as hands:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                print("Camera error. Exiting.")
                break

            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            results = hands.process(image)
            image.flags.writeable = True
            frame = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            if results.multi_hand_landmarks:
                counter, stage, angle = exercise.track_stretch(results.multi_hand_landmarks, frame, mp_drawing, mp_hands)
            else:
                cv2.putText(frame, 'No hand detected', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('Wrist Extensor Stretch Tracker', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
    print(f"Exercise complete. Total stretches: {exercise.counter}")
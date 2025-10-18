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

# Light Strengthening: Tracks wrist movement (simulating resistance band)
class LightStrengthening:
    def __init__(self):
        self.counter = 0
        self.stage = "Initial"
        self.angle_threshold_max = 30  # Max wrist angle (slight flexion/extension)
        self.angle_threshold_min = 0   # Neutral wrist
        self.last_update = time.time()

    def track_strengthening(self, hand_landmarks, frame, mp_drawing, mp_hands):
        if not hand_landmarks:
            self.stage = "No hand detected"
            return self.counter, self.stage, 0

        # Use right hand: wrist, index MCP, and pinky MCP for wrist angle
        lm = hand_landmarks[0].landmark
        wrist = [int(lm[0].x * frame.shape[1]), int(lm[0].y * frame.shape[0])]
        index_mcp = [int(lm[5].x * frame.shape[1]), int(lm[5].y * frame.shape[0])]
        pinky_mcp = [int(lm[17].x * frame.shape[1]), int(lm[17].y * frame.shape[0])]

        # Calculate wrist angle (approximate flexion/extension)
        angle = calculate_angle(index_mcp, wrist, pinky_mcp)

        # Draw hand landmarks and lines
        mp_drawing.draw_landmarks(frame, hand_landmarks[0], mp_hands.HAND_CONNECTIONS)
        cv2.line(frame, wrist, index_mcp, (0, 255, 0), 2)
        cv2.line(frame, wrist, pinky_mcp, (0, 255, 0), 2)
        cv2.circle(frame, wrist, 5, (0, 0, 255), -1)

        # Display angle
        cv2.putText(frame, f'Angle: {int(angle)}', (wrist[0] + 10, wrist[1] - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        current_time = time.time()

        # Logic: Count a repetition when wrist angle changes slightly (simulating resistance band movement)
        if angle > self.angle_threshold_max:
            self.stage = "Wrist Flexed/Extended"
        elif self.angle_threshold_min < angle < self.angle_threshold_max and self.stage == "Wrist Flexed/Extended":
            self.stage = "Returning"
            if current_time - self.last_update > 1:  # Prevent rapid counting
                self.counter += 1
                self.last_update = current_time
        elif angle < self.angle_threshold_min:
            self.stage = "Neutral"

        # Display repetition count and stage
        cv2.putText(frame, f'Reps: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        return self.counter, self.stage, angle

# Main running model
if __name__ == "__main__":
    print("Starting Light Strengthening Tracker")
    print("Perform gentle wrist movements as if using a resistance band. Press 'q' to quit.")

    mp_drawing = mp.solutions.drawing_utils
    mp_hands = mp.solutions.hands
    exercise = LightStrengthening()
    
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
                counter, stage, angle = exercise.track_strengthening(results.multi_hand_landmarks, frame, mp_drawing, mp_hands)
            else:
                cv2.putText(frame, 'No hand detected', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('Light Strengthening Tracker', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
    print(f"Exercise complete. Total reps: {exercise.counter}")
import cv2
import mediapipe as mp
import time
import numpy as np

# Finger Tapping: Tracks rapid finger taps on a table using index finger
class FingerTapping:
    def __init__(self):
        self.counter = 0
        self.stage = "Initial"
        self.last_update = time.time()
        self.finger_y_threshold_down = 20  # Pixel difference for finger tap down
        self.finger_y_threshold_up = -20   # Pixel difference for finger tap up
        self.initial_finger_y = None

    def track_finger_tap(self, landmarks, frame):
        # Use right hand's index finger tip (landmark 8)
        index_finger = [int(landmarks[8].x * frame.shape[1]), int(landmarks[8].y * frame.shape[0])]

        # Initialize initial finger position
        if self.initial_finger_y is None:
            self.initial_finger_y = index_finger[1]

        # Draw index finger point
        cv2.circle(frame, index_finger, 5, (0, 0, 255), -1)

        # Calculate vertical displacement
        finger_y_displacement = index_finger[1] - self.initial_finger_y

        # Display displacement
        cv2.putText(frame, f'Finger Y Displacement: {int(finger_y_displacement)}px', (index_finger[0] + 10, index_finger[1] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        current_time = time.time()

        # Logic: Count a tap when finger moves down and up
        if finger_y_displacement > self.finger_y_threshold_down and self.stage != "Down":
            self.stage = "Down"
        elif finger_y_displacement < self.finger_y_threshold_up and self.stage == "Down":
            self.stage = "Up"
            if current_time - self.last_update > 0.2:  # Adjusted for rapid tapping
                self.counter += 1
                self.last_update = current_time
        elif abs(finger_y_displacement) < self.finger_y_threshold_up / 2:
            self.stage = "Neutral"

        # Display tap count and stage
        cv2.putText(frame, f'Taps: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, 'Perform rapid finger taps on table with index finger.', (10, 90),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        return self.counter, self.stage, finger_y_displacement

# Main running model
if __name__ == "__main__":
    print("Starting Finger Tapping Tracker")
    print("Perform rapid finger taps on a table with your right index finger. Press 'q' to quit.")

    mp_drawing = mp.solutions.drawing_utils
    mp_hands = mp.solutions.hands
    exercise = FingerTapping()
    
    cap = cv2.VideoCapture(0)  # Open webcam

    with mp_hands.Hands(min_detection_confidence=0.5, min_tracking_confidence=0.5) as hands:
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
                for hand_landmarks in results.multi_hand_landmarks:
                    # Assume right hand is detected (first hand)
                    mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
                    reps, stage, displacement = exercise.track_finger_tap(hand_landmarks.landmark, frame)
            else:
                cv2.putText(frame, 'No hand detected', (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('Finger Tapping Tracker', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
    print(f"Exercise complete. Total taps: {exercise.counter}")
import cv2
import mediapipe as mp
import time
import numpy as np

# Helper function to calculate 3D distance between two landmarks
def calculate_distance(p1, p2):
    return np.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2 + (p1.z - p2.z)**2)

# Grip Strengthening: Tracks finger closure (simulating squeezing a stress ball)
class GripStrengthening:
    def __init__(self):
        self.counter = 0
        self.stage = "Initial"
        self.distance_threshold = 0.05  # Normalized distance for finger closure
        self.last_update = time.time()

    def track_grip(self, hand_landmarks, frame, mp_drawing, mp_hands):
        if not hand_landmarks:
            self.stage = "No hand detected"
            return self.counter, self.stage

        # Use right hand: thumb tip to index tip distance
        lm = hand_landmarks[0].landmark
        thumb_tip = lm[4]
        index_tip = lm[8]
        wrist = [int(lm[0].x * frame.shape[1]), int(lm[0].y * frame.shape[0])]

        # Calculate distance between thumb and index finger tips
        distance = calculate_distance(thumb_tip, index_tip)

        # Draw hand landmarks
        mp_drawing.draw_landmarks(frame, hand_landmarks[0], mp_hands.HAND_CONNECTIONS)

        # Display distance
        cv2.putText(frame, f'Distance: {distance:.3f}', (wrist[0] + 10, wrist[1] - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        current_time = time.time()

        # Logic: Count a squeeze when fingers close and release
        if distance < self.distance_threshold:
            self.stage = "Squeezing"
        elif distance >= self.distance_threshold and self.stage == "Squeezing":
            self.stage = "Released"
            if current_time - self.last_update > 0.5:  # Prevent rapid counting (min 0.5s between squeezes)
                self.counter += 1
                self.last_update = current_time
        else:
            self.stage = "Open Hand"

        # Display repetition count and stage
        cv2.putText(frame, f'Reps: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        return self.counter, self.stage

# Main running model
if __name__ == "__main__":
    print("Starting Grip Strengthening Tracker")
    print("Squeeze and release a stress ball or soft object repeatedly. Press 'q' to quit.")

    mp_drawing = mp.solutions.drawing_utils
    mp_hands = mp.solutions.hands
    exercise = GripStrengthening()
    
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
                counter, stage = exercise.track_grip(results.multi_hand_landmarks, frame, mp_drawing, mp_hands)
            else:
                cv2.putText(frame, 'No hand detected', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('Grip Strengthening Tracker', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
    print(f"Exercise complete. Total reps: {exercise.counter}")
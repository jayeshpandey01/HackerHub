import cv2
import mediapipe as mp
import time
import numpy as np

# Helper function to calculate 3D distance between two landmarks
def calculate_distance(p1, p2):
    return np.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2 + (p1.z - p2.z)**2)

# Finger-to-Thumb Touches: Tracks finger-to-thumb dexterity exercises
class FingerToThumb:
    def __init__(self):
        self.counters = {
            'Index': 0,
            'Middle': 0,
            'Ring': 0,
            'Pinky': 0
        }
        self.stages = {
            'Index': "Open",
            'Middle': "Open",
            'Ring': "Open",
            'Pinky': "Open"
        }
        self.distance_threshold = 0.05  # Normalized distance for finger-to-thumb touch
        self.last_update = {
            'Index': time.time(),
            'Middle': time.time(),
            'Ring': time.time(),
            'Pinky': time.time()
        }

    def track_touches(self, hand_landmarks, frame, mp_drawing, mp_hands):
        if not hand_landmarks:
            self.stages = {key: "No hand detected" for key in self.stages}
            return self.counters, self.stages

        # Use right hand: thumb tip and finger tips
        lm = hand_landmarks[0].landmark
        thumb_tip = lm[4]
        wrist = [int(lm[0].x * frame.shape[1]), int(lm[0].y * frame.shape[0])]
        finger_tips = {
            'Index': lm[8],   # Index finger tip
            'Middle': lm[12], # Middle finger tip
            'Ring': lm[16],   # Ring finger tip
            'Pinky': lm[20]   # Pinky finger tip
        }

        # Draw hand landmarks
        mp_drawing.draw_landmarks(frame, hand_landmarks[0], mp_hands.HAND_CONNECTIONS)

        current_time = time.time()

        # Track each finger's touch to thumb
        for finger, tip in finger_tips.items():
            distance = calculate_distance(thumb_tip, tip)

            # Display distance for current finger
            cv2.putText(frame, f'{finger} Distance: {distance:.3f}', 
                        (wrist[0] + 10, wrist[1] - 10 - 20 * list(finger_tips.keys()).index(finger)), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

            # Logic: Count a touch when finger tip comes close to thumb and moves away
            if distance < self.distance_threshold and self.stages[finger] == "Open":
                self.stages[finger] = "Touching"
            elif distance >= self.distance_threshold and self.stages[finger] == "Touching":
                self.stages[finger] = "Open"
                if current_time - self.last_update[finger] > 0.5:  # Prevent rapid counting
                    self.counters[finger] += 1
                    self.last_update[finger] = current_time

        # Display repetition counts and stages
        for i, (finger, count) in enumerate(self.counters.items()):
            cv2.putText(frame, f'{finger} Reps: {count}', (10, 30 + i * 30), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.putText(frame, f'{finger} Stage: {self.stages[finger]}', (200, 30 + i * 30), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        return self.counters, self.stages

# Main running model
if __name__ == "__main__":
    print("Starting Finger-to-Thumb Touches Tracker")
    print("Touch each finger to the thumb repeatedly. Press 'q' to quit.")

    mp_drawing = mp.solutions.drawing_utils
    mp_hands = mp.solutions.hands
    exercise = FingerToThumb()
    
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
                counters, stages = exercise.track_touches(results.multi_hand_landmarks, frame, mp_drawing, mp_hands)
            else:
                cv2.putText(frame, 'No hand detected', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('Finger-to-Thumb Touches Tracker', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
    print("Exercise complete. Total reps:")
    for finger, count in exercise.counters.items():
        print(f"{finger}: {count}")
import cv2
import time
import mediapipe as mp

class AlternateNostrilBreathing:
    def __init__(self):
        self.cycle_counter = 0  # Counts completed breathing cycles
        self.breathing_phase = "Inhale Right"  # Tracks phase: 'Inhale Right', 'Hold Right', 'Exhale Left', 'Hold Left', etc.
        self.phase_timer = time.time()  # Tracks time of current phase
        self.phase_duration = 4  # Seconds for each phase (inhale, hold, exhale, hold)
        self.last_cycle_update = time.time()  # Tracks time of last cycle completion
        self.nostril_status = None  # Tracks which nostril is closed ('Left', 'Right', or None)
        self.mp_hands = mp.solutions.hands.Hands(static_image_mode=False, max_num_hands=2, min_detection_confidence=0.5)
        self.mp_face = mp.solutions.face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, min_detection_confidence=0.5)

    def detect_nostril_closure(self, frame):
        """Detect which nostril is being closed based on hand position relative to nose."""
        results_hands = self.mp_hands.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        results_face = self.mp_face.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        self.nostril_status = None

        if results_face.multi_face_landmarks and results_hands.multi_hand_landmarks:
            nose_tip = None
            for face_landmarks in results_face.multi_face_landmarks:
                # Nose tip landmark (index 1 in MediaPipe FaceMesh)
                nose_tip = [int(face_landmarks.landmark[1].x * frame.shape[1]), int(face_landmarks.landmark[1].y * frame.shape[0])]
                mp.solutions.drawing_utils.draw_landmarks(frame, face_landmarks, mp.solutions.face_mesh.FACEMESH_TESSELATION,
                                                         landmark_drawing_spec=None, connection_drawing_spec=mp.solutions.drawing_styles.get_default_face_mesh_tesselation_style())

            for hand_landmarks in results_hands.multi_hand_landmarks:
                wrist = [int(hand_landmarks.landmark[0].x * frame.shape[1]), int(hand_landmarks.landmark[0].y * frame.shape[0])]
                # Check if hand is near nose (within 100 pixels)
                if nose_tip and ((wrist[0] - nose_tip[0])**2 + (wrist[1] - nose_tip[1])**2)**0.5 < 100:
                    # Determine which side of the nose the hand is on
                    if wrist[0] < nose_tip[0]:  # Hand on left side of nose (closing right nostril)
                        self.nostril_status = "Right"
                    else:  # Hand on right side of nose (closing left nostril)
                        self.nostril_status = "Left"
                mp.solutions.drawing_utils.draw_landmarks(frame, hand_landmarks, mp.solutions.hands.HAND_CONNECTIONS)

        return self.nostril_status

    def track_breathing_cycle(self):
        """Manage breathing cycle (inhale, hold, exhale, hold for each nostril)."""
        current_time = time.time()
        elapsed = current_time - self.phase_timer

        # Define breathing cycle sequence
        cycle_sequence = [
            "Inhale Right", "Hold Right", "Exhale Left", "Hold Left",
            "Inhale Left", "Hold Left", "Exhale Right", "Hold Right"
        ]

        if elapsed >= self.phase_duration:
            # Move to next phase in the cycle
            current_index = cycle_sequence.index(self.breathing_phase)
            next_index = (current_index + 1) % len(cycle_sequence)
            self.breathing_phase = cycle_sequence[next_index]
            self.phase_timer = current_time
            # Increment cycle counter after completing a full cycle (8 phases)
            if next_index == 0 and current_time - self.last_cycle_update > 1:
                self.cycle_counter += 1
                self.last_cycle_update = current_time

        return self.breathing_phase

    def track_nadi_shodhana(self, frame):
        """Track breathing phase and nostril closure, provide feedback."""
        current_time = time.time()

        # Detect nostril closure
        nostril_status = self.detect_nostril_closure(frame)

        # Update breathing phase
        breathing_phase = self.track_breathing_cycle()

        # Verify correct hand position for the current phase
        correct_position = False
        if breathing_phase in ["Inhale Right", "Hold Right"] and nost esquerda_status == "Left":  # Close left nostril
            correct_position = True
        elif breathing_phase in ["Exhale Left", "Hold Left"] and nostril_status == "Right":  # Close right nostril
            correct_position = True
        elif breathing_phase in ["Inhale Left", "Hold Left"] and nostril_status == "Right":  # Close right nostril
            correct_position = True
        elif breathing_phase in ["Exhale Right", "Hold Right"] and nostril_status == "Left":  # Close left nostril
            correct_position = True

        # Display feedback
        cv2.putText(frame, f'Cycles: {self.cycle_counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Phase: {breathing_phase}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Nostril Closed: {nostril_status if nostril_status else "None"}', (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Position: {"Correct" if correct_position else "Incorrect"}', (10, 120), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0) if correct_position else (0, 0, 255), 2)
        cv2.putText(frame, f'Time Left: {max(0, self.phase_duration - (current_time - self.phase_timer)):.1f}s', (10, 150), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        return self.cycle_counter, breathing_phase, nostril_status, correct_position

    def draw_circle(self, frame, center, color, radius):
        """Draw a circle with specified style."""
        cv2.circle(frame, center, radius, color, -1)

def main():
    # Initialize AlternateNostrilBreathing tracker
    tracker = AlternateNostrilBreathing()

    # Open webcam
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Error: Failed to capture frame.")
                break

            # Track Nadi Shodhana
            cycle_counter, breathing_phase, nostril_status, correct_position = tracker.track_nadi_shodhana(frame)

            # Display the frame
            cv2.imshow('Nadi Shodhana Tracker', frame)

            # Exit on 'q' key press
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    finally:
        # Release resources
        cap.release()
        cv2.destroyAllWindows()
        tracker.mp_hands.close()
        tracker.mp_face.close()

if __name__ == "__main__":
    main()
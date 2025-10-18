import cv2
import mediapipe as mp
import time

class BreathingExercise:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.7)
        self.mp_draw = mp.solutions.drawing_utils
        
        self.cycle_count = 0
        self.phase = None  # 'inhale', 'hold', 'exhale'
        self.phase_start_time = None
        self.phase_duration = 4  # 4 seconds per phase
        self.finger_count = 0
        self.expected_fingers = {'inhale': 1, 'hold': 2, 'exhale': 3}
        
    def count_raised_fingers(self, hand_landmarks):
        """Count the number of raised fingers based on hand landmarks."""
        # Landmarks for finger tips and PIP joints
        finger_tips = [4, 8, 12, 16, 20]  # Thumb, Index, Middle, Ring, Pinky
        finger_pips = [3, 6, 10, 14, 18]  # PIP joints for each finger
        raised_fingers = 0
        
        for tip, pip in zip(finger_tips, finger_pips):
            tip_y = hand_landmarks.landmark[tip].y
            pip_y = hand_landmarks.landmark[pip].y
            # Finger is raised if tip is above PIP joint (lower y-coordinate)
            if tip_y < pip_y:
                raised_fingers += 1
                
        return raised_fingers
    
    def track_breathing_exercise(self, frame):
        # Convert frame to RGB for MediaPipe
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(frame_rgb)
        
        warning_message = None
        current_time = time.time()
        
        # Initialize phase if None
        if self.phase is None:
            self.phase = 'inhale'
            self.phase_start_time = current_time
        
        # Process hand landmarks
        self.finger_count = 0
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                # Draw hand landmarks
                self.mp_draw.draw_landmarks(frame, hand_landmarks, self.mp_hands.HAND_CONNECTIONS,
                                         landmark_drawing_spec=self.mp_draw.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=4),
                                         connection_drawing_spec=self.mp_draw.DrawingSpec(color=(0, 0, 255), thickness=2))
                
                # Count raised fingers
                self.finger_count = self.count_raised_fingers(hand_landmarks)
                
                # Display finger count
                wrist = hand_landmarks.landmark[0]
                wrist_pos = (int(wrist.x * frame.shape[1]), int(wrist.y * frame.shape[0]))
                cv2.putText(frame, f'Fingers: {self.finger_count}', (wrist_pos[0], wrist_pos[1] - 20),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        # Check if correct number of fingers is raised for the current phase
        if self.finger_count != self.expected_fingers[self.phase]:
            warning_message = f"Show {self.expected_fingers[self.phase]} finger(s) for {self.phase}!"
        
        # Display current phase and time remaining
        time_elapsed = current_time - self.phase_start_time
        time_remaining = max(0, self.phase_duration - time_elapsed)
        cv2.putText(frame, f'Phase: {self.phase.capitalize()} ({time_remaining:.1f}s)',
                   (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        # Display cycle count
        cv2.putText(frame, f'Cycles: {self.cycle_count}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        # Transition to next phase if duration is exceeded
        if time_elapsed >= self.phase_duration:
            if self.phase == 'inhale':
                self.phase = 'hold'
            elif self.phase == 'hold':
                self.phase = 'exhale'
            elif self.phase == 'exhale':
                self.phase = 'inhale'
                self.cycle_count += 1  # Increment cycle count after completing exhale
            self.phase_start_time = current_time
        
        # Progress percentage (0 to 1 based on time remaining in phase)
        progress = 1 - (time_remaining / self.phase_duration)
        
        return self.cycle_count, self.finger_count, self.phase, warning_message, progress

    def release(self):
        """Release MediaPipe resources."""
        self.hands.close()
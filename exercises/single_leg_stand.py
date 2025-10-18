import cv2
import time
import mediapipe as mp
from pose_estimation.angle_calculation import calculate_angle

class SingleLegStand:
    def __init__(self):
        self.counter = 0
        self.stage = "Initial"  # Tracks the stage: 'Initial', 'Standing', 'Completed'
        self.stance_duration = 0  # Tracks duration of single-leg stance
        self.start_time = None  # Start time of current stance
        self.min_duration = 10  # Minimum stance duration (seconds)
        self.max_duration = 30  # Maximum stance duration (seconds)
        self.last_counter_update = time.time()  # Track time of last counter update
        self.support_detected = False  # Tracks if hand is near support surface
        self.active_leg = None  # Tracks which leg is standing ('Right' or 'Left')
        self.mp_hands = mp.solutions.hands.Hands(static_image_mode=False, max_num_hands=2, min_detection_confidence=0.5)

    def calculate_knee_ankle_ground_angle(self, knee, ankle, ground_point):
        """Calculate the angle between knee, ankle, and a ground reference point."""
        return calculate_angle(knee, ankle, ground_point)

    def detect_support_contact(self, frame):
        """Detect if a hand is near a support surface (e.g., wall or chair)."""
        results = self.mp_hands.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        self.support_detected = False
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                wrist = [int(hand_landmarks.landmark[0].x * frame.shape[1]), int(hand_landmarks.landmark[0].y * frame.shape[0])]
                # Assume support surface is near the edge of the frame (left or right 10% of frame width)
                if wrist[0] < frame.shape[1] * 0.1 or wrist[0] > frame.shape[1] * 0.9:
                    self.support_detected = True
                # Draw hand landmarks for visualization
                mp.solutions.drawing_utils.draw_landmarks(frame, hand_landmarks, mp.solutions.hands.HAND_CONNECTIONS)
        return self.support_detected

    def track_single_leg_stand(self, landmarks, frame):
        # Right side landmarks (hip, knee, ankle, heel)
        hip_right = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]
        knee_right = [int(landmarks[26].x * frame.shape[1]), int(landmarks[26].y * frame.shape[0])]
        ankle_right = [int(landmarks[28].x * frame.shape[1]), int(landmarks[28].y * frame.shape[0])]
        heel_right = [int(landmarks[30].x * frame.shape[1]), int(landmarks[30].y * frame.shape[0])]

        # Left side landmarks (hip, knee, ankle, heel)
        hip_left = [int(landmarks[23].x * frame.shape[1]), int(landmarks[23].y * frame.shape[0])]
        knee_left = [int(landmarks[25].x * frame.shape[1]), int(landmarks[25].y * frame.shape[0])]
        ankle_left = [int(landmarks[27].x * frame.shape[1]), int(landmarks[27].y * frame.shape[0])]
        heel_left = [int(landmarks[29].x * frame.shape[1]), int(landmarks[29].y * frame.shape[0])]

        # Ground reference point (approximated as below the ankle)
        ground_right = [ankle_right[0], frame.shape[0]]  # Bottom of frame
        ground_left = [ankle_left[0], frame.shape[0]]

        # Calculate angles to confirm leg position (near vertical for standing leg)
        angle_right = self.calculate_knee_ankle_ground_angle(knee_right, ankle_right, ground_right)
        angle_left = self.calculate_knee_ankle_ground_angle(knee_left, ankle_left, ground_left)

        # Draw lines for right side
        self.draw_line_with_style(frame, hip_right, knee_right, (0, 0, 255), 2)
        self.draw_line_with_style(frame, knee_right, ankle_right, (0, 0, 255), 2)
        self.draw_line_with_style(frame, ankle_right, heel_right, (0, 0, 255), 2)

        # Draw lines for left side
        self.draw_line_with_style(frame, hip_left, knee_left, (102, 0, 0), 2)
        self.draw_line_with_style(frame, knee_left, ankle_left, (102, 0, 0), 2)
        self.draw_line_with_style(frame, ankle_left, heel_left, (102, 0, 0), 2)

        # Draw circles to highlight key points
        self.draw_circle(frame, hip_right, (0, 0, 255), 8)
        self.draw_circle(frame, knee_right, (0, 0, 255), 8)
        self.draw_circle(frame, ankle_right, (0, 0, 255), 8)
        self.draw_circle(frame, heel_right, (0, 0, 255), 8)

        self.draw_circle(frame, hip_left, (102, 0, 0), 8)
        self.draw_circle(frame, knee_left, (102, 0, 0), 8)
        self.draw_circle(frame, ankle_left, (102, 0, 0), 8)
        self.draw_circle(frame, heel_left, (102, 0, 0), 8)

        # Update angle text positions and display
        angle_text_position_right = (knee_right[0] + 10, knee_right[1] - 10)
        cv2.putText(frame, f'Angle: {int(angle_right)}', angle_text_position_right, cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        angle_text_position_left = (knee_left[0] + 10, knee_left[1] - 10)
        cv2.putText(frame, f'Angle: {int(angle_left)}', angle_text_position_left, cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        # Get current time
        current_time = time.time()

        # Detect support contact using hand landmarks
        self.detect_support_contact(frame)

        # Check if standing on one leg
        standing_on_right = angle_right > 160 and ankle_left[1] < frame.shape[0] * 0.8  # Right leg near vertical, left leg lifted
        standing_on_left = angle_left > 160 and ankle_right[1] < frame.shape[0] * 0.8   # Left leg near vertical, right leg lifted

        # Update stage and counter
        if (standing_on_right or standing_on_left) and self.support_detected and self.stage != "Standing":
            self.stage = "Standing"
            self.start_time = current_time
            self.stance_duration = 0
            self.active_leg = "Right" if standing_on_right else "Left"
        elif (standing_on_right or standing_on_left) and self.support_detected and self.stage == "Standing":
            # Ensure the same leg is still active to avoid switching mid-stance
            if (standing_on_right and self.active_leg == "Right") or (standing_on_left and self.active_leg == "Left"):
                self.stance_duration = current_time - self.start_time
                if self.stance_duration >= self.min_duration and self.stance_duration <= self.max_duration:
                    if current_time - self.last_counter_update > 1:  # Avoid rapid counting
                        self.counter += 1
                        self.last_counter_update = current_time
                        self.stage = "Completed"
                        self.active_leg = None
        elif not (standing_on_right or standing_on_left) or not self.support_detected:
            self.stage = "Initial"
            self.stance_duration = 0
            self.start_time = None
            self.active_leg = None

        # Display counter, stage, duration, and active leg
        cv2.putText(frame, f'Stances: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Duration: {self.stance_duration:.1f}s', (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Support: {"Detected" if self.support_detected else "Not Detected"}', (10, 120), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Active Leg: {self.active_leg if self.active_leg else "None"}', (10, 150), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        return self.counter, self.stance_duration, self.stage

    def draw_line_with_style(self, frame, start_point, end_point, color, thickness):
        """Draw a line with specified style."""
        cv2.line(frame, start_point, end_point, color, thickness, lineType=cv2.LINE_AA)

    def draw_circle(self, frame, center, color, radius):
        """Draw a circle with specified style."""
        cv2.circle(frame, center, radius, color, -1)  # -1 to fill the circle

def main():
    # Initialize MediaPipe Pose
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5, min_tracking_confidence=0.5)

    # Initialize SingleLegStand tracker
    tracker = SingleLegStand()

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

            # Convert frame to RGB for MediaPipe
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(frame_rgb)

            # Process pose landmarks
            if results.pose_landmarks:
                mp.solutions.drawing_utils.draw_landmarks(frame, results.pose_landmarks, mp.solutions.pose.POSE_CONNECTIONS)
                counter, duration, stage = tracker.track_single_leg_stand(results.pose_landmarks.landmark, frame)

            # Display the frame
            cv2.imshow('Single-Leg Stand Tracker', frame)

            # Exit on 'q' key press
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    finally:
        # Release resources
        cap.release()
        cv2.destroyAllWindows()
        pose.close()
        tracker.mp_hands.close()

if __name__ == "__main__":
    main()
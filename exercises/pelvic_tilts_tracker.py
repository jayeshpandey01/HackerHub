import cv2
import time
import mediapipe as mp
import math

class PelvicTiltsTracker:
    def __init__(self):
        self.counter = 0  # Counts completed pelvic tilt repetitions
        self.stage = "Initial"  # Tracks stage: 'Initial', 'Neutral', 'Tilted'
        self.last_counter_update = time.time()  # Tracks time of last counter update
        self.angle_threshold_neutral = 120  # Upper threshold for neutral position
        self.angle_threshold_tilted = 90   # Lower threshold for tilted position
        self.mp_pose = mp.solutions.pose.Pose(static_image_mode=False, min_detection_confidence=0.5, min_tracking_confidence=0.5)

    def calculate_angle(self, a, b, c):
        """Calculate the angle between three points (a, b, c) in degrees."""
        a = [a[0], a[1]]
        b = [b[0], b[1]]
        c = [c[0], c[1]]
        ab = [a[0] - b[0], a[1] - b[1]]
        bc = [c[0] - b[0], c[1] - b[1]]
        dot_product = ab[0] * bc[0] + ab[1] * bc[1]
        magnitude_ab = math.sqrt(ab[0]**2 + ab[1]**2)
        magnitude_bc = math.sqrt(bc[0]**2 + bc[1]**2)
        if magnitude_ab == 0 or magnitude_bc == 0:
            return 0
        cos_angle = dot_product / (magnitude_ab * magnitude_bc)
        cos_angle = max(min(cos_angle, 1), -1)  # Clamp to avoid math errors
        angle = math.degrees(math.acos(cos_angle))
        return angle

    def check_form(self, landmarks, frame):
        """Check if user is lying on back with knees bent."""
        shoulder_left = [int(landmarks[11].x * frame.shape[1]), int(landmarks[11].y * frame.shape[0])]
        hip_left = [int(landmarks[23].x * frame.shape[1]), int(landmarks[23].y * frame.shape[0])]
        knee_left = [int(landmarks[25].x * frame.shape[1]), int(landmarks[25].y * frame.shape[0])]
        ankle_left = [int(landmarks[27].x * frame.shape[1]), int(landmarks[27].y * frame.shape[0])]
        shoulder_right = [int(landmarks[12].x * frame.shape[1]), int(landmarks[12].y * frame.shape[0])]
        hip_right = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]
        knee_right = [int(landmarks[26].x * frame.shape[1]), int(landmarks[26].y * frame.shape[0])]
        ankle_right = [int(landmarks[28].x * frame.shape[1]), int(landmarks[28].y * frame.shape[0])]

        # Check if lying on back: shoulders and hips at similar vertical levels
        shoulder_hip_distance = abs((shoulder_left[1] + shoulder_right[1]) / 2 - (hip_left[1] + hip_right[1]) / 2)
        lying_down = shoulder_hip_distance < frame.shape[0] * 0.1  # Within 10% of frame height

        # Check if knees are bent: hip-knee-ankle angle ~90°
        hip_knee_angle_left = self.calculate_angle(hip_left, knee_left, ankle_left)
        hip_knee_angle_right = self.calculate_angle(hip_right, knee_right, ankle_right)
        knees_bent = 80 < hip_knee_angle_left < 110 and 80 < hip_knee_angle_right < 110

        return lying_down and knees_bent, hip_knee_angle_left

    def track_pelvic_tilts(self, landmarks, frame):
        """Track pelvic tilt repetitions and form."""
        current_time = time.time()

        # Extract landmarks
        hip_left = [int(landmarks[23].x * frame.shape[1]), int(landmarks[23].y * frame.shape[0])]
        knee_left = [int(landmarks[25].x * frame.shape[1]), int(landmarks[25].y * frame.shape[0])]
        ankle_left = [int(landmarks[27].x * frame.shape[1]), int(landmarks[27].y * frame.shape[0])]
        hip_right = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]
        knee_right = [int(landmarks[26].x * frame.shape[1]), int(landmarks[26].y * frame.shape[0])]
        ankle_right = [int(landmarks[28].x * frame.shape[1]), int(landmarks[28].y * frame.shape[0])]
        shoulder_left = [int(landmarks[11].x * frame.shape[1]), int(landmarks[11].y * frame.shape[0])]
        shoulder_right = [int(landmarks[12].x * frame.shape[1]), int(landmarks[12].y * frame.shape[0])]

        # Calculate hip-knee-ankle angles to detect pelvic tilt
        angle_left = self.calculate_angle(hip_left, knee_left, ankle_left)
        angle_right = self.calculate_angle(hip_right, knee_right, ankle_right)

        # Check form (lying down, knees bent)
        form_correct, hip_knee_angle = self.check_form(landmarks, frame)

        # Draw lines and circles
        self.draw_line_with_style(frame, shoulder_left, hip_left, (0, 0, 255), 2)
        self.draw_line_with_style(frame, hip_left, knee_left, (0, 0, 255), 2)
        self.draw_line_with_style(frame, knee_left, ankle_left, (0, 0, 255), 2)
        self.draw_line_with_style(frame, shoulder_right, hip_right, (102, 0, 0), 2)
        self.draw_line_with_style(frame, hip_right, knee_right, (102, 0, 0), 2)
        self.draw_line_with_style(frame, knee_right, ankle_right, (102, 0, 0), 2)

        self.draw_circle(frame, shoulder_left, (0, 0, 255), 8)
        self.draw_circle(frame, hip_left, (0, 0, 255), 8)
        self.draw_circle(frame, knee_left, (0, 0, 255), 8)
        self.draw_circle(frame, ankle_left, (0, 0, 255), 8)
        self.draw_circle(frame, shoulder_right, (102, 0, 0), 8)
        self.draw_circle(frame, hip_right, (102, 0, 0), 8)
        self.draw_circle(frame, knee_right, (102, 0, 0), 8)
        self.draw_circle(frame, ankle_right, (102, 0, 0), 8)

        # Display angles
        angle_text_position_left = (knee_left[0] + 10, knee_left[1] - 10)
        cv2.putText(frame, f'Left Angle: {int(angle_left)}', angle_text_position_left, cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        angle_text_position_right = (knee_right[0] + 10, knee_right[1] - 10)
        cv2.putText(frame, f'Right Angle: {int(angle_right)}', angle_text_position_right, cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        cv2.putText(frame, f'Hip-Knee: {int(hip_knee_angle)}', (hip_left[0] + 10, hip_left[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        # Update stage and counter if form is correct
        if form_correct:
            if angle_left > self.angle_threshold_neutral and angle_right > self.angle_threshold_neutral:
                self.stage = "Neutral"
            elif (angle_left < self.angle_threshold_tilted and angle_right < self.angle_threshold_tilted and
                  self.stage == "Neutral"):
                self.stage = "Tilted"
            elif (angle_left > self.angle_threshold_neutral and angle_right > self.angle_threshold_neutral and
                  self.stage == "Tilted"):
                if current_time - self.last_counter_update > 1:  # Avoid rapid counting
                    self.counter += 1
                    self.last_counter_update = current_time
                    self.stage = "Neutral"
        else:
            self.stage = "Initial"

        # Display feedback
        cv2.putText(frame, f'Reps: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Form: {"Correct" if form_correct else "Adjust Position"}', (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 1,
                    (0, 255, 0) if form_correct else (0, 0, 255), 2)

        return self.counter, self.stage, form_correct

    def draw_line_with_style(self, frame, start_point, end_point, color, thickness):
        """Draw a line with specified style."""
        cv2.line(frame, start_point, end_point, color, thickness, lineType=cv2.LINE_AA)

    def draw_circle(self, frame, center, color, radius):
        """Draw a circle with specified style."""
        cv2.circle(frame, center, radius, color, -1)

def main():
    # Initialize PelvicTiltsTracker
    tracker = PelvicTiltsTracker()

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
            results = tracker.mp_pose.process(frame_rgb)

            # Process pose landmarks
            if results.pose_landmarks:
                mp.solutions.drawing_utils.draw_landmarks(frame, results.pose_landmarks, mp.solutions.pose.POSE_CONNECTIONS)
                counter, stage, form_correct = tracker.track_pelvic_tilts(results.pose_landmarks.landmark, frame)

            # Display the frame
            cv2.imshow('Pelvic Tilts Tracker', frame)

            # Exit on 'q' key press
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    finally:
        # Release resources
        cap.release()
        cv2.destroyAllWindows()
        tracker.mp_pose.close()

if __name__ == "__main__":
    main()
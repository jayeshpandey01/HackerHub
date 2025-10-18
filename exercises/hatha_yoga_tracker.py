import cv2
import time
import mediapipe as mp
import math

class HathaYogaTracker:
    def __init__(self):
        self.counter = 0  # Counts successful pose completions
        self.stage = "Initial"  # Tracks current pose: 'Initial', 'ChildsPose', 'Cat', 'Cow', 'CorpsePose'
        self.breathing_phase = "Inhale"  # Tracks breathing: 'Inhale' or 'Exhale'
        self.breathing_timer = time.time()  # Tracks breathing cycle
        self.breathing_duration = 4  # Seconds for each inhale/exhale
        self.last_pose_update = time.time()  # Tracks time of last pose completion
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

    def detect_pose(self, landmarks, frame):
        """Detect and classify yoga poses based on landmarks."""
        # Extract key landmarks
        hip_left = [int(landmarks[23].x * frame.shape[1]), int(landmarks[23].y * frame.shape[0])]
        knee_left = [int(landmarks[25].x * frame.shape[1]), int(landmarks[25].y * frame.shape[0])]
        ankle_left = [int(landmarks[27].x * frame.shape[1]), int(landmarks[27].y * frame.shape[0])]
        shoulder_left = [int(landmarks[11].x * frame.shape[1]), int(landmarks[11].y * frame.shape[0])]
        elbow_left = [int(landmarks[13].x * frame.shape[1]), int(landmarks[13].y * frame.shape[0])]
        wrist_left = [int(landmarks[15].x * frame.shape[1]), int(landmarks[15].y * frame.shape[0])]
        hip_right = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]
        knee_right = [int(landmarks[26].x * frame.shape[1]), int(landmarks[26].y * frame.shape[0])]
        ankle_right = [int(landmarks[28].x * frame.shape[1]), int(landmarks[28].y * frame.shape[0])]
        shoulder_right = [int(landmarks[12].x * frame.shape[1]), int(landmarks[12].y * frame.shape[0])]

        # Calculate key angles
        hip_angle_left = self.calculate_angle(shoulder_left, hip_left, knee_left)
        knee_angle_left = self.calculate_angle(hip_left, knee_left, ankle_left)
        hip_angle_right = self.calculate_angle(shoulder_right, hip_right, knee_right)
        knee_angle_right = self.calculate_angle(hip_right, knee_right, ankle_right)
        shoulder_angle_left = self.calculate_angle(elbow_left, shoulder_left, hip_left)

        # Pose detection logic
        current_pose = "Initial"
        if (hip_angle_left < 60 and hip_angle_right < 60 and
            knee_angle_left < 60 and knee_angle_right < 60 and
            shoulder_left[1] > hip_left[1]):  # Hips below shoulders, knees bent
            current_pose = "ChildsPose"
        elif (shoulder_angle_left > 120 and hip_angle_left > 120 and
              knee_angle_left > 150 and knee_angle_right > 150):  # Straight back, extended knees
            current_pose = "Cat"
        elif (shoulder_angle_left < 100 and hip_angle_left < 100 and
              knee_angle_left > 150 and knee_angle_right > 150):  # Arched back, extended knees
            current_pose = "Cow"
        elif (hip_angle_left > 150 and hip_angle_right > 150 and
              knee_angle_left > 150 and knee_angle_right > 150 and
              shoulder_left[1] < hip_left[1] and shoulder_right[1] < hip_right[1]):  # Lying flat
            current_pose = "CorpsePose"

        return current_pose, hip_angle_left, knee_angle_left

    def track_breathing(self):
        """Manage breathing cycle (inhale/exhale)."""
        current_time = time.time()
        elapsed = current_time - self.breathing_timer
        if elapsed >= self.breathing_duration:
            self.breathing_phase = "Exhale" if self.breathing_phase == "Inhale" else "Inhale"
            self.breathing_timer = current_time
        return self.breathing_phase

    def track_yoga_session(self, landmarks, frame):
        """Track yoga poses and breathing, update counter and stage."""
        current_time = time.time()

        # Detect current pose
        current_pose, hip_angle, knee_angle = self.detect_pose(landmarks, frame)

        # Update breathing phase
        breathing_phase = self.track_breathing()

        # Draw key landmarks and lines
        hip_left = [int(landmarks[23].x * frame.shape[1]), int(landmarks[23].y * frame.shape[0])]
        knee_left = [int(landmarks[25].x * frame.shape[1]), int(landmarks[25].y * frame.shape[0])]
        ankle_left = [int(landmarks[27].x * frame.shape[1]), int(landmarks[27].y * frame.shape[0])]
        shoulder_left = [int(landmarks[11].x * frame.shape[1]), int(landmarks[11].y * frame.shape[0])]
        hip_right = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]
        knee_right = [int(landmarks[26].x * frame.shape[1]), int(landmarks[26].y * frame.shape[0])]
        ankle_right = [int(landmarks[28].x * frame.shape[1]), int(landmarks[28].y * frame.shape[0])]
        shoulder_right = [int(landmarks[12].x * frame.shape[1]), int(landmarks[12].y * frame.shape[0])]

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
        cv2.putText(frame, f'Hip Angle: {int(hip_angle)}', (hip_left[0] + 10, hip_left[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        cv2.putText(frame, f'Knee Angle: {int(knee_angle)}', (knee_left[0] + 10, knee_left[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        # Update stage and counter
        if current_pose != "Initial" and self.stage != current_pose:
            if current_time - self.last_pose_update > 2:  # Require 2 seconds in pose to count
                self.stage = current_pose
                self.counter += 1
                self.last_pose_update = current_time

        # Display counter, stage, and breathing phase
        cv2.putText(frame, f'Poses Completed: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Current Pose: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Breathing: {breathing_phase}', (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        return self.counter, self.stage, breathing_phase

    def draw_line_with_style(self, frame, start_point, end_point, color, thickness):
        """Draw a line with specified style."""
        cv2.line(frame, start_point, end_point, color, thickness, lineType=cv2.LINE_AA)

    def draw_circle(self, frame, center, color, radius):
        """Draw a circle with specified style."""
        cv2.circle(frame, center, radius, color, -1)  # -1 to fill the circle

def main():
    # Initialize HathaYogaTracker
    tracker = HathaYogaTracker()

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
                counter, stage, breathing_phase = tracker.track_yoga_session(results.pose_landmarks.landmark, frame)

            # Display the frame
            cv2.imshow('Hatha Yoga Tracker', frame)

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
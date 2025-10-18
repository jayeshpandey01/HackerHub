import cv2
import time
import mediapipe as mp
import math

class CatCamelStretchTracker:
    def __init__(self):
        self.counter = 0  # Counts completed Cat-Camel transitions
        self.stage = "Initial"  # Tracks stage: 'Initial', 'Cat', 'Camel'
        self.last_counter_update = time.time()  # Tracks time of last counter update
        self.pose_start_time = None  # Tracks start time of current pose
        self.min_pose_duration = 2  # Minimum seconds to hold each pose for slow movement
        self.angle_threshold_cat = 130  # Upper threshold for Cat (rounded back)
        self.angle_threshold_camel = 100  # Lower threshold for Camel (arched back)
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
        """Check if user is on hands and knees."""
        shoulder_left = [int(landmarks[11].x * frame.shape[1]), int(landmarks[11].y * frame.shape[0])]
        elbow_left = [int(landmarks[13].x * frame.shape[1]), int(landmarks[13].y * frame.shape[0])]
        wrist_left = [int(landmarks[15].x * frame.shape[1]), int(landmarks[15].y * frame.shape[0])]
        shoulder_right = [int(landmarks[12].x * frame.shape[1]), int(landmarks[12].y * frame.shape[0])]
        elbow_right = [int(landmarks[14].x * frame.shape[1]), int(landmarks[14].y * frame.shape[0])]
        wrist_right = [int(landmarks[16].x * frame.shape[1]), int(landmarks[16].y * frame.shape[0])]
        hip_left = [int(landmarks[23].x * frame.shape[1]), int(landmarks[23].y * frame.shape[0])]
        knee_left = [int(landmarks[25].x * frame.shape[1]), int(landmarks[25].y * frame.shape[0])]
        hip_right = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]
        knee_right = [int(landmarks[26].x * frame.shape[1]), int(landmarks[26].y * frame.shape[0])]

        # Check elbow angles (should be bent, ~90° for hands-and-knees position)
        elbow_angle_left = self.calculate_angle(shoulder_left, elbow_left, wrist_left)
        elbow_angle_right = self.calculate_angle(shoulder_right, elbow_right, wrist_right)
        elbows_bent = 70 < elbow_angle_left < 110 and 70 < elbow_angle_right < 110

        # Check knee angles (should be bent, ~90° for hands-and-knees position)
        knee_angle_left = self.calculate_angle(hip_left, knee_left, [knee_left[0], knee_left[1] + 100])  # Approximate ankle below knee
        knee_angle_right = self.calculate_angle(hip_right, knee_right, [knee_right[0], knee_right[1] + 100])
        knees_bent = 70 < knee_angle_left < 110 and 70 < knee_angle_right < 110

        # Check if hands and knees are aligned (shoulders above wrists, hips above knees)
        shoulder_wrist_distance = abs(shoulder_left[1] - wrist_left[1]) + abs(shoulder_right[1] - wrist_right[1])
        hip_knee_distance = abs(hip_left[1] - knee_left[1]) + abs(hip_right[1] - knee_right[1])
        aligned = shoulder_wrist_distance < frame.shape[0] * 0.15 and hip_knee_distance < frame.shape[0] * 0.15

        return elbows_bent and knees_bent and aligned

    def track_cat_camel(self, landmarks, frame):
        """Track Cat-Camel stretch and count transitions."""
        current_time = time.time()

        # Extract landmarks
        shoulder_left = [int(landmarks[11].x * frame.shape[1]), int(landmarks[11].y * frame.shape[0])]
        shoulder_right = [int(landmarks[12].x * frame.shape[1]), int(landmarks[12].y * frame.shape[0])]
        hip_left = [int(landmarks[23].x * frame.shape[1]), int(landmarks[23].y * frame.shape[0])]
        hip_right = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]
        knee_left = [int(landmarks[25].x * frame.shape[1]), int(landmarks[25].y * frame.shape[0])]
        knee_right = [int(landmarks[26].x * frame.shape[1]), int(landmarks[26].y * frame.shape[0])]
        elbow_left = [int(landmarks[13].x * frame.shape[1]), int(landmarks[13].y * frame.shape[0])]
        elbow_right = [int(landmarks[14].x * frame.shape[1]), int(landmarks[14].y * frame.shape[0])]
        wrist_left = [int(landmarks[15].x * frame.shape[1]), int(landmarks[15].y * frame.shape[0])]
        wrist_right = [int(landmarks[16].x * frame.shape[1]), int(landmarks[16].y * frame.shape[0])]

        # Calculate shoulder-hip-knee angle to detect back curvature
        shoulder_center = [(shoulder_left[0] + shoulder_right[0]) / 2, (shoulder_left[1] + shoulder_right[1]) / 2]
        hip_center = [(hip_left[0] + hip_right[0]) / 2, (hip_left[1] + hip_right[1]) / 2]
        knee_center = [(knee_left[0] + knee_right[0]) / 2, (knee_left[1] + knee_right[1]) / 2]
        back_angle = self.calculate_angle(shoulder_center, hip_center, knee_center)

        # Check form (hands and knees position)
        form_correct = self.check_form(landmarks, frame)

        # Draw lines and circles
        self.draw_line_with_style(frame, shoulder_left, elbow_left, (0, 0, 255), 2)
        self.draw_line_with_style(frame, elbow_left, wrist_left, (0, 0, 255), 2)
        self.draw_line_with_style(frame, shoulder_right, elbow_right, (102, 0, 0), 2)
        self.draw_line_with_style(frame, elbow_right, wrist_right, (102, 0, 0), 2)
        self.draw_line_with_style(frame, shoulder_left, hip_left, (0, 0, 255), 2)
        self.draw_line_with_style(frame, hip_left, knee_left, (0, 0, 255), 2)
        self.draw_line_with_style(frame, shoulder_right, hip_right, (102, 0, 0), 2)
        self.draw_line_with_style(frame, hip_right, knee_right, (102, 0, 0), 2)

        self.draw_circle(frame, shoulder_left, (0, 0, 255), 8)
        self.draw_circle(frame, elbow_left, (0, 0, 255), 8)
        self.draw_circle(frame, wrist_left, (0, 0, 255), 8)
        self.draw_circle(frame, hip_left, (0, 0, 255), 8)
        self.draw_circle(frame, knee_left, (0, 0, 255), 8)
        self.draw_circle(frame, shoulder_right, (102, 0, 0), 8)
        self.draw_circle(frame, elbow_right, (102, 0, 0), 8)
        self.draw_circle(frame, wrist_right, (102, 0, 0), 8)
        self.draw_circle(frame, hip_right, (102, 0, 0), 8)
        self.draw_circle(frame, knee_right, (102, 0, 0), 8)

        # Display back angle
        cv2.putText(frame, f'Back Angle: {int(back_angle)}', (hip_left[0] + 10, hip_left[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        # Update stage and counter if form is correct
        if form_correct:
            if back_angle > self.angle_threshold_cat:
                if self.stage != "Cat":
                    self.stage = "Cat"
                    self.pose_start_time = current_time
                elif self.stage == "Cat" and current_time - self.pose_start_time >= self.min_pose_duration:
                    if current_time - self.last_counter_update > 1:  # Avoid rapid counting
                        self.counter += 1
                        self.last_counter_update = current_time
            elif back_angle < self.angle_threshold_camel:
                if self.stage != "Camel":
                    self.stage = "Camel"
                    self.pose_start_time = current_time
                elif self.stage == "Camel" and current_time - self.pose_start_time >= self.min_pose_duration:
                    if current_time - self.last_counter_update > 1:  # Avoid rapid counting
                        self.counter += 1
                        self.last_counter_update = current_time
            else:
                self.stage = "Initial"
                self.pose_start_time = None
        else:
            self.stage = "Initial"
            self.pose_start_time = None

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
    # Initialize CatCamelStretchTracker
    tracker = CatCamelStretchTracker()

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
                counter, stage, form_correct = tracker.track_cat_camel(results.pose_landmarks.landmark, frame)

            # Display the frame
            cv2.imshow('Cat-Camel Stretch Tracker', frame)

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
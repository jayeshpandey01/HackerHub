import cv2
import time
import mediapipe as mp
import math

class WallPushUpsTracker:
    def __init__(self):
        self.counter = 0  # Counts completed push-up repetitions
        self.stage = "Initial"  # Tracks stage: 'Initial', 'Up', 'Down'
        self.last_counter_update = time.time()  # Tracks time of last counter update
        self.angle_threshold_up = 150  # Upper threshold for 'Up' stage (arms extended)
        self.angle_threshold_down = 90  # Lower threshold for 'Down' stage (arms bent)
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

    def check_arm_length_distance(self, landmarks, frame):
        """Check if user is at arm's length from the wall (torso near vertical, shoulders centered)."""
        shoulder_left = [int(landmarks[11].x * frame.shape[1]), int(landmarks[11].y * frame.shape[0])]
        shoulder_right = [int(landmarks[12].x * frame.shape[1]), int(landmarks[12].y * frame.shape[0])]
        hip_left = [int(landmarks[23].x * frame.shape[1]), int(landmarks[23].y * frame.shape[0])]
        hip_right = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]

        # Calculate torso angle (shoulder-hip relative to vertical)
        torso_vector = [(shoulder_left[0] + shoulder_right[0]) / 2 - (hip_left[0] + hip_right[0]) / 2,
                        (shoulder_left[1] + shoulder_right[1]) / 2 - (hip_left[1] + hip_right[1]) / 2]
        vertical_vector = [0, -1]  # Vertical direction (up)
        dot_product = torso_vector[1] * vertical_vector[1]  # Only y-component for vertical
        magnitude_torso = math.sqrt(torso_vector[0]**2 + torso_vector[1]**2)
        if magnitude_torso == 0:
            torso_angle = 0
        else:
            cos_angle = dot_product / magnitude_torso
            cos_angle = max(min(cos_angle, 1), -1)
            torso_angle = math.degrees(math.acos(cos_angle))

        # Check if shoulders are centered in frame (indicating arm's length distance)
        shoulder_center_x = (shoulder_left[0] + shoulder_right[0]) / 2
        frame_center_x = frame.shape[1] / 2
        centered = abs(shoulder_center_x - frame_center_x) < frame.shape[1] * 0.2  # Within 20% of frame center

        # Arm's length is valid if torso is near vertical (<15°) and shoulders are centered
        return torso_angle < 15 and centered, torso_angle

    def track_wall_push_ups(self, landmarks, frame):
        """Track wall push-up repetitions and form."""
        current_time = time.time()

        # Extract landmarks
        shoulder_left = [int(landmarks[11].x * frame.shape[1]), int(landmarks[11].y * frame.shape[0])]
        elbow_left = [int(landmarks[13].x * frame.shape[1]), int(landmarks[13].y * frame.shape[0])]
        wrist_left = [int(landmarks[15].x * frame.shape[1]), int(landmarks[15].y * frame.shape[0])]
        shoulder_right = [int(landmarks[12].x * frame.shape[1]), int(landmarks[12].y * frame.shape[0])]
        elbow_right = [int(landmarks[14].x * frame.shape[1]), int(landmarks[14].y * frame.shape[0])]
        wrist_right = [int(landmarks[16].x * frame.shape[1]), int(landmarks[16].y * frame.shape[0])]
        hip_left = [int(landmarks[23].x * frame.shape[1]), int(landmarks[23].y * frame.shape[0])]
        hip_right = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]

        # Calculate arm angles
        angle_left = self.calculate_angle(shoulder_left, elbow_left, wrist_left)
        angle_right = self.calculate_angle(shoulder_right, elbow_right, wrist_right)

        # Check arm's length distance
        at_arm_length, torso_angle = self.check_arm_length_distance(landmarks, frame)

        # Draw lines and circles
        self.draw_line_with_style(frame, shoulder_left, elbow_left, (0, 0, 255), 2)
        self.draw_line_with_style(frame, elbow_left, wrist_left, (0, 0, 255), 2)
        self.draw_line_with_style(frame, shoulder_right, elbow_right, (102, 0, 0), 2)
        self.draw_line_with_style(frame, elbow_right, wrist_right, (102, 0, 0), 2)
        self.draw_line_with_style(frame, shoulder_left, hip_left, (0, 0, 255), 2)
        self.draw_line_with_style(frame, shoulder_right, hip_right, (102, 0, 0), 2)

        self.draw_circle(frame, shoulder_left, (0, 0, 255), 8)
        self.draw_circle(frame, elbow_left, (0, 0, 255), 8)
        self.draw_circle(frame, wrist_left, (0, 0, 255), 8)
        self.draw_circle(frame, shoulder_right, (102, 0, 0), 8)
        self.draw_circle(frame, elbow_right, (102, 0, 0), 8)
        self.draw_circle(frame, wrist_right, (102, 0, 0), 8)
        self.draw_circle(frame, hip_left, (0, 0, 255), 8)
        self.draw_circle(frame, hip_right, (102, 0, 0), 8)

        # Display angles
        angle_text_position_left = (elbow_left[0] + 10, elbow_left[1] - 10)
        cv2.putText(frame, f'Left Arm: {int(angle_left)}', angle_text_position_left, cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        angle_text_position_right = (elbow_right[0] + 10, elbow_right[1] - 10)
        cv2.putText(frame, f'Right Arm: {int(angle_right)}', angle_text_position_right, cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        cv2.putText(frame, f'Torso Angle: {int(torso_angle)}', (hip_left[0] + 10, hip_left[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        # Update stage and counter if at arm's length
        form_correct = at_arm_length and angle_left > 60 and angle_right > 60  # Ensure arms are not collapsed
        if form_correct:
            if angle_left > self.angle_threshold_up and angle_right > self.angle_threshold_up:
                self.stage = "Up"
            elif (angle_left < self.angle_threshold_down and angle_right < self.angle_threshold_down and
                  self.stage == "Up"):
                self.stage = "Down"
            elif (angle_left > self.angle_threshold_up and angle_right > self.angle_threshold_up and
                  self.stage == "Down"):
                if current_time - self.last_counter_update > 1:  # Avoid rapid counting
                    self.counter += 1
                    self.last_counter_update = current_time
                    self.stage = "Up"
        else:
            self.stage = "Initial"

        # Display feedback
        cv2.putText(frame, f'Reps: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Form: {"Correct" if form_correct else "Adjust Distance/Form"}', (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 1,
                    (0, 255, 0) if form_correct else (0, 0, 255), 2)

        return self.counter, self.stage, form_correct

    def draw_line_with_style(self, frame, start_point, end_point, color, thickness):
        """Draw a line with specified style."""
        cv2.line(frame, start_point, end_point, color, thickness, lineType=cv2.LINE_AA)

    def draw_circle(self, frame, center, color, radius):
        """Draw a circle with specified style."""
        cv2.circle(frame, center, radius, color, -1)

def main():
    # Initialize WallPushUpsTracker
    tracker = WallPushUpsTracker()

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
                counter, stage, form_correct = tracker.track_wall_push_ups(results.pose_landmarks.landmark, frame)

            # Display the frame
            cv2.imshow('Wall Push-Ups Tracker', frame)

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
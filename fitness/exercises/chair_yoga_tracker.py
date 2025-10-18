import cv2
import time
import mediapipe as mp
import math

class ChairYogaTracker:
    def __init__(self):
        self.counter = 0  # Counts completed poses or repetitions
        self.stage = "Initial"  # Tracks current pose: 'Initial', 'SpinalTwistLeft', 'SpinalTwistRight', 'Cat', 'Cow', 'KneeLiftLeft', 'KneeLiftRight'
        self.pose_start_time = None  # Tracks start time of current pose
        self.min_pose_duration = 2  # Minimum seconds to hold a pose (for Spinal Twist and Cat-Cow)
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
        """Detect and classify chair yoga poses based on landmarks."""
        # Extract key landmarks
        shoulder_left = [int(landmarks[11].x * frame.shape[1]), int(landmarks[11].y * frame.shape[0])]
        shoulder_right = [int(landmarks[12].x * frame.shape[1]), int(landmarks[12].y * frame.shape[0])]
        hip_left = [int(landmarks[23].x * frame.shape[1]), int(landmarks[23].y * frame.shape[0])]
        hip_right = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]
        knee_left = [int(landmarks[25].x * frame.shape[1]), int(landmarks[25].y * frame.shape[0])]
        knee_right = [int(landmarks[26].x * frame.shape[1]), int(landmarks[26].y * frame.shape[0])]
        ankle_left = [int(landmarks[27].x * frame.shape[1]), int(landmarks[27].y * frame.shape[0])]
        ankle_right = [int(landmarks[28].x * frame.shape[1]), int(landmarks[28].y * frame.shape[0])]

        # Calculate key angles
        shoulder_hip_angle_left = self.calculate_angle(shoulder_left, hip_left, knee_left)
        shoulder_hip_angle_right = self.calculate_angle(shoulder_right, hip_right, knee_right)
        hip_knee_angle_left = self.calculate_angle(hip_left, knee_left, ankle_left)
        hip_knee_angle_right = self.calculate_angle(hip_right, knee_right, ankle_right)

        # Calculate shoulder alignment for twist (angle between shoulders and hips)
        shoulder_vector = [shoulder_right[0] - shoulder_left[0], shoulder_right[1] - shoulder_left[1]]
        hip_vector = [hip_right[0] - hip_left[0], hip_right[1] - hip_left[1]]
        dot_product = shoulder_vector[0] * hip_vector[0] + shoulder_vector[1] * hip_vector[1]
        magnitude_shoulder = math.sqrt(shoulder_vector[0]**2 + shoulder_vector[1]**2)
        magnitude_hip = math.sqrt(hip_vector[0]**2 + hip_vector[1]**2)
        if magnitude_shoulder == 0 or magnitude_hip == 0:
            twist_angle = 0
        else:
            cos_angle = dot_product / (magnitude_shoulder * magnitude_hip)
            cos_angle = max(min(cos_angle, 1), -1)
            twist_angle = math.degrees(math.acos(cos_angle))

        # Pose detection logic
        current_pose = "Initial"
        # Seated Spinal Twist: Shoulders rotated relative to hips, seated posture
        if twist_angle > 30 and shoulder_hip_angle_left > 80 and shoulder_hip_angle_right > 80:
            current_pose = "SpinalTwistLeft" if shoulder_left[0] > hip_left[0] else "SpinalTwistRight"
        # Seated Cat-Cow: Back arched (Cow) or rounded (Cat), seated with knees bent
        elif shoulder_hip_angle_left < 100 and shoulder_hip_angle_right < 100 and hip_knee_angle_left > 80 and hip_knee_angle_right > 80:
            current_pose = "Cow"
        elif shoulder_hip_angle_left > 120 and shoulder_hip_angle_right > 120 and hip_knee_angle_left > 80 and hip_knee_angle_right > 80:
            current_pose = "Cat"
        # Seated Knee Lifts: One knee raised significantly higher than the other
        elif knee_left[1] < knee_right[1] - frame.shape[0] * 0.1 and hip_knee_angle_left < 80:
            current_pose = "KneeLiftLeft"
        elif knee_right[1] < knee_left[1] - frame.shape[0] * 0.1 and hip_knee_angle_right < 80:
            current_pose = "KneeLiftRight"

        return current_pose, shoulder_hip_angle_left, hip_knee_angle_left, twist_angle

    def track_chair_yoga(self, landmarks, frame):
        """Track chair yoga poses, update counter and stage."""
        current_time = time.time()

        # Detect current pose
        current_pose, shoulder_hip_angle, hip_knee_angle, twist_angle = self.detect_pose(landmarks, frame)

        # Draw key landmarks and lines
        shoulder_left = [int(landmarks[11].x * frame.shape[1]), int(landmarks[11].y * frame.shape[0])]
        shoulder_right = [int(landmarks[12].x * frame.shape[1]), int(landmarks[12].y * frame.shape[0])]
        hip_left = [int(landmarks[23].x * frame.shape[1]), int(landmarks[23].y * frame.shape[0])]
        hip_right = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]
        knee_left = [int(landmarks[25].x * frame.shape[1]), int(landmarks[25].y * frame.shape[0])]
        knee_right = [int(landmarks[26].x * frame.shape[1]), int(landmarks[26].y * frame.shape[0])]
        ankle_left = [int(landmarks[27].x * frame.shape[1]), int(landmarks[27].y * frame.shape[0])]
        ankle_right = [int(landmarks[28].x * frame.shape[1]), int(landmarks[28].y * frame.shape[0])]

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
        cv2.putText(frame, f'Shoulder-Hip: {int(shoulder_hip_angle)}', (hip_left[0] + 10, hip_left[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        cv2.putText(frame, f'Hip-Knee: {int(hip_knee_angle)}', (knee_left[0] + 10, knee_left[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        cv2.putText(frame, f'Twist Angle: {int(twist_angle)}', (shoulder_left[0] + 10, shoulder_left[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        # Update stage and counter
        pose_correct = current_pose != "Initial"
        if pose_correct and self.stage != current_pose:
            self.stage = current_pose
            self.pose_start_time = current_time
        elif pose_correct and self.stage == current_pose:
            pose_duration = current_time - self.pose_start_time
            if pose_duration >= self.min_pose_duration and current_time - self.last_pose_update > 1:
                self.counter += 1
                self.last_pose_update = current_time
        else:
            self.stage = "Initial"
            self.pose_start_time = None

        # Display feedback
        cv2.putText(frame, f'Poses/Reps: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Current Pose: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Pose Correct: {"Yes" if pose_correct else "No"}', (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0) if pose_correct else (0, 0, 255), 2)

        return self.counter, self.stage, pose_correct

    def draw_line_with_style(self, frame, start_point, end_point, color, thickness):
        """Draw a line with specified style."""
        cv2.line(frame, start_point, end_point, color, thickness, lineType=cv2.LINE_AA)

    def draw_circle(self, frame, center, color, radius):
        """Draw a circle with specified style."""
        cv2.circle(frame, center, radius, color, -1)

def main():
    # Initialize ChairYogaTracker
    tracker = ChairYogaTracker()

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
                counter, stage, pose_correct = tracker.track_chair_yoga(results.pose_landmarks.landmark, frame)

            # Display the frame
            cv2.imshow('Chair Yoga Tracker', frame)

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
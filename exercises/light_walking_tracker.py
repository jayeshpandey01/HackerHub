import cv2
import time
import mediapipe as mp

class LightWalkingTracker:
    def __init__(self):
        self.step_counter = 0  # Counts steps
        self.stage = "Initial"  # Tracks leg stage: 'Initial', 'Right Up', 'Left Up'
        self.session_start_time = None  # Tracks start of walking session
        self.session_duration = 0  # Tracks session duration in seconds
        self.min_duration = 5 * 60  # Minimum session duration (5 minutes)
        self.max_duration = 10 * 60  # Maximum session duration (10 minutes)
        self.last_step_time = time.time()  # Tracks time of last step
        self.steps_per_minute = 0  # Tracks pace (steps per minute)
        self.slow_pace_min = 40  # Minimum steps per minute for slow pace
        self.slow_pace_max = 60  # Maximum steps per minute for slow pace
        self.mp_pose = mp.solutions.pose.Pose(static_image_mode=False, min_detection_confidence=0.5, min_tracking_confidence=0.5)

    def calculate_pace(self):
        """Calculate steps per minute based on recent steps."""
        current_time = time.time()
        elapsed = current_time - self.last_step_time
        if elapsed > 0 and self.step_counter > 0:
            # Use a 10-second window to calculate pace
            if elapsed < 10:
                self.steps_per_minute = (1 / elapsed) * 60  # Steps per minute
            else:
                self.steps_per_minute = 0
        return self.steps_per_minute

    def track_walking(self, landmarks, frame):
        """Track walking/marching steps and session duration."""
        current_time = time.time()

        # Start session timer if not started
        if self.session_start_time is None:
            self.session_start_time = current_time

        # Update session duration
        self.session_duration = current_time - self.session_start_time

        # Extract knee landmarks
        knee_right = [int(landmarks[26].x * frame.shape[1]), int(landmarks[26].y * frame.shape[0])]
        knee_left = [int(landmarks[25].x * frame.shape[1]), int(landmarks[25].y * frame.shape[0])]
        ankle_right = [int(landmarks[28].x * frame.shape[1]), int(landmarks[28].y * frame.shape[0])]
        ankle_left = [int(landmarks[27].x * frame.shape[1]), int(landmarks[27].y * frame.shape[0])]
        hip_right = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]
        hip_left = [int(landmarks[23].x * frame.shape[1]), int(landmarks[23].y * frame.shape[0])]

        # Draw lines and circles for visualization
        self.draw_line_with_style(frame, hip_right, knee_right, (0, 0, 255), 2)
        self.draw_line_with_style(frame, knee_right, ankle_right, (0, 0, 255), 2)
        self.draw_line_with_style(frame, hip_left, knee_left, (102, 0, 0), 2)
        self.draw_line_with_style(frame, knee_left, ankle_left, (102, 0, 0), 2)

        self.draw_circle(frame, hip_right, (0, 0, 255), 8)
        self.draw_circle(frame, knee_right, (0, 0, 255), 8)
        self.draw_circle(frame, ankle_right, (0, 0, 255), 8)
        self.draw_circle(frame, hip_left, (102, 0, 0), 8)
        self.draw_circle(frame, knee_left, (102, 0, 0), 8)
        self.draw_circle(frame, ankle_left, (102, 0, 0), 8)

        # Detect step based on knee height (relative to hips)
        # A step is counted when one knee is significantly higher than the other
        knee_height_threshold = frame.shape[0] * 0.1  # 10% of frame height
        step_detected = False

        if knee_right[1] < knee_left[1] - knee_height_threshold and self.stage != "Right Up":
            self.stage = "Right Up"
            step_detected = True
        elif knee_left[1] < knee_right[1] - knee_height_threshold and self.stage != "Left Up":
            self.stage = "Left Up"
            step_detected = True
        elif abs(knee_right[1] - knee_left[1]) < knee_height_threshold * 0.5:
            self.stage = "Initial"

        # Update step counter and pace
        if step_detected and current_time - self.last_step_time > 0.5:  # Avoid rapid counting
            self.step_counter += 1
            self.last_step_time = current_time
            self.calculate_pace()

        # Check if pace is within slow range
        pace_status = "Good" if self.slow_pace_min <= self.steps_per_minute <= self.slow_pace_max else "Adjust Pace"

        # Display feedback
        cv2.putText(frame, f'Steps: {self.step_counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Duration: {self.session_duration:.1f}s', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Pace: {int(self.steps_per_minute)} steps/min ({pace_status})', (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0) if pace_status == "Good" else (0, 0, 255), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 120), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        # Check if session duration is within 5-10 minutes
        duration_status = "Ongoing"
        if self.session_duration >= self.max_duration:
            duration_status = "Session Complete"
        elif self.session_duration < self.min_duration:
            duration_status = "Keep Going"

        cv2.putText(frame, f'Session: {duration_status}', (10, 150), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        return self.step_counter, self.session_duration, self.steps_per_minute, self.stage

    def draw_line_with_style(self, frame, start_point, end_point, color, thickness):
        """Draw a line with specified style."""
        cv2.line(frame, start_point, end_point, color, thickness, lineType=cv2.LINE_AA)

    def draw_circle(self, frame, center, color, radius):
        """Draw a circle with specified style."""
        cv2.circle(frame, center, radius, color, -1)

def main():
    # Initialize LightWalkingTracker
    tracker = LightWalkingTracker()

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
                step_counter, session_duration, steps_per_minute, stage = tracker.track_walking(results.pose_landmarks.landmark, frame)

            # Display the frame
            cv2.imshow('Light Walking Tracker', frame)

            # Exit on 'q' key press or if session exceeds max duration
            if cv2.waitKey(1) & 0xFF == ord('q') or session_duration >= tracker.max_duration:
                break

    finally:
        # Release resources
        cap.release()
        cv2.destroyAllWindows()
        tracker.mp_pose.close()

if __name__ == "__main__":
    main()
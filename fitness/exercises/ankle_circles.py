import cv2
import time
from pose_estimation.angle_calculation import calculate_angle

class AnkleCircles:
    def __init__(self):
        self.counter = 0
        self.stage = "Initial"  # Tracks the stage of the ankle circle
        self.angle_threshold_forward = 160  # Angle for forward position
        self.angle_threshold_backward = 90  # Angle for backward position
        self.last_counter_update = time.time()  # Track time of last counter update
        self.direction = None  # Tracks direction of circle (clockwise/counterclockwise)
        self.cycle_complete = False  # Tracks if a full circle is completed

    def calculate_hip_knee_ankle_angle(self, hip, knee, ankle):
        """Calculate the angle between hip, knee, and ankle."""
        return calculate_angle(hip, knee, ankle)

    def track_ankle_circles(self, landmarks, frame):
        # Right side landmarks (hip, knee, ankle)
        hip_right = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]
        knee_right = [int(landmarks[26].x * frame.shape[1]), int(landmarks[26].y * frame.shape[0])]
        ankle_right = [int(landmarks[28].x * frame.shape[1]), int(landmarks[28].y * frame.shape[0])]

        # Left side landmarks (hip, knee, ankle)
        hip_left = [int(landmarks[23].x * frame.shape[1]), int(landmarks[23].y * frame.shape[0])]
        knee_left = [int(landmarks[25].x * frame.shape[1]), int(landmarks[25].y * frame.shape[0])]
        ankle_left = [int(landmarks[27].x * frame.shape[1]), int(landmarks[27].y * frame.shape[0])]

        # Calculate angles for ankle circle tracking (focusing on right side for simplicity)
        angle_right = self.calculate_hip_knee_ankle_angle(hip_right, knee_right, ankle_right)
        angle_left = self.calculate_hip_knee_ankle_angle(hip_left, knee_left, ankle_left)

        # Draw lines with style for right side
        self.draw_line_with_style(frame, hip_right, knee_right, (0, 0, 255), 2)
        self.draw_line_with_style(frame, knee_right, ankle_right, (0, 0, 255), 2)

        # Draw lines with style for left side
        self.draw_line_with_style(frame, hip_left, knee_left, (102, 0, 0), 2)
        self.draw_line_with_style(frame, knee_left, ankle_left, (102, 0, 0), 2)

        # Draw circles to highlight key points
        self.draw_circle(frame, hip_right, (0, 0, 255), 8)
        self.draw_circle(frame, knee_right, (0, 0, 255), 8)
        self.draw_circle(frame, ankle_right, (0, 0, 255), 8)

        self.draw_circle(frame, hip_left, (102, 0, 0), 8)
        self.draw_circle(frame, knee_left, (102, 0, 0), 8)
        self.draw_circle(frame, ankle_left, (102, 0, 0), 8)

        # Update angle text positions and display
        angle_text_position_right = (knee_right[0] + 10, knee_right[1] - 10)
        cv2.putText(frame, f'Angle: {int(angle_right)}', angle_text_position_right, cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        angle_text_position_left = (knee_left[0] + 10, knee_left[1] - 10)
        cv2.putText(frame, f'Angle: {int(angle_left)}', angle_text_position_left, cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        # Get current time
        current_time = time.time()

        # Update stage and counter for right ankle (can be extended for left)
        if angle_right > self.angle_threshold_forward and self.stage != "Forward":
            self.stage = "Forward"
            self.direction = "clockwise" if angle_right > self.angle_threshold_forward else None
        elif angle_right < self.angle_threshold_backward and self.stage == "Forward":
            self.stage = "Backward"
            self.cycle_complete = True
        elif angle_right > self.angle_threshold_forward and self.stage == "Backward" and self.cycle_complete:
            self.stage = "Forward"
            if current_time - self.last_counter_update > 1:  # 1 second threshold to avoid rapid counting
                self.counter += 1
                self.last_counter_update = current_time
                self.cycle_complete = False  # Reset for next cycle

        # Display counter and stage
        cv2.putText(frame, f'Circles: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        return self.counter, angle_right, self.stage

    def draw_line_with_style(self, frame, start_point, end_point, color, thickness):
        """Draw a line with specified style."""
        cv2.line(frame, start_point, end_point, color, thickness, lineType=cv2.LINE_AA)

    def draw_circle(self, frame, center, color, radius):
        """Draw a circle with specified style."""
        cv2.circle(frame, center, radius, color, -1)  # -1 to fill the circle
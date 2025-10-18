import cv2
import time
from pose_estimation.angle_calculation import calculate_angle

class ResistanceBandDorsiflexion:
    def __init__(self):
        self.counter = 0
        self.stage = "Initial"  # Tracks the stage: 'Neutral' or 'Dorsiflexed'
        self.angle_threshold_dorsiflexed = 70  # Angle for dorsiflexed position (foot flexed upward)
        self.angle_threshold_neutral = 110  # Angle for neutral position (foot extended)
        self.last_counter_update = time.time()  # Track time of last counter update

    def calculate_knee_ankle_toe_angle(self, knee, ankle, toe):
        """Calculate the angle between knee, ankle, and toe."""
        return calculate_angle(knee, ankle, toe)

    def track_dorsiflexion(self, landmarks, frame):
        # Right side landmarks (knee, ankle, toe)
        knee_right = [int(landmarks[26].x * frame.shape[1]), int(landmarks[26].y * frame.shape[0])]
        ankle_right = [int(landmarks[28].x * frame.shape[1]), int(landmarks[28].y * frame.shape[0])]
        toe_right = [int(landmarks[32].x * frame.shape[1]), int(landmarks[32].y * frame.shape[0])]

        # Left side landmarks (knee, ankle, toe)
        knee_left = [int(landmarks[25].x * frame.shape[1]), int(landmarks[25].y * frame.shape[0])]
        ankle_left = [int(landmarks[27].x * frame.shape[1]), int(landmarks[27].y * frame.shape[0])]
        toe_left = [int(landmarks[31].x * frame.shape[1]), int(landmarks[31].y * frame.shape[0])]

        # Calculate angles for dorsiflexion tracking (focusing on right side for simplicity)
        angle_right = self.calculate_knee_ankle_toe_angle(knee_right, ankle_right, toe_right)
        angle_left = self.calculate_knee_ankle_toe_angle(knee_left, ankle_left, toe_left)

        # Draw lines with style for right side
        self.draw_line_with_style(frame, knee_right, ankle_right, (0, 0, 255), 2)
        self.draw_line_with_style(frame, ankle_right, toe_right, (0, 0, 255), 2)

        # Draw lines with style for left side
        self.draw_line_with_style(frame, knee_left, ankle_left, (102, 0, 0), 2)
        self.draw_line_with_style(frame, ankle_left, toe_left, (102, 0, 0), 2)

        # Draw circles to highlight key points
        self.draw_circle(frame, knee_right, (0, 0, 255), 8)
        self.draw_circle(frame, ankle_right, (0, 0, 255), 8)
        self.draw_circle(frame, toe_right, (0, 0, 255), 8)

        self.draw_circle(frame, knee_left, (102, 0, 0), 8)
        self.draw_circle(frame, ankle_left, (102, 0, 0), 8)
        self.draw_circle(frame, toe_left, (102, 0, 0), 8)

        # Update angle text positions and display
        angle_text_position_right = (ankle_right[0] + 10, ankle_right[1] - 10)
        cv2.putText(frame, f'Angle: {int(angle_right)}', angle_text_position_right, cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        angle_text_position_left = (ankle_left[0] + 10, ankle_left[1] - 10)
        cv2.putText(frame, f'Angle: {int(angle_left)}', angle_text_position_left, cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        # Get current time
        current_time = time.time()

        # Update stage and counter for right ankle (can be extended for left)
        if angle_right > self.angle_threshold_neutral:
            self.stage = "Neutral"
        elif angle_right < self.angle_threshold_dorsiflexed and self.stage == "Neutral":
            self.stage = "Dorsiflexed"
            # Increment counter only if enough time has passed since last update
            if current_time - self.last_counter_update > 1:  # 1 second threshold
                self.counter += 1
                self.last_counter_update = current_time
        elif angle_right > self.angle_threshold_neutral and self.stage == "Dorsiflexed":
            self.stage = "Neutral"  # Reset to neutral after completing dorsiflexion

        # Display counter and stage
        cv2.putText(frame, f'Reps: {self.counter}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        return self.counter, angle_right, self.stage

    def draw_line_with_style(self, frame, start_point, end_point, color, thickness):
        """Draw a line with specified style."""
        cv2.line(frame, start_point, end_point, color, thickness, lineType=cv2.LINE_AA)

    def draw_circle(self, frame, center, color, radius):
        """Draw a circle with specified style."""
        cv2.circle(frame, center, radius, color, -1)  # -1 to fill the circle
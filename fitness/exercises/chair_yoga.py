import cv2
import numpy as np
from pose_estimation.angle_calculation import calculate_angle

class ChairYoga:
    def __init__(self):
        self.counter_right = 0
        self.counter_left = 0
        self.stage_right = None  # 'up' or 'down' for right arm
        self.stage_left = None  # 'up' or 'down' for left arm

        self.spinal_angle_threshold = 15  # Threshold for spinal misalignment (degrees from vertical)
        self.arm_angle_up = 160  # Arm angle for 'up' stage (arms raised)
        self.arm_angle_down = 60  # Arm angle for 'down' stage (arms at sides)

    def calculate_arm_angle(self, shoulder, elbow, wrist):
        """Calculate the angle between shoulder, elbow, and wrist."""
        return calculate_angle(shoulder, elbow, wrist)

    def calculate_spinal_angle(self, shoulder, hip):
        """Calculate the angle of shoulder-hip line relative to vertical."""
        # Vertical line (y-axis): from shoulder to a point directly below it
        vertical_point = [shoulder[0], shoulder[1] + 100]  # Arbitrary point 100 pixels below shoulder
        return calculate_angle(shoulder, hip, vertical_point)

    def track_chair_yoga(self, landmarks, frame):
        # Right arm landmarks (shoulder, elbow, wrist, hip)
        shoulder_right = [int(landmarks[11].x * frame.shape[1]), int(landmarks[11].y * frame.shape[0])]
        elbow_right = [int(landmarks[13].x * frame.shape[1]), int(landmarks[13].y * frame.shape[0])]
        wrist_right = [int(landmarks[15].x * frame.shape[1]), int(landmarks[15].y * frame.shape[0])]
        hip_right = [int(landmarks[23].x * frame.shape[1]), int(landmarks[23].y * frame.shape[0])]

        # Left arm landmarks (shoulder, elbow, wrist, hip)
        shoulder_left = [int(landmarks[12].x * frame.shape[1]), int(landmarks[12].y * frame.shape[0])]
        elbow_left = [int(landmarks[14].x * frame.shape[1]), int(landmarks[14].y * frame.shape[0])]
        wrist_left = [int(landmarks[16].x * frame.shape[1]), int(landmarks[16].y * frame.shape[0])]
        hip_left = [int(landmarks[24].x * frame.shape[1]), int(landmarks[24].y * frame.shape[0])]

        # Calculate arm angles for counting (shoulder-elbow-wrist)
        angle_right_arm = self.calculate_arm_angle(shoulder_right, elbow_right, wrist_right)
        angle_left_arm = self.calculate_arm_angle(shoulder_left, elbow_left, wrist_left)

        # Calculate spinal alignment angles (shoulder-hip relative to vertical)
        angle_right_spine = self.calculate_spinal_angle(shoulder_right, hip_right)
        angle_left_spine = self.calculate_spinal_angle(shoulder_left, hip_left)

        # Draw lines for visualization
        self.draw_line_with_style(frame, shoulder_right, elbow_right, (0, 255, 0), 4)
        self.draw_line_with_style(frame, elbow_right, wrist_right, (0, 255, 0), 4)
        self.draw_line_with_style(frame, shoulder_right, hip_right, (255, 0, 0), 3)

        self.draw_line_with_style(frame, shoulder_left, elbow_left, (0, 255, 0), 4)
        self.draw_line_with_style(frame, elbow_left, wrist_left, (0, 255, 0), 4)
        self.draw_line_with_style(frame, shoulder_left, hip_left, (255, 0, 0), 3)

        # Draw circles to highlight key points
        self.draw_circle(frame, shoulder_right, (0, 255, 0), 8)
        self.draw_circle(frame, elbow_right, (0, 255, 0), 8)
        self.draw_circle(frame, wrist_right, (0, 255, 0), 8)
        self.draw_circle(frame, hip_right, (255, 0, 0), 8)

        self.draw_circle(frame, shoulder_left, (0, 255, 0), 8)
        self.draw_circle(frame, elbow_left, (0, 255, 0), 8)
        self.draw_circle(frame, wrist_left, (0, 255, 0), 8)
        self.draw_circle(frame, hip_left, (255, 0, 0), 8)

        # Display arm angles
        angle_text_position_right = (elbow_right[0] + 10, elbow_right[1] - 10)
        cv2.putText(frame, f'Arm Angle: {int(angle_right_arm)}', angle_text_position_right, cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                    (255, 255, 255), 2)

        angle_text_position_left = (elbow_left[0] + 10, elbow_left[1] - 10)
        cv2.putText(frame, f'Arm Angle: {int(angle_left_arm)}', angle_text_position_left, cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                    (255, 255, 255), 2)

        # Check for spinal misalignment
        warning_message_right = None
        warning_message_left = None
        if abs(angle_right_spine) > self.spinal_angle_threshold:
            warning_message_right = f"Right Spine Misalignment! Angle: {angle_right_spine:.2f}°"
        if abs(angle_left_spine) > self.spinal_angle_threshold:
            warning_message_left = f"Left Spine Misalignment! Angle: {angle_left_spine:.2f}°"

        # Track arm movement for counting repetitions
        if angle_right_arm > self.arm_angle_up:
            self.stage_right = "Up"
        elif angle_right_arm < self.arm_angle_down and self.stage_right == "Up":
            self.stage_right = "Down"
            self.counter_right += 1

        if angle_left_arm > self.arm_angle_up:
            self.stage_left = "Up"
        elif angle_left_arm < self.arm_angle_down and self.stage_left == "Up":
            self.stage_left = "Down"
            self.counter_left += 1

        # Progress percentages: 1 for "up", 0 for "down"
        progress_right = 1 if self.stage_right == "Up" else 0
        progress_left = 1 if self.stage_left == "Up" else 0

        return (self.counter_right, angle_right_arm, self.counter_left, angle_left_arm,
                warning_message_right, warning_message_left, progress_right, progress_left,
                self.stage_right, self.stage_left)

    def draw_line_with_style(self, frame, start_point, end_point, color, thickness):
        cv2.line(frame, start_point, end_point, color, thickness, lineType=cv2.LINE_AA)

    def draw_circle(self, frame, center, color, radius):
        cv2.circle(frame, center, radius, color, -1)  # -1 to fill the circle
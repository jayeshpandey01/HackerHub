# feedback/layout.py

from feedback.indicators import draw_squat_indicators, draw_pushup_indicators, draw_hammercurl_indicators, draw_chairyoga_indicators, draw_breathing_indicators

def layout_indicators(frame, exercise_type, exercise_data):
    if exercise_type == "squat":
        counter, angle, stage = exercise_data
        draw_squat_indicators(frame, counter, angle, stage)
    elif exercise_type == "push_up":
        counter, angle, stage = exercise_data
        draw_pushup_indicators(frame, counter, angle, stage)
    elif exercise_type == "hammer_curl":
        (counter_right, angle_right, counter_left, angle_left,
         warning_message_right, warning_message_left, progress_right, progress_left,stage_right,stage_left) = exercise_data
        draw_hammercurl_indicators(frame, counter_right, angle_right, counter_left, angle_left, stage_right,stage_left)
    elif exercise_type == "chair_yoga":
        (counter_right, angle_right, counter_left, angle_left,
         warning_message_right, warning_message_left, progress_right, progress_left,stage_right,stage_left) = exercise_data
        draw_chairyoga_indicators(frame, counter_right, angle_right, counter_left, angle_left, stage_right,stage_left)
    elif exercise_type == "breathing_exercise":
        cycle_count, finger_count, phase, warning_message, progress = exercise_data
        draw_breathing_indicators(frame, cycle_count, finger_count, phase, warning_message, progress)


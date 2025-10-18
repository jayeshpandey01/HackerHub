# feedback/indicators.py
from utils.drawing_utils import draw_gauge_meter,draw_progress_bar,display_stage,display_counter

display_counter_poisiton=(40, 240)
display_stage_poisiton=(40, 270)
display_counter_angel_color=(255,255,0)


def draw_squat_indicators(frame, counter, angle, stage):
    # Counter
    display_counter(frame,counter, position=display_counter_poisiton, color=(0, 0, 0),background_color=(192,192,192))

    # Stage
    display_stage(frame, stage,"Stage", position=display_stage_poisiton, color=(0, 0, 0),background_color=(192,192,192))

    draw_progress_bar(frame, exercise="squat", value=counter, position=(40, 170), size=(200, 20), color=(163, 245, 184, 1),background_color=(255,255,255))

    draw_gauge_meter(frame, angle=angle, text="Squat Gauge Meter", position=(135, 415), radius=75, color=(0, 0, 255))

def draw_pushup_indicators(frame, counter, angle, stage):
    # Counter
    display_counter(frame,counter, position=display_counter_poisiton, color=(0, 0, 0),background_color=(192,192,192))

    display_stage(frame, stage,"Stage", position=display_stage_poisiton, color=(0, 0, 0),background_color=(192,192,192))
    draw_progress_bar(frame, exercise="push_up", value=counter, position=(40, 170), size=(200, 20), color=(163, 245, 184, 1),background_color=(255,255,255))

    text = "Push-u Gauge Meter"
    draw_gauge_meter(frame, angle=angle,text=text, position=(350,80), radius=50, color=(0, 102, 204))


def draw_hammercurl_indicators(frame, counter_right, angle_right, counter_left, angle_left, stage_right, stage_left):
    display_counter_poisiton_left_arm = (40, 300)

    # Right Arm Indicators
    display_counter(frame, counter_right, position=display_counter_poisiton, color=(0, 0, 0),background_color=(192,192,192))

    display_stage(frame, stage_right,"Right Stage", position=display_stage_poisiton, color=(0, 0, 0),background_color=(192,192,192))
    display_stage(frame, stage_left,"Left Stage", position=display_counter_poisiton_left_arm, color=(0, 0, 0),background_color=(192,192,192))

    # Progress Bars
    draw_progress_bar(frame, exercise="hammer_curl", value=(counter_right+counter_left)/2, position=(40, 170), size=(200, 20), color=(163, 245, 184, 1),background_color=(255,255,255))

    text_right = "Right Gauge Meter"
    text_left = "Left Gauge Meter"

    # Gauge Meters for Angles
    draw_gauge_meter(frame, angle=angle_right,text=text_right, position=(1200,80), radius=50, color=(0, 102, 204))
    draw_gauge_meter(frame, angle=angle_left,text=text_left, position=(1200,240), radius=50, color=(0, 102, 204))


def draw_chairyoga_indicators(frame, counter_right, angle_right, counter_left, angle_left, stage_right, stage_left):
    display_counter_poisiton_left_arm = (40, 300)

    # Right Arm Indicators
    display_counter(frame, counter_right, position=display_counter_poisiton, color=(0, 0, 0),background_color=(192,192,192))

    display_stage(frame, stage_right,"Right Stage", position=display_stage_poisiton, color=(0, 0, 0),background_color=(192,192,192))
    display_stage(frame, stage_left,"Left Stage", position=display_counter_poisiton_left_arm, color=(0, 0, 0),background_color=(192,192,192))

    # Progress Bars
    draw_progress_bar(frame, exercise="chair_yoga", value=(counter_right+counter_left)/2, position=(40, 170), size=(200, 20), color=(163, 245, 184, 1),background_color=(255,255,255))

    text_right = "Right Arm Meter"
    text_left = "Left Arm Meter"

    # Gauge Meters for Angles
    draw_gauge_meter(frame, angle=angle_right,text=text_right, position=(1200,80), radius=50, color=(0, 102, 204))
    draw_gauge_meter(frame, angle=angle_left,text=text_left, position=(1200,240), radius=50, color=(0, 102, 204))



def draw_breathing_indicators(frame, cycle_count, finger_count, phase, warning_message, progress):
    import cv2
    # Display cycle count
    display_counter(frame, cycle_count, position=display_counter_poisiton, color=(0, 0, 0), background_color=(192,192,192))
    
    # Display current phase
    display_stage(frame, phase, "Phase", position=display_stage_poisiton, color=(0, 0, 0), background_color=(192,192,192))
    
    # Display finger count
    display_stage(frame, f"{finger_count} fingers", "Current", position=(40, 300), color=(0, 0, 0), background_color=(192,192,192))
    
    # Progress bar for breathing cycle
    draw_progress_bar(frame, exercise="breathing_exercise", value=cycle_count, position=(40, 170), size=(200, 20), color=(163, 245, 184, 1), background_color=(255,255,255))
    
    # Phase progress gauge
    phase_progress = int(progress * 100)  # Convert to percentage
    draw_gauge_meter(frame, angle=phase_progress, text=f"{phase.capitalize()} Progress", position=(350, 80), radius=50, color=(0, 102, 204))
    
    # Display warning message if present
    if warning_message:
        from utils.draw_text_with_background import draw_text_with_background
        draw_text_with_background(frame, warning_message, (40, 350), 
                                 cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), (0, 0, 255), 2)
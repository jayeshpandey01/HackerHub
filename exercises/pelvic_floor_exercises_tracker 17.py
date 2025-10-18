import cv2
import time
import numpy as np

# Pelvic Floor Exercises: Tracks timed Kegel contractions and releases
class PelvicFloorExercises:
    def __init__(self):
        self.counter = 0
        self.stage = "Rest"
        self.contract_duration = 3  # Seconds to hold contraction
        self.release_duration = 3   # Seconds to release
        self.rest_duration = 2     # Seconds to rest between reps
        self.start_time = time.time()
        self.last_update = time.time()
        self.current_cycle_start = time.time()

    def track_kegel(self, frame):
        current_time = time.time()
        elapsed_time = current_time - self.current_cycle_start

        # Logic: Guide through contract, release, and rest phases
        if self.stage == "Rest" and elapsed_time >= self.rest_duration:
            self.stage = "Contract"
            self.current_cycle_start = current_time
            elapsed_time = 0
        elif self.stage == "Contract" and elapsed_time >= self.contract_duration:
            self.stage = "Release"
            self.current_cycle_start = current_time
            elapsed_time = 0
        elif self.stage == "Release" and elapsed_time >= self.release_duration:
            self.stage = "Rest"
            self.current_cycle_start = current_time
            self.counter += 1  # Count a full Kegel cycle
            self.last_update = current_time
            elapsed_time = 0

        # Create a blank frame for text display
        frame = np.zeros((480, 640, 3), dtype=np.uint8)

        # Display instructions, stage, and timer
        cv2.putText(frame, 'Pelvic Floor (Kegel) Exercise Tracker', (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Stage: {self.stage}', (10, 70), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Reps: {self.counter}', (10, 110), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f'Time in Stage: {int(elapsed_time)}s', (10, 150), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, 'Contract pelvic muscles and release as guided.', (10, 190), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.putText(frame, 'Press "q" to quit.', (10, 230), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        return self.counter, self.stage, elapsed_time

# Main running model
if __name__ == "__main__":
    print("Starting Pelvic Floor Exercises (Kegel) Tracker")
    print("Follow on-screen instructions to contract and release pelvic muscles. Press 'q' to quit.")

    exercise = PelvicFloorExercises()
    
    while True:
        frame = np.zeros((480, 640, 3), dtype=np.uint8)  # Blank frame for GUI
        reps, stage, elapsed_time = exercise.track_kegel(frame)
        
        cv2.imshow('Pelvic Floor Exercises Tracker', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cv2.destroyAllWindows()
    print(f"Exercise complete. Total reps: {exercise.counter}")
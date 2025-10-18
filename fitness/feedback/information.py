def get_exercise_info(exercise_type):
    exercises = {
        "hammer_curl": {
            "name": "Hammer Curl",
            "target_muscles": ["Biceps", "Brachialis"],
            "equipment": "Dumbbells",
            "reps": 8,
            "sets": 1,
            "rest_time": "60 seconds",
            "benefits": [
                "Improves bicep and forearm strength",
                "Enhances grip strength"
            ]
        },
        "push_up": {
            "name": "Push-Up",
            "target_muscles": ["Chest", "Triceps", "Shoulders"],
            "equipment": "Bodyweight",
            "reps": 10,
            "sets": 1,
            "rest_time": "45 seconds",
            "benefits": [
                "Builds upper body strength",
                "Improves core stability"
            ]
        },
        "squat": {
            "name": "Squat",
            "target_muscles": ["Quads", "Glutes", "Hamstrings"],
            "equipment": "Bodyweight or Barbell",
            "reps": 2,
            "sets": 3,
            "rest_time": "60 seconds",
            "benefits": [
                "Builds lower body strength",
                "Improves mobility and balance"
            ]
        },
        "chair_yoga": {
            "name": "Chair Yoga",
            "target_muscles": ["Shoulders", "Arms", "Core"],
            "equipment": "Chair",
            "reps": 8,
            "sets": 2,
            "rest_time": "30 seconds",
            "benefits": [
                "Improves flexibility and posture",
                "Reduces stress and tension",
                "Suitable for all fitness levels"
            ]
        },
        "breathing_exercise": {
            "name": "Breathing Exercise",
            "target_muscles": ["Diaphragm", "Core", "Mind"],
            "equipment": "None",
            "reps": 5,
            "sets": 1,
            "rest_time": "30 seconds",
            "benefits": [
                "Reduces stress and anxiety",
                "Improves focus and concentration",
                "Enhances lung capacity"
            ]
        }
    }

    return exercises.get(exercise_type, {})

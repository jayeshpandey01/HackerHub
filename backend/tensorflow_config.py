"""
TensorFlow Configuration and Warning Suppression
This module configures TensorFlow to suppress unnecessary warnings and optimize performance.
"""

import os
import logging
import warnings

def configure_tensorflow():
    """Configure TensorFlow settings to suppress warnings and optimize performance"""
    
    # Suppress TensorFlow warnings
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # 0=all, 1=info, 2=warning, 3=error
    
    # Suppress specific TensorFlow warnings
    os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable oneDNN optimizations warnings
    
    # Suppress MediaPipe warnings
    os.environ['GLOG_minloglevel'] = '2'  # Suppress Google logging warnings
    
    # Suppress inference feedback manager warnings
    os.environ['TF_DISABLE_SEGMENT_REDUCTION_OP_DETERMINISM_EXCEPTIONS'] = '1'
    
    try:
        import tensorflow as tf
        
        # Configure TensorFlow logging
        tf.get_logger().setLevel(logging.ERROR)
        
        # Disable TensorFlow warnings
        tf.compat.v1.logging.set_verbosity(tf.compat.v1.logging.ERROR)
        
        # Configure GPU memory growth if available
        gpus = tf.config.experimental.list_physical_devices('GPU')
        if gpus:
            try:
                for gpu in gpus:
                    tf.config.experimental.set_memory_growth(gpu, True)
                print(f"✅ Configured {len(gpus)} GPU(s) with memory growth")
            except RuntimeError as e:
                print(f"⚠️ GPU configuration error: {e}")
        
        # Set thread configuration for better performance
        tf.config.threading.set_inter_op_parallelism_threads(0)  # Use all available cores
        tf.config.threading.set_intra_op_parallelism_threads(0)  # Use all available cores
        
        print("✅ TensorFlow configured successfully")
        
    except ImportError:
        print("⚠️ TensorFlow not installed - using fallback pose analysis")
    
    try:
        import mediapipe as mp
        
        # Configure MediaPipe logging
        mp.solutions.drawing_utils.DrawingSpec()  # Initialize MediaPipe
        
        print("✅ MediaPipe configured successfully")
        
    except ImportError:
        print("⚠️ MediaPipe not installed - using fallback pose analysis")

def suppress_warnings():
    """Suppress various Python warnings that may appear during pose analysis"""
    
    # Suppress specific warning categories
    warnings.filterwarnings('ignore', category=UserWarning)
    warnings.filterwarnings('ignore', category=FutureWarning)
    warnings.filterwarnings('ignore', category=DeprecationWarning)
    
    # Suppress specific MediaPipe warnings
    warnings.filterwarnings('ignore', message='.*inference_feedback_manager.*')
    warnings.filterwarnings('ignore', message='.*Feedback manager requires.*')
    
    # Suppress OpenCV warnings
    warnings.filterwarnings('ignore', category=UserWarning, module='cv2')
    
    print("✅ Warning suppression configured")

def optimize_pose_estimation():
    """Configure optimal settings for pose estimation"""
    
    try:
        import mediapipe as mp
        
        # Create optimized pose configuration
        pose_config = {
            'static_image_mode': False,
            'model_complexity': 1,  # Balance between accuracy and speed
            'enable_segmentation': False,  # Disable to improve performance
            'min_detection_confidence': 0.7,
            'min_tracking_confidence': 0.5
        }
        
        print("✅ Pose estimation optimized")
        return pose_config
        
    except ImportError:
        print("⚠️ MediaPipe not available - using default configuration")
        return {}

def get_optimized_pose_instance():
    """Get an optimized MediaPipe Pose instance"""
    
    try:
        import mediapipe as mp
        
        mp_pose = mp.solutions.pose
        
        # Create pose instance with optimized settings
        pose = mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,  # Reduced from 2 for better performance
            enable_segmentation=False,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        
        return pose, mp_pose
        
    except ImportError:
        return None, None

def initialize_pose_analysis():
    """Initialize pose analysis with all optimizations"""
    
    print("🔧 Initializing pose analysis system...")
    
    # Configure TensorFlow
    configure_tensorflow()
    
    # Suppress warnings
    suppress_warnings()
    
    # Optimize pose estimation
    optimize_pose_estimation()
    
    print("✅ Pose analysis system initialized successfully")

# Auto-initialize when module is imported
initialize_pose_analysis()
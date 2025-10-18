#!/usr/bin/env python3
"""
TensorFlow Warning Fix Script
This script helps resolve TensorFlow inference feedback manager warnings
"""

import os
import sys
import subprocess
import logging

def setup_logging():
    """Setup logging configuration"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    return logging.getLogger(__name__)

def set_environment_variables():
    """Set environment variables to suppress TensorFlow warnings"""
    logger = logging.getLogger(__name__)
    
    env_vars = {
        'TF_CPP_MIN_LOG_LEVEL': '2',  # Suppress TensorFlow warnings
        'GLOG_minloglevel': '2',      # Suppress Google logging warnings
        'TF_ENABLE_ONEDNN_OPTS': '0', # Disable oneDNN optimization warnings
        'TF_DISABLE_SEGMENT_REDUCTION_OP_DETERMINISM_EXCEPTIONS': '1'
    }
    
    logger.info("Setting TensorFlow environment variables...")
    
    for var, value in env_vars.items():
        os.environ[var] = value
        logger.info(f"Set {var}={value}")
    
    logger.info("✅ Environment variables configured")

def check_tensorflow_installation():
    """Check if TensorFlow is properly installed"""
    logger = logging.getLogger(__name__)
    
    try:
        import tensorflow as tf
        logger.info(f"✅ TensorFlow version: {tf.__version__}")
        
        # Check GPU availability
        gpus = tf.config.experimental.list_physical_devices('GPU')
        if gpus:
            logger.info(f"✅ Found {len(gpus)} GPU(s)")
            for i, gpu in enumerate(gpus):
                logger.info(f"   GPU {i}: {gpu}")
        else:
            logger.info("ℹ️ No GPUs found, using CPU")
        
        return True
        
    except ImportError:
        logger.error("❌ TensorFlow not installed")
        return False
    except Exception as e:
        logger.error(f"❌ TensorFlow error: {e}")
        return False

def check_mediapipe_installation():
    """Check if MediaPipe is properly installed"""
    logger = logging.getLogger(__name__)
    
    try:
        import mediapipe as mp
        logger.info(f"✅ MediaPipe installed")
        
        # Test MediaPipe pose initialization
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        logger.info("✅ MediaPipe Pose initialized successfully")
        
        return True
        
    except ImportError:
        logger.error("❌ MediaPipe not installed")
        return False
    except Exception as e:
        logger.error(f"❌ MediaPipe error: {e}")
        return False

def optimize_tensorflow_config():
    """Apply TensorFlow optimizations"""
    logger = logging.getLogger(__name__)
    
    try:
        import tensorflow as tf
        
        # Configure logging
        tf.get_logger().setLevel(logging.ERROR)
        tf.compat.v1.logging.set_verbosity(tf.compat.v1.logging.ERROR)
        
        # Configure GPU memory growth
        gpus = tf.config.experimental.list_physical_devices('GPU')
        if gpus:
            try:
                for gpu in gpus:
                    tf.config.experimental.set_memory_growth(gpu, True)
                logger.info("✅ GPU memory growth configured")
            except RuntimeError as e:
                logger.warning(f"⚠️ GPU configuration warning: {e}")
        
        # Set threading configuration
        tf.config.threading.set_inter_op_parallelism_threads(0)
        tf.config.threading.set_intra_op_parallelism_threads(0)
        
        logger.info("✅ TensorFlow optimizations applied")
        return True
        
    except Exception as e:
        logger.error(f"❌ TensorFlow optimization error: {e}")
        return False

def test_pose_analysis():
    """Test pose analysis to check for warnings"""
    logger = logging.getLogger(__name__)
    
    try:
        import cv2
        import numpy as np
        import mediapipe as mp
        
        # Create a test image
        test_image = np.zeros((480, 640, 3), dtype=np.uint8)
        
        # Initialize MediaPipe
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose(
            static_image_mode=True,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5
        )
        
        # Process test image
        rgb_image = cv2.cvtColor(test_image, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb_image)
        
        logger.info("✅ Pose analysis test completed without errors")
        return True
        
    except Exception as e:
        logger.error(f"❌ Pose analysis test failed: {e}")
        return False

def install_requirements():
    """Install or upgrade required packages"""
    logger = logging.getLogger(__name__)
    
    packages = [
        'tensorflow>=2.10.0',
        'mediapipe>=0.9.0',
        'opencv-python>=4.5.0',
        'numpy>=1.21.0'
    ]
    
    logger.info("Installing/upgrading required packages...")
    
    for package in packages:
        try:
            logger.info(f"Installing {package}...")
            subprocess.check_call([
                sys.executable, '-m', 'pip', 'install', '--upgrade', package
            ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            logger.info(f"✅ {package} installed/upgraded")
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Failed to install {package}: {e}")
            return False
    
    return True

def create_tensorflow_config_file():
    """Create TensorFlow configuration file"""
    logger = logging.getLogger(__name__)
    
    config_content = '''"""
TensorFlow Configuration for Pose Analysis
This file configures TensorFlow to suppress warnings and optimize performance.
"""

import os
import logging
import warnings

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['GLOG_minloglevel'] = '2'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_DISABLE_SEGMENT_REDUCTION_OP_DETERMINISM_EXCEPTIONS'] = '1'

# Suppress Python warnings
warnings.filterwarnings('ignore', category=UserWarning)
warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', message='.*inference_feedback_manager.*')

try:
    import tensorflow as tf
    tf.get_logger().setLevel(logging.ERROR)
    tf.compat.v1.logging.set_verbosity(tf.compat.v1.logging.ERROR)
    
    # Configure GPU if available
    gpus = tf.config.experimental.list_physical_devices('GPU')
    if gpus:
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
    
    print("✅ TensorFlow configured successfully")
except ImportError:
    print("⚠️ TensorFlow not available")
'''
    
    try:
        with open('tensorflow_config.py', 'w') as f:
            f.write(config_content)
        logger.info("✅ TensorFlow configuration file created")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to create config file: {e}")
        return False

def main():
    """Main function to fix TensorFlow warnings"""
    logger = setup_logging()
    
    logger.info("🔧 Starting TensorFlow warning fix process...")
    
    # Step 1: Set environment variables
    set_environment_variables()
    
    # Step 2: Check installations
    tf_ok = check_tensorflow_installation()
    mp_ok = check_mediapipe_installation()
    
    if not tf_ok or not mp_ok:
        logger.info("📦 Installing missing packages...")
        if not install_requirements():
            logger.error("❌ Failed to install required packages")
            return False
    
    # Step 3: Apply optimizations
    if not optimize_tensorflow_config():
        logger.error("❌ Failed to apply TensorFlow optimizations")
        return False
    
    # Step 4: Test pose analysis
    if not test_pose_analysis():
        logger.error("❌ Pose analysis test failed")
        return False
    
    # Step 5: Create configuration file
    if not create_tensorflow_config_file():
        logger.error("❌ Failed to create configuration file")
        return False
    
    logger.info("✅ TensorFlow warning fix completed successfully!")
    logger.info("")
    logger.info("📋 Next steps:")
    logger.info("1. Restart your backend server")
    logger.info("2. Import tensorflow_config at the top of your main.py")
    logger.info("3. The warnings should now be suppressed")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
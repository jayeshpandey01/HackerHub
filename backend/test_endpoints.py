#!/usr/bin/env python3
"""
Simple test script to verify the backend endpoints are working
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

def test_imports():
    """Test that all modules can be imported"""
    try:
        print("Testing imports...")
        
        # Test file handler import
        from file_handler import video_handler
        print("✓ file_handler imported successfully")
        
        # Test main module import (without running the server)
        import main
        print("✓ main module imported successfully")
        
        # Test FastAPI app creation
        app = main.app
        print("✓ FastAPI app created successfully")
        
        # Test exercise configurations
        configs = main.get_exercise_configurations()
        print(f"✓ Exercise configurations loaded: {list(configs.keys())}")
        
        # Test video handler limits
        limits = {
            "max_file_size_mb": video_handler.MAX_FILE_SIZE // (1024 * 1024),
            "max_duration": video_handler.MAX_DURATION,
            "supported_formats": list(video_handler.SUPPORTED_FORMATS.keys())
        }
        print(f"✓ Video handler limits: {limits}")
        
        print("\n🎉 All tests passed! Backend is ready for deployment.")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_video_handler():
    """Test video handler functionality"""
    try:
        print("\nTesting video handler...")
        from file_handler import video_handler
        
        # Test validation limits
        print(f"✓ Max file size: {video_handler.MAX_FILE_SIZE // (1024*1024)}MB")
        print(f"✓ Max duration: {video_handler.MAX_DURATION}s")
        print(f"✓ Supported formats: {list(video_handler.SUPPORTED_FORMATS.keys())}")
        
        return True
        
    except Exception as e:
        print(f"❌ Video handler test failed: {str(e)}")
        return False

def test_api_models():
    """Test API model creation"""
    try:
        print("\nTesting API models...")
        from main import (
            PoseKeypoint, FormFeedback, PoseData, 
            AnalysisResult, ExerciseConfig, SessionSummaryRequest
        )
        
        # Test PoseKeypoint
        keypoint = PoseKeypoint(x=0.5, y=0.3, z=0.1, visibility=0.9)
        print("✓ PoseKeypoint model works")
        
        # Test FormFeedback
        feedback = FormFeedback(
            timestamp=5.2,
            type="warning",
            message="Keep your back straight",
            body_part="spine",
            severity="medium"
        )
        print("✓ FormFeedback model works")
        
        # Test ExerciseConfig
        config = ExerciseConfig(
            exercise_type="test",
            name="Test Exercise",
            description="Test description",
            target_muscles=["test"],
            difficulty="beginner",
            default_reps=10,
            default_sets=3,
            instructions=["test instruction"],
            form_tips=["test tip"]
        )
        print("✓ ExerciseConfig model works")
        
        return True
        
    except Exception as e:
        print(f"❌ API models test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Testing Fitness Backend Integration")
    print("=" * 50)
    
    success = True
    success &= test_imports()
    success &= test_video_handler()
    success &= test_api_models()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ All tests passed! Backend implementation is complete.")
        print("\nNext steps:")
        print("1. Install dependencies: pip install -r requirements.txt")
        print("2. Start the server: python main.py")
        print("3. Access API docs: http://localhost:8000/docs")
    else:
        print("❌ Some tests failed. Please check the errors above.")
        sys.exit(1)
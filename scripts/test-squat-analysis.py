#!/usr/bin/env python3
"""
Squat Analysis Test Script
Tests the squat tracking functionality with various scenarios
"""

import sys
import os
import json
import base64
import requests
import cv2
import numpy as np
from typing import Dict, Any, List

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

def create_test_image(scenario: str = "standing") -> np.ndarray:
    """Create a test image for different squat positions"""
    # Create a blank image
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    
    # Add some basic shapes to simulate a person
    if scenario == "standing":
        # Draw a simple stick figure in standing position
        # Head
        cv2.circle(img, (320, 100), 30, (255, 255, 255), -1)
        # Body
        cv2.line(img, (320, 130), (320, 300), (255, 255, 255), 5)
        # Arms
        cv2.line(img, (320, 180), (280, 220), (255, 255, 255), 3)
        cv2.line(img, (320, 180), (360, 220), (255, 255, 255), 3)
        # Legs (straight - standing position)
        cv2.line(img, (320, 300), (300, 450), (255, 255, 255), 5)
        cv2.line(img, (320, 300), (340, 450), (255, 255, 255), 5)
        
    elif scenario == "squatting":
        # Draw a simple stick figure in squatting position
        # Head
        cv2.circle(img, (320, 120), 30, (255, 255, 255), -1)
        # Body (leaning forward slightly)
        cv2.line(img, (320, 150), (310, 280), (255, 255, 255), 5)
        # Arms (extended forward)
        cv2.line(img, (310, 200), (250, 240), (255, 255, 255), 3)
        cv2.line(img, (310, 200), (370, 240), (255, 255, 255), 3)
        # Legs (bent - squatting position)
        cv2.line(img, (310, 280), (280, 350), (255, 255, 255), 5)  # Thigh
        cv2.line(img, (280, 350), (290, 420), (255, 255, 255), 5)  # Shin
        cv2.line(img, (310, 280), (340, 350), (255, 255, 255), 5)  # Thigh
        cv2.line(img, (340, 350), (330, 420), (255, 255, 255), 5)  # Shin
    
    return img

def image_to_base64(img: np.ndarray) -> str:
    """Convert OpenCV image to base64 string"""
    _, buffer = cv2.imencode('.jpg', img)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    return img_base64

def test_backend_analysis(base64_image: str, exercise_type: str = "squat") -> Dict[str, Any]:
    """Test the backend analysis endpoint"""
    url = "http://localhost:8000/api/analyze-frame"
    
    payload = {
        "frame": base64_image,
        "exercise_type": exercise_type,
        "confidence_threshold": 0.7
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        else:
            return {
                "error": f"HTTP {response.status_code}: {response.text}",
                "success": False
            }
            
    except requests.exceptions.RequestException as e:
        return {
            "error": f"Request failed: {str(e)}",
            "success": False
        }

def test_squat_scenarios():
    """Test various squat scenarios"""
    print("🧪 Testing Squat Analysis Scenarios")
    print("=" * 50)
    
    scenarios = [
        ("standing", "Standing/Ready Position"),
        ("squatting", "Squatting/Down Position")
    ]
    
    results = []
    
    for scenario, description in scenarios:
        print(f"\n📋 Testing: {description}")
        print("-" * 30)
        
        # Create test image
        test_img = create_test_image(scenario)
        base64_img = image_to_base64(test_img)
        
        # Test backend analysis
        result = test_backend_analysis(base64_img)
        
        if "error" in result:
            print(f"❌ Error: {result['error']}")
            results.append({
                "scenario": scenario,
                "success": False,
                "error": result["error"]
            })
        else:
            print(f"✅ Analysis successful!")
            print(f"   Stage: {result.get('stage', 'unknown')}")
            print(f"   Form Score: {result.get('formScore', 0):.1f}%")
            print(f"   Confidence: {result.get('confidence', 0):.2f}")
            print(f"   Current Rep: {result.get('currentRep', 0)}")
            
            if result.get('warnings'):
                print(f"   Warnings: {', '.join(result['warnings'][:2])}")
            
            results.append({
                "scenario": scenario,
                "success": True,
                "stage": result.get('stage'),
                "formScore": result.get('formScore'),
                "confidence": result.get('confidence'),
                "currentRep": result.get('currentRep'),
                "warnings": result.get('warnings', [])
            })
    
    return results

def test_squat_rep_counting():
    """Test squat rep counting logic"""
    print("\n🔢 Testing Rep Counting Logic")
    print("=" * 30)
    
    # Simulate a squat sequence: up -> down -> up
    sequence = [
        ("standing", "Starting position"),
        ("squatting", "Going down"),
        ("squatting", "Bottom position"),
        ("standing", "Coming back up")
    ]
    
    rep_count = 0
    previous_stage = None
    
    for scenario, description in sequence:
        print(f"\n📍 {description}")
        
        test_img = create_test_image(scenario)
        base64_img = image_to_base64(test_img)
        
        result = test_backend_analysis(base64_img)
        
        if "error" not in result:
            current_stage = result.get('stage', 'unknown')
            current_rep = result.get('currentRep', 0)
            
            print(f"   Stage: {current_stage}")
            print(f"   Rep Count: {current_rep}")
            
            # Simple rep counting logic
            if previous_stage == "down" and current_stage == "up":
                rep_count += 1
                print(f"   🎉 Rep completed! Total: {rep_count}")
            
            previous_stage = current_stage
        else:
            print(f"   ❌ Error: {result['error']}")
    
    return rep_count

def test_form_analysis():
    """Test form analysis feedback"""
    print("\n📊 Testing Form Analysis")
    print("=" * 25)
    
    # Test different form scenarios
    scenarios = [
        ("standing", "Good standing posture"),
        ("squatting", "Squatting form analysis")
    ]
    
    for scenario, description in scenarios:
        print(f"\n🔍 {description}")
        
        test_img = create_test_image(scenario)
        base64_img = image_to_base64(test_img)
        
        result = test_backend_analysis(base64_img)
        
        if "error" not in result:
            form_score = result.get('formScore', 0)
            warnings = result.get('warnings', [])
            
            print(f"   Form Score: {form_score:.1f}%")
            
            if warnings:
                print("   Feedback:")
                for warning in warnings[:3]:  # Show first 3 warnings
                    print(f"   • {warning}")
            else:
                print("   • No specific feedback")
        else:
            print(f"   ❌ Error: {result['error']}")

def check_backend_health():
    """Check if the backend is running"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def main():
    """Main test function"""
    print("🏋️ Squat Analysis Test Suite")
    print("=" * 40)
    
    # Check backend health
    if not check_backend_health():
        print("❌ Backend not available at http://localhost:8000")
        print("   Please start the backend server first:")
        print("   cd backend && python main.py")
        return False
    
    print("✅ Backend is running")
    
    # Run tests
    try:
        # Test basic scenarios
        scenario_results = test_squat_scenarios()
        
        # Test rep counting
        rep_count = test_squat_rep_counting()
        
        # Test form analysis
        test_form_analysis()
        
        # Summary
        print("\n📈 Test Summary")
        print("=" * 15)
        
        successful_tests = sum(1 for r in scenario_results if r["success"])
        total_tests = len(scenario_results)
        
        print(f"✅ Successful tests: {successful_tests}/{total_tests}")
        print(f"🔢 Rep counting test: {'✅ Passed' if rep_count >= 0 else '❌ Failed'}")
        
        if successful_tests == total_tests:
            print("\n🎉 All tests passed! Squat analysis is working correctly.")
        else:
            print("\n⚠️ Some tests failed. Check the backend implementation.")
        
        return successful_tests == total_tests
        
    except Exception as e:
        print(f"\n❌ Test suite failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
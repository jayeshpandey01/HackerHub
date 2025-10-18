"""
Video file handling and validation utilities for pose estimation backend
"""

import os
import tempfile
import shutil
import cv2
import logging
from typing import Tuple, Optional
from fastapi import HTTPException, UploadFile
from datetime import datetime, timedelta
import threading
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VideoFileHandler:
    """Handles video file operations including validation, compression, and cleanup"""
    
    # Supported video formats
    SUPPORTED_FORMATS = {
        'video/mp4': '.mp4',
        'video/avi': '.avi',
        'video/mov': '.mov',
        'video/quicktime': '.mov',
        'video/x-msvideo': '.avi'
    }
    
    # File size limits (in bytes)
    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
    MIN_FILE_SIZE = 1024  # 1KB
    
    # Video duration limits (in seconds)
    MAX_DURATION = 300  # 5 minutes
    MIN_DURATION = 1    # 1 second
    
    # Video resolution limits
    MAX_WIDTH = 1920
    MAX_HEIGHT = 1080
    MIN_WIDTH = 320
    MIN_HEIGHT = 240
    
    def __init__(self, temp_dir: Optional[str] = None):
        """Initialize video file handler
        
        Args:
            temp_dir: Directory for temporary files. If None, uses system temp directory
        """
        self.temp_dir = temp_dir or tempfile.gettempdir()
        self.temp_files = set()  # Track temporary files for cleanup
        self._cleanup_lock = threading.Lock()
        
        # Start cleanup thread
        self._start_cleanup_thread()
    
    def validate_video_file(self, file: UploadFile) -> None:
        """Validate uploaded video file
        
        Args:
            file: FastAPI UploadFile object
            
        Raises:
            HTTPException: If validation fails
        """
        # Check file size
        if hasattr(file, 'size') and file.size:
            if file.size > self.MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail=f"File too large. Maximum size: {self.MAX_FILE_SIZE // (1024*1024)}MB"
                )
            if file.size < self.MIN_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail="File too small"
                )
        
        # Check content type
        if not file.content_type or file.content_type not in self.SUPPORTED_FORMATS:
            supported = ', '.join(self.SUPPORTED_FORMATS.keys())
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format. Supported formats: {supported}"
            )
        
        # Check filename
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="Filename is required"
            )
    
    def validate_video_properties(self, video_path: str) -> Tuple[int, int, float, int]:
        """Validate video properties using OpenCV
        
        Args:
            video_path: Path to video file
            
        Returns:
            Tuple of (width, height, duration, fps)
            
        Raises:
            HTTPException: If validation fails
        """
        try:
            cap = cv2.VideoCapture(video_path)
            
            if not cap.isOpened():
                raise HTTPException(
                    status_code=400,
                    detail="Cannot open video file. File may be corrupted."
                )
            
            # Get video properties
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            cap.release()
            
            # Calculate duration
            duration = frame_count / fps if fps > 0 else 0
            
            # Validate dimensions
            if width < self.MIN_WIDTH or width > self.MAX_WIDTH:
                raise HTTPException(
                    status_code=400,
                    detail=f"Video width must be between {self.MIN_WIDTH} and {self.MAX_WIDTH} pixels"
                )
            
            if height < self.MIN_HEIGHT or height > self.MAX_HEIGHT:
                raise HTTPException(
                    status_code=400,
                    detail=f"Video height must be between {self.MIN_HEIGHT} and {self.MAX_HEIGHT} pixels"
                )
            
            # Validate duration
            if duration < self.MIN_DURATION:
                raise HTTPException(
                    status_code=400,
                    detail=f"Video too short. Minimum duration: {self.MIN_DURATION} seconds"
                )
            
            if duration > self.MAX_DURATION:
                raise HTTPException(
                    status_code=400,
                    detail=f"Video too long. Maximum duration: {self.MAX_DURATION} seconds"
                )
            
            # Validate FPS
            if fps <= 0 or fps > 120:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid video frame rate"
                )
            
            return width, height, duration, int(fps)
            
        except cv2.error as e:
            raise HTTPException(
                status_code=400,
                detail=f"Error reading video properties: {str(e)}"
            )
    
    async def save_uploaded_video(self, file: UploadFile) -> str:
        """Save uploaded video to temporary file
        
        Args:
            file: FastAPI UploadFile object
            
        Returns:
            Path to saved temporary file
            
        Raises:
            HTTPException: If save operation fails
        """
        # Validate file first
        self.validate_video_file(file)
        
        # Get file extension from content type
        extension = self.SUPPORTED_FORMATS.get(file.content_type, '.mp4')
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension,
            dir=self.temp_dir,
            prefix=f"video_{datetime.now().strftime('%Y%m%d_%H%M%S')}_"
        )
        
        try:
            # Read and save file content
            content = await file.read()
            temp_file.write(content)
            temp_file.flush()
            temp_file.close()
            
            # Track temporary file
            with self._cleanup_lock:
                self.temp_files.add(temp_file.name)
            
            # Validate video properties
            self.validate_video_properties(temp_file.name)
            
            logger.info(f"Video saved to temporary file: {temp_file.name}")
            return temp_file.name
            
        except Exception as e:
            # Clean up on error
            try:
                os.unlink(temp_file.name)
            except:
                pass
            
            if isinstance(e, HTTPException):
                raise e
            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"Error saving video file: {str(e)}"
                )
    
    def compress_video(self, input_path: str, target_size_mb: float = 10.0) -> str:
        """Compress video to reduce file size
        
        Args:
            input_path: Path to input video
            target_size_mb: Target file size in MB
            
        Returns:
            Path to compressed video file
        """
        output_path = input_path.replace('.mp4', '_compressed.mp4')
        
        try:
            # Get original video properties
            cap = cv2.VideoCapture(input_path)
            original_fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            cap.release()
            
            # Calculate target bitrate
            duration = frame_count / original_fps
            target_bitrate = int((target_size_mb * 8 * 1024 * 1024) / duration)
            
            # Use OpenCV to compress video
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            
            # Reduce resolution if necessary
            if width > 720:
                new_width = 720
                new_height = int(height * (720 / width))
            else:
                new_width = width
                new_height = height
            
            cap = cv2.VideoCapture(input_path)
            out = cv2.VideoWriter(output_path, fourcc, original_fps, (new_width, new_height))
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Resize frame if needed
                if new_width != width or new_height != height:
                    frame = cv2.resize(frame, (new_width, new_height))
                
                out.write(frame)
            
            cap.release()
            out.release()
            
            # Track compressed file
            with self._cleanup_lock:
                self.temp_files.add(output_path)
            
            logger.info(f"Video compressed: {input_path} -> {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Error compressing video: {str(e)}")
            return input_path  # Return original if compression fails
    
    def cleanup_file(self, file_path: str) -> None:
        """Clean up a specific temporary file
        
        Args:
            file_path: Path to file to clean up
        """
        try:
            if os.path.exists(file_path):
                os.unlink(file_path)
                logger.info(f"Cleaned up file: {file_path}")
            
            with self._cleanup_lock:
                self.temp_files.discard(file_path)
                
        except Exception as e:
            logger.error(f"Error cleaning up file {file_path}: {str(e)}")
    
    def cleanup_all_temp_files(self) -> None:
        """Clean up all tracked temporary files"""
        with self._cleanup_lock:
            files_to_cleanup = self.temp_files.copy()
            self.temp_files.clear()
        
        for file_path in files_to_cleanup:
            try:
                if os.path.exists(file_path):
                    os.unlink(file_path)
                    logger.info(f"Cleaned up temp file: {file_path}")
            except Exception as e:
                logger.error(f"Error cleaning up temp file {file_path}: {str(e)}")
    
    def _start_cleanup_thread(self) -> None:
        """Start background thread for periodic cleanup of old temporary files"""
        def cleanup_old_files():
            while True:
                try:
                    current_time = time.time()
                    cutoff_time = current_time - (2 * 3600)  # 2 hours ago
                    
                    with self._cleanup_lock:
                        files_to_check = self.temp_files.copy()
                    
                    for file_path in files_to_check:
                        try:
                            if os.path.exists(file_path):
                                file_mtime = os.path.getmtime(file_path)
                                if file_mtime < cutoff_time:
                                    self.cleanup_file(file_path)
                            else:
                                # File doesn't exist, remove from tracking
                                with self._cleanup_lock:
                                    self.temp_files.discard(file_path)
                        except Exception as e:
                            logger.error(f"Error checking file {file_path}: {str(e)}")
                    
                    # Sleep for 30 minutes before next cleanup
                    time.sleep(30 * 60)
                    
                except Exception as e:
                    logger.error(f"Error in cleanup thread: {str(e)}")
                    time.sleep(60)  # Wait 1 minute before retrying
        
        cleanup_thread = threading.Thread(target=cleanup_old_files, daemon=True)
        cleanup_thread.start()
        logger.info("Started background cleanup thread")

# Global instance
video_handler = VideoFileHandler()
#!/usr/bin/env python3
"""
Enhanced image processing module for recipe images.
Handles downloading, validation, optimization, and WebP conversion.
"""

import os
import logging
from typing import Optional, Tuple, Dict
from io import BytesIO
import hashlib
from pathlib import Path

import requests
from PIL import Image, ImageOps
import pillow_heif

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Register HEIF opener with Pillow
pillow_heif.register_heif_opener()

# Constants
MIN_IMAGE_WIDTH = 400
MIN_IMAGE_HEIGHT = 300
MAX_IMAGE_WIDTH = 1200
THUMBNAIL_SIZE = (300, 225)
IMAGE_QUALITY = 85
WEBP_QUALITY = 80
REQUEST_TIMEOUT = 15


class ImageProcessor:
    """Enhanced image processor with WebP support and quality validation."""
    
    def __init__(self, storage_path: str = "images", enable_webp: bool = True):
        """
        Initialize the image processor.
        
        Args:
            storage_path: Base path for storing images
            enable_webp: Whether to convert images to WebP format
        """
        self.storage_path = Path(storage_path)
        self.enable_webp = enable_webp
        
        # Create storage directories
        self.storage_path.mkdir(exist_ok=True)
        (self.storage_path / "original").mkdir(exist_ok=True)
        (self.storage_path / "optimized").mkdir(exist_ok=True)
        (self.storage_path / "thumbnails").mkdir(exist_ok=True)
        
    def download_image(self, image_url: str, headers: Optional[Dict] = None) -> Optional[bytes]:
        """
        Download image from URL.
        
        Args:
            image_url: URL of the image to download
            headers: Optional headers for the request
            
        Returns:
            Image data as bytes or None if failed
        """
        try:
            if not headers:
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
                
            response = requests.get(image_url, headers=headers, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            
            # Check content type
            content_type = response.headers.get('content-type', '')
            if not content_type.startswith('image/'):
                logger.warning(f"Invalid content type for {image_url}: {content_type}")
                return None
                
            return response.content
            
        except requests.RequestException as e:
            logger.error(f"Error downloading image from {image_url}: {e}")
            return None
            
    def validate_image(self, image: Image.Image) -> Tuple[bool, str]:
        """
        Validate image quality and dimensions.
        
        Args:
            image: PIL Image object
            
        Returns:
            Tuple of (is_valid, reason)
        """
        # Check dimensions
        if image.width < MIN_IMAGE_WIDTH or image.height < MIN_IMAGE_HEIGHT:
            return False, f"Image too small: {image.width}x{image.height} (min: {MIN_IMAGE_WIDTH}x{MIN_IMAGE_HEIGHT})"
            
        # Check aspect ratio (avoid extremely wide or tall images)
        aspect_ratio = image.width / image.height
        if aspect_ratio > 3 or aspect_ratio < 0.33:
            return False, f"Invalid aspect ratio: {aspect_ratio:.2f}"
            
        # Check mode (ensure it's a proper image)
        if image.mode not in ['RGB', 'RGBA', 'L', 'P']:
            return False, f"Invalid image mode: {image.mode}"
            
        return True, "Valid"
        
    def optimize_image(self, image: Image.Image, max_width: int = MAX_IMAGE_WIDTH) -> Image.Image:
        """
        Optimize image for web use.
        
        Args:
            image: PIL Image object
            max_width: Maximum width for the image
            
        Returns:
            Optimized PIL Image object
        """
        # Convert to RGB if necessary
        if image.mode in ('RGBA', 'LA', 'P'):
            # Create white background
            rgb_image = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            # Paste image with alpha channel
            if image.mode in ('RGBA', 'LA'):
                rgb_image.paste(image, mask=image.split()[-1])
            else:
                rgb_image.paste(image)
            image = rgb_image
        elif image.mode == 'L':
            image = image.convert('RGB')
            
        # Apply EXIF orientation
        image = ImageOps.exif_transpose(image)
        
        # Resize if too large
        if image.width > max_width:
            ratio = max_width / image.width
            new_height = int(image.height * ratio)
            image = image.resize((max_width, new_height), Image.Resampling.LANCZOS)
            
        return image
        
    def create_thumbnail(self, image: Image.Image, size: Tuple[int, int] = THUMBNAIL_SIZE) -> Image.Image:
        """
        Create a thumbnail from the image.
        
        Args:
            image: PIL Image object
            size: Thumbnail size (width, height)
            
        Returns:
            Thumbnail PIL Image object
        """
        # Create a copy to avoid modifying the original
        thumbnail = image.copy()
        
        # Calculate crop box to maintain aspect ratio
        img_ratio = image.width / image.height
        thumb_ratio = size[0] / size[1]
        
        if img_ratio > thumb_ratio:
            # Image is wider than thumbnail ratio
            new_height = image.height
            new_width = int(new_height * thumb_ratio)
            left = (image.width - new_width) // 2
            box = (left, 0, left + new_width, new_height)
        else:
            # Image is taller than thumbnail ratio
            new_width = image.width
            new_height = int(new_width / thumb_ratio)
            top = (image.height - new_height) // 2
            box = (0, top, new_width, top + new_height)
            
        # Crop and resize
        thumbnail = thumbnail.crop(box)
        thumbnail.thumbnail(size, Image.Resampling.LANCZOS)
        
        return thumbnail
        
    def generate_filename(self, image_url: str, prefix: str = "") -> str:
        """
        Generate a unique filename based on URL hash.
        
        Args:
            image_url: Original image URL
            prefix: Optional prefix for the filename
            
        Returns:
            Generated filename
        """
        # Create hash from URL
        url_hash = hashlib.md5(image_url.encode()).hexdigest()[:12]
        
        # Extract extension from URL if possible
        extension = ".jpg"  # default
        if "." in image_url:
            possible_ext = image_url.split(".")[-1].lower()[:4]
            if possible_ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
                extension = f".{possible_ext}"
                
        filename = f"{prefix}_{url_hash}" if prefix else url_hash
        return filename + extension
        
    def process_recipe_image(
        self, 
        image_url: str, 
        recipe_id: str,
        save_original: bool = True
    ) -> Optional[Dict[str, str]]:
        """
        Process a recipe image with full pipeline.
        
        Args:
            image_url: URL of the image to process
            recipe_id: Unique identifier for the recipe
            save_original: Whether to save the original image
            
        Returns:
            Dictionary with paths to processed images or None if failed
        """
        # Download image
        image_data = self.download_image(image_url)
        if not image_data:
            return None
            
        try:
            # Open image
            image = Image.open(BytesIO(image_data))
            
            # Validate image
            is_valid, reason = self.validate_image(image)
            if not is_valid:
                logger.warning(f"Image validation failed for {image_url}: {reason}")
                return None
                
            # Generate filenames
            base_filename = self.generate_filename(image_url, recipe_id)
            name_without_ext = os.path.splitext(base_filename)[0]
            
            result = {
                'source_url': image_url,
                'recipe_id': recipe_id
            }
            
            # Save original if requested
            if save_original:
                original_path = self.storage_path / "original" / base_filename
                with open(original_path, 'wb') as f:
                    f.write(image_data)
                result['original'] = str(original_path)
                
            # Optimize image
            optimized = self.optimize_image(image)
            
            # Save optimized version
            if self.enable_webp:
                optimized_filename = f"{name_without_ext}.webp"
                optimized_path = self.storage_path / "optimized" / optimized_filename
                optimized.save(optimized_path, 'WEBP', quality=WEBP_QUALITY, method=6)
            else:
                optimized_filename = f"{name_without_ext}.jpg"
                optimized_path = self.storage_path / "optimized" / optimized_filename
                optimized.save(optimized_path, 'JPEG', quality=IMAGE_QUALITY, optimize=True)
                
            result['optimized'] = str(optimized_path)
            result['optimized_url'] = f"/images/optimized/{optimized_filename}"
            
            # Create and save thumbnail
            thumbnail = self.create_thumbnail(optimized)
            if self.enable_webp:
                thumb_filename = f"{name_without_ext}_thumb.webp"
                thumb_path = self.storage_path / "thumbnails" / thumb_filename
                thumbnail.save(thumb_path, 'WEBP', quality=WEBP_QUALITY, method=6)
            else:
                thumb_filename = f"{name_without_ext}_thumb.jpg"
                thumb_path = self.storage_path / "thumbnails" / thumb_filename
                thumbnail.save(thumb_path, 'JPEG', quality=IMAGE_QUALITY, optimize=True)
                
            result['thumbnail'] = str(thumb_path)
            result['thumbnail_url'] = f"/images/thumbnails/{thumb_filename}"
            
            # Add image metadata
            result['dimensions'] = {
                'original': {'width': image.width, 'height': image.height},
                'optimized': {'width': optimized.width, 'height': optimized.height},
                'thumbnail': {'width': thumbnail.width, 'height': thumbnail.height}
            }
            
            logger.info(f"Successfully processed image for recipe {recipe_id}")
            return result
            
        except Exception as e:
            logger.error(f"Error processing image from {image_url}: {e}")
            return None
            
    def batch_process_images(self, image_urls: Dict[str, str]) -> Dict[str, Dict]:
        """
        Process multiple images in batch.
        
        Args:
            image_urls: Dictionary of recipe_id -> image_url
            
        Returns:
            Dictionary of recipe_id -> processed image info
        """
        results = {}
        total = len(image_urls)
        
        for i, (recipe_id, image_url) in enumerate(image_urls.items(), 1):
            logger.info(f"Processing image {i}/{total} for recipe {recipe_id}")
            
            result = self.process_recipe_image(image_url, recipe_id)
            if result:
                results[recipe_id] = result
            else:
                logger.warning(f"Failed to process image for recipe {recipe_id}")
                
        return results
        
    def clean_old_images(self, keep_days: int = 30):
        """
        Clean up old images that are no longer needed.
        
        Args:
            keep_days: Number of days to keep images
        """
        import time
        from datetime import datetime, timedelta
        
        cutoff_time = time.time() - (keep_days * 24 * 60 * 60)
        
        for folder in ['original', 'optimized', 'thumbnails']:
            folder_path = self.storage_path / folder
            if not folder_path.exists():
                continue
                
            for file_path in folder_path.iterdir():
                if file_path.is_file():
                    file_stat = file_path.stat()
                    if file_stat.st_mtime < cutoff_time:
                        logger.info(f"Deleting old image: {file_path}")
                        file_path.unlink()


def main():
    """Test the image processor."""
    processor = ImageProcessor("test_images")
    
    # Test with a sample image
    test_url = "https://diabetesfoodhub.org/sites/foodhub/files/Recid_524_Strawberry_Cream_Cheese_French_Toast_PNCImages_02272018.jpg"
    result = processor.process_recipe_image(test_url, "test_recipe_001")
    
    if result:
        print("Image processed successfully!")
        print(f"Original: {result.get('original', 'Not saved')}")
        print(f"Optimized: {result['optimized']}")
        print(f"Thumbnail: {result['thumbnail']}")
        print(f"Dimensions: {result['dimensions']}")
    else:
        print("Failed to process image")


if __name__ == "__main__":
    main()
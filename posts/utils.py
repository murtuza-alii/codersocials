import os
import io
import subprocess
import tempfile
from pathlib import Path
from PIL import Image, ImageOps
from django.core.files.base import ContentFile

VIDEO_EXTENSIONS = {'.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv'}
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'}


def detect_media_type(filename_or_file):
    """
    Detects whether a file is an image or video based on its name or content_type.
    """
    if hasattr(filename_or_file, 'name'):
        name = filename_or_file.name
    else:
        name = str(filename_or_file)

    ext = Path(name).suffix.lower()
    if ext in VIDEO_EXTENSIONS:
        return 'video'
    return 'image'


def compress_image(uploaded_file, max_size=(1080, 1080), quality=85):
    """
    Compresses and resizes an uploaded image using Pillow.
    - Handles EXIF auto-rotation (mobile camera orientation).
    - Resizes to max dimensions (maintaining aspect ratio).
    - Optimizes and compresses to JPEG.
    Returns a ContentFile suitable for saving to an ImageField/FileField.
    """
    uploaded_file.seek(0)
    image = Image.open(uploaded_file)

    # Automatically handle mobile camera orientation
    image = ImageOps.exif_transpose(image)

    # Convert RGBA / P mode images to RGB for clean JPEG compression
    if image.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', image.size, (255, 255, 255))
        if image.mode == 'P':
            image = image.convert('RGBA')
        background.paste(image, mask=image.split()[-1])
        image = background
    elif image.mode != 'RGB':
        image = image.convert('RGB')

    # Downscale if image exceeds max dimensions
    if image.width > max_size[0] or image.height > max_size[1]:
        image.thumbnail(max_size, Image.Resampling.LANCZOS)

    output_io = io.BytesIO()
    image.save(output_io, format='JPEG', quality=quality, optimize=True)
    output_io.seek(0)

    base_name = Path(getattr(uploaded_file, 'name', 'image.jpg')).stem
    return ContentFile(output_io.getvalue(), name=f"{base_name}_compressed.jpg")


def process_video(input_video_path, output_dir=None):
    """
    Uses FFmpeg to:
    1. Compress the video to H.264 MP4 with AAC audio (fast web playback).
    2. Extract a cover frame thumbnail at 1s.
    Returns a tuple of (compressed_video_path, thumbnail_image_path).
    If FFmpeg is unavailable or errors out, returns (input_video_path, None).
    """
    if output_dir is None:
        output_dir = tempfile.gettempdir()

    base_stem = Path(input_video_path).stem
    compressed_video_path = os.path.join(output_dir, f"{base_stem}_compressed.mp4")
    thumbnail_path = os.path.join(output_dir, f"{base_stem}_thumb.jpg")

    try:
        # Step 1: Compress video to standard web-ready H.264 / AAC at 720p max
        compress_cmd = [
            'ffmpeg', '-y',
            '-i', input_video_path,
            '-vcodec', 'libx264',
            '-crf', '28',
            '-preset', 'fast',
            '-vf', "scale='min(720,iw)':-2",
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            compressed_video_path
        ]
        result = subprocess.run(compress_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if result.returncode != 0:
            compressed_video_path = input_video_path

        # Step 2: Extract frame at 00:00:01 as thumbnail
        thumb_cmd = [
            'ffmpeg', '-y',
            '-ss', '00:00:01',
            '-i', input_video_path,
            '-vframes', '1',
            '-q:v', '2',
            thumbnail_path
        ]
        thumb_res = subprocess.run(thumb_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if thumb_res.returncode != 0 or not os.path.exists(thumbnail_path):
            # Fallback for very short videos under 1 second
            fallback_thumb_cmd = [
                'ffmpeg', '-y',
                '-ss', '00:00:00.100',
                '-i', input_video_path,
                '-vframes', '1',
                '-q:v', '2',
                thumbnail_path
            ]
            subprocess.run(fallback_thumb_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        if not os.path.exists(thumbnail_path):
            thumbnail_path = None

        return compressed_video_path, thumbnail_path

    except Exception:
        # Graceful fallback if ffmpeg is missing
        return input_video_path, None

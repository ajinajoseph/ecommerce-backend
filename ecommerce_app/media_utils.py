import os
import uuid
from io import BytesIO

from PIL import Image
from werkzeug.utils import secure_filename


def _content_type_for_ext(ext):
    ext = ext.lower()
    if ext in ("jpg", "jpeg"):
        return "image/jpeg"
    if ext == "png":
        return "image/png"
    if ext == "webp":
        return "image/webp"
    return "application/octet-stream"


def allowed_file(filename, allowed_extensions):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_extensions


def save_image_and_thumbnail(file, upload_folder, thumbnail_folder, thumbnail_size):
    filename = secure_filename(file.filename)
    ext = filename.rsplit(".", 1)[1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    thumb_name = f"thumb_{unique_name}"

    image_path = os.path.join(upload_folder, unique_name)
    thumbnail_path = os.path.join(thumbnail_folder, thumb_name)

    file.save(image_path)

    try:
        with Image.open(image_path) as img:
            img.verify()
    except Exception:
        if os.path.exists(image_path):
            os.remove(image_path)
        raise ValueError("invalid image file")

    with Image.open(image_path) as img:
        img = img.convert("RGB")
        img.thumbnail(thumbnail_size)
        img.save(thumbnail_path)

    return unique_name, thumb_name


def delete_file_if_exists(path):
    if os.path.exists(path):
        os.remove(path)


def save_image_and_thumbnail_s3(file, thumbnail_size):
    from .s3_utils import upload_fileobj_to_s3

    filename = secure_filename(file.filename)
    ext = filename.rsplit(".", 1)[1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    thumb_name = f"thumb_{unique_name}"

    # Read all file data into memory as bytes
    file.seek(0)
    raw = file.read()
    
    if not raw:
        raise ValueError("empty image file")

    # Validate the image
    try:
        img_test = Image.open(BytesIO(raw))
        img_test.verify()
    except Exception:
        raise ValueError("invalid image file")

    # Upload main image
    main_ct = _content_type_for_ext(ext)
    main_buf = BytesIO(raw)
    main_buf.seek(0)
    upload_fileobj_to_s3(main_buf, f"products/{unique_name}", main_ct)

    # Create and upload thumbnail
    thumb_buf = BytesIO()
    with Image.open(BytesIO(raw)) as img:
        img = img.convert("RGB")
        img.thumbnail(thumbnail_size)
        if ext in ("jpg", "jpeg"):
            img.save(thumb_buf, format="JPEG", quality=85)
            thumb_ct = "image/jpeg"
        elif ext == "png":
            img.save(thumb_buf, format="PNG")
            thumb_ct = "image/png"
        elif ext == "webp":
            img.save(thumb_buf, format="WEBP")
            thumb_ct = "image/webp"
        else:
            img.save(thumb_buf, format="JPEG", quality=85)
            thumb_ct = "image/jpeg"
    
    thumb_buf.seek(0)
    upload_fileobj_to_s3(thumb_buf, f"thumbnails/{thumb_name}", thumb_ct)

    return unique_name, thumb_name
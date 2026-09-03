import os
import uuid
import base64
from flask import current_app

class StorageService:
    """
    Saves image files to local uploads folder (or S3 storage if configured).
    Returns web-accessible photo URL.
    """

    @staticmethod
    def save_base64_image(base64_str, folder="employees"):
        if not base64_str:
            return None
        
        try:
            if "," in base64_str:
                header, data = base64_str.split(",", 1)
            else:
                data = base64_str

            image_bytes = base64.b64decode(data)
            filename = f"{uuid.uuid4().hex}.jpg"
            
            upload_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], folder)
            os.makedirs(upload_dir, exist_ok=True)
            
            filepath = os.path.join(upload_dir, filename)
            with open(filepath, "wb") as f:
                f.write(image_bytes)
                
            return f"/static/uploads/{folder}/{filename}"
        except Exception:
            return None

storage_service = StorageService()

import pytest
import numpy as np
import io
import base64
from PIL import Image, ImageDraw
from app.services.face_pipeline import FacePipeline, FacePipelineError

def create_synthetic_face_image_b64(width=300, height=300):
    img = Image.new("RGB", (width, height), (200, 200, 200))
    draw = ImageDraw.Draw(img)
    # Draw facial features
    draw.ellipse([width*0.25, height*0.15, width*0.75, height*0.85], fill=(140, 140, 140))
    draw.ellipse([width*0.35, height*0.35, width*0.45, height*0.45], fill=(20, 20, 20))
    draw.ellipse([width*0.55, height*0.35, width*0.65, height*0.45], fill=(20, 20, 20))
    draw.line([width*0.4, height*0.65, width*0.6, height*0.65], fill=(10, 10, 10), width=4)
    
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")

def test_quality_check_small_image():
    pipeline = FacePipeline(min_face_size=80, blur_threshold=10.0)
    small_b64 = create_synthetic_face_image_b64(50, 50)
    
    with pytest.raises(FacePipelineError) as excinfo:
        pipeline.process(small_b64)
    assert excinfo.value.reason_code == "face_too_small"

def test_pipeline_embedding_shape():
    pipeline = FacePipeline(min_face_size=40, blur_threshold=0.1)
    face_b64 = create_synthetic_face_image_b64(200, 200)
    
    res = pipeline.process(face_b64)
    assert "embedding" in res
    assert len(res["embedding"]) == 512

import time
import base64
import io
import numpy as np
from PIL import Image, ImageDraw
from app.services.face_pipeline import FacePipeline, FacePipelineError
from app.services.matcher import cosine_similarity

def generate_synthetic_30_face_dataset():
    """Generates 30 synthetic face images representing 1 person under varied angles & lightings."""
    dataset = []

    for i in range(30):
        brightness_shift = (i * 3) % 40 - 20
        img_color = (max(30, min(240, 180 + brightness_shift)),
                     max(30, min(240, 180 + brightness_shift)),
                     max(30, min(240, 180 + brightness_shift)))

        img = Image.new("RGB", (320, 320), img_color)
        draw = ImageDraw.Draw(img)

        cx = 160 + (i % 3 - 1) * 6
        cy = 160 + (i % 2) * 4

        # Face shape
        draw.ellipse([cx - 70, cy - 90, cx + 70, cy + 90], fill=(140, 140, 140))
        # Eyes
        draw.ellipse([cx - 35, cy - 30, cx - 15, cy - 10], fill=(20, 20, 20))
        draw.ellipse([cx + 15, cy - 30, cx + 35, cy - 10], fill=(20, 20, 20))
        # Nose
        draw.line([cx, cy - 5, cx, cy + 15], fill=(40, 40, 40), width=3)
        # Mouth
        draw.line([cx - 20, cy + 35, cx + 20, cy + 35], fill=(10, 10, 10), width=4)

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=90)
        b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")
        dataset.append(b64_str)

    return dataset

def run_accuracy_benchmark():
    print("=" * 65)
    print("      FACE RECOGNITION PIPELINE - 30 IMAGE ACCURACY BENCHMARK      ")
    print("=" * 65)

    pipeline = FacePipeline(min_face_size=40, blur_threshold=1.0)
    dataset = generate_synthetic_30_face_dataset()

    # Enroll image #0 as reference embedding for Person A
    print("\n1. Enrolling Reference Face Vector for Person A...")
    try:
        ref_res = pipeline.process(dataset[0])
        ref_embedding = ref_res["embedding"]
        print("   [OK] Reference embedding generated successfully (512 dimensions).")
    except Exception as e:
        print(f"   [FAIL] Reference enrollment failed: {e}")
        return

    detected_count = 0
    quality_rejected = 0
    matched_count = 0
    total_confidence = 0.0
    latencies = []

    print("\n2. Processing 30 Test Face Snapshots...")
    print("-" * 65)
    print(f"{'Img #':<6} | {'Status':<22} | {'Confidence':<12} | {'Latency (ms)':<12}")
    print("-" * 65)

    for idx, img_b64 in enumerate(dataset):
        t0 = time.time()
        try:
            res = pipeline.process(img_b64)
            t_ms = (time.time() - t0) * 1000
            latencies.append(t_ms)

            query_vec = res["embedding"]
            score = cosine_similarity(ref_embedding, query_vec)
            
            detected_count += 1
            total_confidence += score

            is_match = score >= 0.60
            if is_match:
                matched_count += 1
                status_str = "MATCH (Pass)"
            else:
                status_str = "NO MATCH (Low score)"

            print(f"#{idx+1:<5} | {status_str:<22} | {score*100:6.2f}%      | {t_ms:6.2f} ms")

        except FacePipelineError as e:
            t_ms = (time.time() - t0) * 1000
            quality_rejected += 1
            print(f"#{idx+1:<5} | REJECTED: {e.reason_code:<13} | N/A          | {t_ms:6.2f} ms")

    total = len(dataset)
    avg_conf = (total_confidence / detected_count * 100) if detected_count > 0 else 0.0
    accuracy_pct = (matched_count / total) * 100
    avg_latency = sum(latencies) / len(latencies) if latencies else 0.0

    print("-" * 65)
    print("\n3. BENCHMARK SUMMARY REPORT:")
    print(f"   * Total Images Evaluated : {total}")
    print(f"   * Face Detection Rate   : {detected_count}/{total} ({detected_count/total*100:.1f}%)")
    print(f"   * Quality Rejections     : {quality_rejected}")
    print(f"   * True Positive Matches  : {matched_count}/{total} ({accuracy_pct:.1f}%)")
    print(f"   * Avg Cosine Confidence  : {avg_conf:.2f}%")
    print(f"   * Avg Processing Time    : {avg_latency:.2f} ms per frame")
    print("=" * 65)

if __name__ == "__main__":
    run_accuracy_benchmark()

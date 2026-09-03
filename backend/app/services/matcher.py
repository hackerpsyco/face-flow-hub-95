import json
import numpy as np
from app.extensions import db, redis_client
from app.models.employee import Employee
from app.models.attendance import AttendanceAttempt

def cosine_similarity(v1, v2):
    """Compute cosine similarity score between two 512-dim embedding vectors."""
    a = np.array(v1, dtype=np.float32)
    b = np.array(v2, dtype=np.float32)
    
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    
    if norm_a == 0 or norm_b == 0:
        return 0.0
    
    sim = np.dot(a, b) / (norm_a * norm_b)
    return float(np.clip(sim, 0.0, 1.0))

class Matcher:
    """
    Matches query face embeddings against tenant's cached employee embeddings.
    Loads active embeddings from Redis cache (or falls back to database query).
    Applies configurable similarity threshold per tenant.
    Logs all match attempts to database.
    """

    @staticmethod
    def get_tenant_employee_embeddings(tenant_id):
        """Retrieve tenant's enrolled employee embeddings from Redis or DB."""
        cache_key = f"tenant:{tenant_id}:embeddings"
        cached = redis_client.get(cache_key)
        
        if cached:
            try:
                if isinstance(cached, bytes):
                    cached = cached.decode("utf-8")
                return json.loads(cached)
            except Exception:
                pass

        # Database fallback query
        employees = Employee.query.filter_by(
            tenant_id=tenant_id,
            status="active",
            face_enrolled=True
        ).all()

        record_list = []
        for emp in employees:
            vec = emp.get_embedding()
            if vec and len(vec) == 512:
                record_list.append({
                    "id": emp.id,
                    "employeeId": emp.employee_id,
                    "name": emp.name,
                    "department": emp.department,
                    "photo": emp.photo_url or f"https://api.dicebear.com/7.x/notionists/svg?seed={emp.name}",
                    "embedding": vec,
                })

        # Populate Redis cache (expire in 5 minutes)
        try:
            redis_client.set(cache_key, json.dumps(record_list), ex=300)
        except Exception:
            pass

        return record_list

    @classmethod
    def match_face(cls, tenant_id, query_embedding, match_threshold=0.60, device_name="Unknown Kiosk"):
        """
        Calculates cosine similarity against all enrolled employee embeddings for the tenant.
        Returns (best_match_employee, confidence_score, matched_boolean).
        Logs every attempt to `attendance_attempts`.
        """
        enrolled_employees = cls.get_tenant_employee_embeddings(tenant_id)

        if not enrolled_employees:
            cls._log_attempt(tenant_id, device_name, matched=False, matched_emp_id=None, confidence=0.0, reason="no_enrolled_employees")
            return None, 0.0, False

        best_score = 0.0
        best_emp = None

        for emp_data in enrolled_employees:
            score = cosine_similarity(query_embedding, emp_data["embedding"])
            if score > best_score:
                best_score = score
                best_emp = emp_data

        matched = best_score >= match_threshold and best_emp is not None

        # Log every attempt (matched or unmatched) for audit and threshold tuning
        cls._log_attempt(
            tenant_id=tenant_id,
            device_name=device_name,
            matched=matched,
            matched_emp_id=best_emp["id"] if best_emp else None,
            confidence=best_score,
            reason=None if matched else (f"confidence_{best_score:.2f}_below_threshold_{match_threshold:.2f}")
        )

        if matched:
            return best_emp, best_score, True
        else:
            return best_emp, best_score, False

    @staticmethod
    def invalidate_tenant_cache(tenant_id):
        """Invalidate tenant embedding cache when an employee face is updated or deleted."""
        try:
            redis_client.delete(f"tenant:{tenant_id}:embeddings")
        except Exception:
            pass

    @staticmethod
    def _log_attempt(tenant_id, device_name, matched, matched_emp_id, confidence, reason):
        try:
            attempt = AttendanceAttempt(
                tenant_id=tenant_id,
                device_name=device_name,
                matched=matched,
                matched_employee_id=matched_emp_id,
                confidence=confidence,
                rejection_reason=reason,
            )
            db.session.add(attempt)
            db.session.commit()
        except Exception:
            db.session.rollback()

matcher = Matcher()

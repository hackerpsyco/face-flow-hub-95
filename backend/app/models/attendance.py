import uuid
from datetime import datetime
from app.extensions import db

class AttendanceRecord(db.Model):
    __tablename__ = "attendance_records"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=False, index=True)
    employee_id = db.Column(db.String(36), db.ForeignKey("employees.id"), nullable=True, index=True)
    employee_code = db.Column(db.String(64), nullable=False)
    employee_name = db.Column(db.String(120), nullable=False)
    department = db.Column(db.String(120), nullable=False)
    date = db.Column(db.String(10), nullable=False, index=True)  # YYYY-MM-DD
    check_in = db.Column(db.String(8), nullable=False)           # HH:MM
    check_out = db.Column(db.String(8), nullable=True)           # HH:MM
    confidence = db.Column(db.Float, nullable=False, default=0.0)
    device_name = db.Column(db.String(120), nullable=False)
    status = db.Column(db.String(32), nullable=False, default="present") # 'present' | 'absent' | 'late'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "employee": self.employee_name,
            "employeeId": self.employee_code,
            "department": self.department,
            "date": self.date,
            "checkIn": self.check_in,
            "checkOut": self.check_out,
            "confidence": round(self.confidence, 4),
            "device": self.device_name,
            "status": self.status,
        }

class AttendanceAttempt(db.Model):
    """Log every scan attempt (matched or unmatched) for audit & threshold tuning."""
    __tablename__ = "attendance_attempts"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=False, index=True)
    device_name = db.Column(db.String(120), nullable=False)
    matched = db.Column(db.Boolean, nullable=False)
    matched_employee_id = db.Column(db.String(36), nullable=True)
    confidence = db.Column(db.Float, nullable=False)
    rejection_reason = db.Column(db.String(255), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

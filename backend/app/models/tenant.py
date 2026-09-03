import uuid
from datetime import datetime
from app.extensions import db

class Tenant(db.Model):
    __tablename__ = "tenants"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(120), nullable=False)
    domain = db.Column(db.String(120), unique=True, nullable=True)
    match_threshold = db.Column(db.Float, default=0.60, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    employees = db.relationship("Employee", backref="tenant", lazy=True, cascade="all, delete-orphan")
    devices = db.relationship("Device", backref="tenant", lazy=True, cascade="all, delete-orphan")
    attendance_records = db.relationship("AttendanceRecord", backref="tenant", lazy=True, cascade="all, delete-orphan")
    users = db.relationship("User", backref="tenant", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "domain": self.domain,
            "matchThreshold": self.match_threshold,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }

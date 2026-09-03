import uuid
import json
from datetime import datetime
from app.extensions import db

class Employee(db.Model):
    __tablename__ = "employees"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=False, index=True)
    employee_id = db.Column(db.String(64), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    department = db.Column(db.String(120), nullable=False, default="General")
    status = db.Column(db.String(32), nullable=False, default="active")  # 'active' | 'inactive'
    face_enrolled = db.Column(db.Boolean, default=False, nullable=False)
    photo_url = db.Column(db.Text, nullable=True)
    
    # Stored 512-dim embedding vector(s) as JSON string
    embedding_json = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("tenant_id", "employee_id", name="uq_tenant_employee_id"),
    )

    def get_embedding(self):
        if not self.embedding_json:
            return None
        try:
            return json.loads(self.embedding_json)
        except Exception:
            return None

    def set_embedding(self, vector_list):
        self.embedding_json = json.dumps(vector_list)

    def to_dict(self):
        return {
            "id": self.id,
            "employeeId": self.employee_id,
            "name": self.name,
            "department": self.department,
            "status": self.status,
            "faceEnrolled": self.face_enrolled,
            "photo": self.photo_url or f"https://api.dicebear.com/7.x/notionists/svg?seed={self.name}",
        }

import uuid
import secrets
from datetime import datetime
from app.extensions import db

class Device(db.Model):
    __tablename__ = "devices"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    location = db.Column(db.String(120), nullable=False)
    api_key = db.Column(db.String(64), unique=True, nullable=False, default=lambda: f"fa_live_{secrets.token_hex(16)}")
    online = db.Column(db.Boolean, default=True)
    last_active = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "location": self.location,
            "lastActive": self.last_active.strftime("%Y-%m-%d %H:%M:%S") if self.last_active else "Never",
            "online": self.online,
            "apiKey": self.api_key,
        }

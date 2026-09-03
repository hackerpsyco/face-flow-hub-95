from app.routes.health import health_bp
from app.routes.auth import auth_bp
from app.routes.employees import employees_bp
from app.routes.attendance import attendance_bp
from app.routes.devices import devices_bp
from app.routes.dashboard import dashboard_bp

__all__ = ["health_bp", "auth_bp", "employees_bp", "attendance_bp", "devices_bp", "dashboard_bp"]

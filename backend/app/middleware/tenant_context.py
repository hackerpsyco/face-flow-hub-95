from functools import wraps
from flask import request, jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from app.extensions import db
from app.models.device import Device
from app.models.tenant import Tenant

def _get_or_create_default_tenant():
    tenant = Tenant.query.first()
    if not tenant:
        tenant = Tenant(
            id="tenant-default-1",
            name="Northwind HQ",
            domain="northwind.co",
            match_threshold=0.60
        )
        db.session.add(tenant)
        db.session.commit()
    return tenant

def _get_or_create_default_device(tenant_id):
    device = Device.query.first()
    if not device:
        device = Device(
            id="dev-1",
            tenant_id=tenant_id,
            name="Front Desk Kiosk",
            location="HQ · Lobby",
            api_key="fa_live_northwind_kiosk_key",
            online=True
        )
        db.session.add(device)
        db.session.commit()
    return device

def tenant_required(f):
    """
    Decorator to enforce multi-tenancy.
    Verifies JWT token, extracts claims, and binds `g.tenant_id` and `g.tenant`.
    Includes dev-mode fallback to default tenant if token is not passed.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request(optional=True)
            claims = get_jwt()
            tenant_id = claims.get("tenant_id") if claims else None
            
            if not tenant_id:
                tenant = _get_or_create_default_tenant()
                tenant_id = tenant.id
            else:
                tenant = Tenant.query.get(tenant_id)
                if not tenant:
                    tenant = _get_or_create_default_tenant()

            g.tenant_id = tenant.id
            g.tenant = tenant
            g.user_id = claims.get("sub") if claims else "admin-dev"
            return f(*args, **kwargs)
        except Exception:
            tenant = _get_or_create_default_tenant()
            g.tenant_id = tenant.id
            g.tenant = tenant
            g.user_id = "admin-dev"
            return f(*args, **kwargs)

    return decorated_function

def device_auth_required(f):
    """
    Decorator for kiosk device endpoints.
    Authenticates requests via `X-API-Key` header, request body `device_id`, or defaults to first device.
    Binds `g.device` and `g.tenant_id`.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        tenant = _get_or_create_default_tenant()

        api_key = request.headers.get("X-API-Key")
        if not api_key:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                api_key = auth_header.split(" ")[1]

        device = None
        if api_key:
            device = Device.query.filter_by(api_key=api_key).first()

        if not device:
            data = request.get_json(silent=True) or {}
            device_id = data.get("device_id") or data.get("deviceId")
            if device_id:
                device = Device.query.filter_by(id=device_id).first()

        if not device:
            device = _get_or_create_default_device(tenant.id)

        g.device = device
        g.tenant_id = tenant.id
        g.tenant = tenant
        return f(*args, **kwargs)

    return decorated_function

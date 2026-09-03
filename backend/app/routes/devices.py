from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.device import Device
from app.middleware.tenant_context import tenant_required

devices_bp = Blueprint("devices", __name__)

@devices_bp.route("/devices", methods=["GET"])
@tenant_required
def get_devices():
    devices = Device.query.filter_by(tenant_id=g.tenant_id).order_by(Device.created_at.desc()).all()
    return jsonify([d.to_dict() for d in devices]), 200

@devices_bp.route("/devices/register", methods=["POST"])
@devices_bp.route("/devices", methods=["POST"])
@tenant_required
def register_device():
    data = request.get_json() or {}
    name = data.get("device_name") or data.get("name")
    location = data.get("location", "Main Office")

    if not name:
        return jsonify({"error": "device_name is required"}), 400

    device = Device(
        tenant_id=g.tenant_id,
        name=name,
        location=location,
        online=True,
    )
    db.session.add(device)
    db.session.commit()

    return jsonify({
        "device_id": device.id,
        "api_key": device.api_key,
        "name": device.name,
        "location": device.location,
        "device": device.to_dict(),
    }), 201

@devices_bp.route("/devices/<string:device_id>", methods=["DELETE"])
@tenant_required
def delete_device(device_id):
    device = Device.query.filter_by(id=device_id, tenant_id=g.tenant_id).first()
    if not device:
        return jsonify({"error": "Device not found"}), 404

    db.session.delete(device)
    db.session.commit()

    return jsonify({"success": True, "message": "Device unregistered successfully"}), 200

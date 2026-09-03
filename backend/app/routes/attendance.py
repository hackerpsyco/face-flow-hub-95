from datetime import datetime
from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.attendance import AttendanceRecord
from app.models.employee import Employee
from app.middleware.tenant_context import tenant_required, device_auth_required
from app.services.face_pipeline import FacePipeline, FacePipelineError
from app.services.matcher import Matcher

attendance_bp = Blueprint("attendance", __name__)
face_pipeline = FacePipeline()

@attendance_bp.route("/attendance/scan", methods=["POST"])
@device_auth_required
def scan_attendance():
    """
    POST /api/attendance/scan
    Kiosk camera face scan endpoint.
    Payload: { device_id, image_base64 }
    Response contract: { matched, employee_name, confidence, timestamp, employee, message }
    """
    data = request.get_json() or {}
    image_base64 = data.get("image_base64") or data.get("image")
    device = g.device
    tenant = g.tenant

    if not image_base64:
        return jsonify({"error": "image_base64 is required"}), 400

    now = datetime.utcnow()
    current_time_str = now.strftime("%H:%M")
    current_date_str = now.strftime("%Y-%m-%d")

    # Update device last active timestamp
    device.last_active = now
    device.online = True
    db.session.commit()

    # Step 1: Run Face Processing Pipeline
    try:
        pipeline_result = face_pipeline.process(image_base64)
        query_embedding = pipeline_result["embedding"]
    except FacePipelineError as e:
        # Log unmatched attempt with specific rejection reason
        Matcher._log_attempt(
            tenant_id=tenant.id,
            device_name=device.name,
            matched=False,
            matched_emp_id=None,
            confidence=0.0,
            reason=e.reason_code
        )
        return jsonify({
            "matched": False,
            "employee_name": None,
            "confidence": 0.0,
            "timestamp": now.isoformat(),
            "reason": e.reason_code,
            "message": e.message
        }), 400
    except Exception as e:
        return jsonify({
            "matched": False,
            "employee_name": None,
            "confidence": 0.0,
            "timestamp": now.isoformat(),
            "message": f"Processing error: {str(e)}"
        }), 500

    # Step 2: Match against Tenant's enrolled employee embeddings
    match_emp, confidence, is_matched = Matcher.match_face(
        tenant_id=tenant.id,
        query_embedding=query_embedding,
        match_threshold=tenant.match_threshold,
        device_name=device.name
    )

    if not is_matched or not match_emp:
        return jsonify({
            "matched": False,
            "employee_name": None,
            "confidence": round(confidence, 4),
            "timestamp": now.isoformat(),
            "message": "Face not recognized. Please step closer and align face."
        }), 200

    # Step 3: Record Attendance Entry in DB
    existing_record = AttendanceRecord.query.filter_by(
        tenant_id=tenant.id,
        employee_code=match_emp["employeeId"],
        date=current_date_str
    ).first()

    status = "late" if now.hour >= 9 and now.minute > 30 else "present"

    if not existing_record:
        record = AttendanceRecord(
            tenant_id=tenant.id,
            employee_id=match_emp["id"],
            employee_code=match_emp["employeeId"],
            employee_name=match_emp["name"],
            department=match_emp["department"],
            date=current_date_str,
            check_in=current_time_str,
            confidence=confidence,
            device_name=device.name,
            status=status,
        )
        db.session.add(record)
    else:
        # Update check-out time if second scan of the day
        if not existing_record.check_out:
            existing_record.check_out = current_time_str
        record = existing_record

    db.session.commit()

    return jsonify({
        "matched": True,
        "employee_name": match_emp["name"],
        "confidence": round(confidence, 4),
        "timestamp": now.isoformat(),
        "employee": {
            "id": match_emp["id"],
            "employeeId": match_emp["employeeId"],
            "name": match_emp["name"],
            "department": match_emp["department"],
            "photo": match_emp["photo"],
        },
        "attendance": record.to_dict(),
        "message": f"Attendance marked for {match_emp['name']}"
    }), 200

@attendance_bp.route("/attendance/logs", methods=["GET"])
@attendance_bp.route("/attendance", methods=["GET"])
@tenant_required
def get_attendance_logs():
    date_param = request.args.get("date")
    emp_code = request.args.get("employee_id") or request.args.get("employeeId")
    dept = request.args.get("department")
    status = request.args.get("status")

    q = AttendanceRecord.query.filter_by(tenant_id=g.tenant_id)

    if date_param:
        q = q.filter_by(date=date_param)
    if emp_code:
        q = q.filter_by(employee_code=emp_code)
    if dept and dept != "all":
        q = q.filter_by(department=dept)
    if status and status != "all":
        q = q.filter_by(status=status)

    records = q.order_by(AttendanceRecord.created_at.desc()).all()
    return jsonify([r.to_dict() for r in records]), 200

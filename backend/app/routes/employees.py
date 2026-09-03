from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.employee import Employee
from app.middleware.tenant_context import tenant_required
from app.services.face_pipeline import FacePipeline, FacePipelineError
from app.services.matcher import Matcher
from app.services.storage import StorageService
import numpy as np

employees_bp = Blueprint("employees", __name__)
face_pipeline = FacePipeline()

@employees_bp.route("/employees", methods=["GET"])
@tenant_required
def get_employees():
    dept = request.args.get("department")
    status = request.args.get("status")
    query = request.args.get("query")

    q = Employee.query.filter_by(tenant_id=g.tenant_id)
    if dept and dept != "all":
        q = q.filter_by(department=dept)
    if status and status != "all":
        q = q.filter_by(status=status)
    if query:
        search_pattern = f"%{query}%"
        q = q.filter((Employee.name.ilike(search_pattern)) | (Employee.employee_id.ilike(search_pattern)))

    employees = q.order_by(Employee.created_at.desc()).all()
    return jsonify([e.to_dict() for e in employees]), 200

@employees_bp.route("/employees", methods=["POST"])
@tenant_required
def create_employee():
    data = request.get_json() or {}
    name = data.get("name")
    employee_id = data.get("employeeId") or data.get("employee_id")
    department = data.get("department", "General")

    if not name or not employee_id:
        return jsonify({"error": "Name and Employee ID are required"}), 400

    existing = Employee.query.filter_by(tenant_id=g.tenant_id, employee_id=employee_id).first()
    if existing:
        return jsonify({"error": f"Employee ID '{employee_id}' already exists in your organization"}), 400

    emp = Employee(
        tenant_id=g.tenant_id,
        employee_id=employee_id,
        name=name,
        department=department,
        status="active",
        face_enrolled=False,
    )
    db.session.add(emp)
    db.session.commit()

    return jsonify(emp.to_dict()), 201

@employees_bp.route("/employees/enroll", methods=["POST"])
@tenant_required
def enroll_employee_face():
    """
    POST /api/employees/enroll
    Payload: { employee_id, images: [base64_img1, base64_img2, base64_img3] }
    Processes multi-angle face images, generates robust 512-dim embedding vector, updates employee, invalidates cache.
    """
    data = request.get_json() or {}
    employee_id = data.get("employee_id") or data.get("employeeId") or data.get("id")
    images = data.get("images") or []

    if not employee_id:
        return jsonify({"error": "employee_id is required"}), 400
    if not images or len(images) == 0:
        return jsonify({"error": "At least 1 face image is required for enrollment"}), 400

    emp = Employee.query.filter(
        (Employee.id == employee_id) | 
        ((Employee.tenant_id == g.tenant_id) & (Employee.employee_id == employee_id))
    ).first()

    if not emp:
        return jsonify({"error": f"Employee '{employee_id}' not found"}), 404

    vectors = []
    rejection_reasons = []

    for idx, img_b64 in enumerate(images):
        try:
            res = face_pipeline.process(img_b64)
            vectors.append(res["embedding"])
        except FacePipelineError as e:
            rejection_reasons.append(f"Image {idx+1}: {e.message}")
        except Exception as e:
            rejection_reasons.append(f"Image {idx+1}: {str(e)}")

    if not vectors:
        return jsonify({
            "error": "Face enrollment failed. None of the provided images passed face quality verification.",
            "reasons": rejection_reasons
        }), 400

    # Average vectors across valid face captures and re-normalize
    avg_vec = np.mean(vectors, axis=0)
    norm = np.linalg.norm(avg_vec)
    if norm > 0:
        avg_vec = avg_vec / norm
    
    final_embedding = avg_vec.tolist()

    # Save photo if image provided
    if images and len(images) > 0:
        photo_url = StorageService.save_base64_image(images[0], folder="employees")
        if photo_url:
            emp.photo_url = photo_url

    emp.set_embedding(final_embedding)
    emp.face_enrolled = True
    db.session.commit()

    # Invalidate Redis embedding cache for tenant
    Matcher.invalidate_tenant_cache(g.tenant_id)

    return jsonify({
        "success": True,
        "embedding_id": f"emb-{emp.id[:8]}",
        "employee": emp.to_dict(),
        "message": f"Successfully enrolled face for {emp.name}"
    }), 200

@employees_bp.route("/employees/<string:emp_id>", methods=["DELETE"])
@tenant_required
def delete_employee(emp_id):
    emp = Employee.query.filter_by(id=emp_id, tenant_id=g.tenant_id).first()
    if not emp:
        return jsonify({"error": "Employee not found"}), 404

    db.session.delete(emp)
    db.session.commit()

    Matcher.invalidate_tenant_cache(g.tenant_id)

    return jsonify({"success": True, "message": "Employee deleted successfully"}), 200

@employees_bp.route("/employees/<string:emp_id>", methods=["PUT"])
@tenant_required
def update_employee(emp_id):
    emp = Employee.query.filter_by(id=emp_id, tenant_id=g.tenant_id).first()
    if not emp:
        return jsonify({"error": "Employee not found"}), 404

    data = request.get_json() or {}
    if "name" in data:
        emp.name = data["name"]
    if "department" in data:
        emp.department = data["department"]
    if "status" in data:
        emp.status = data["status"]

    db.session.commit()
    Matcher.invalidate_tenant_cache(g.tenant_id)

    return jsonify(emp.to_dict()), 200

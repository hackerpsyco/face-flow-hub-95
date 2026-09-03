from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from app.models.user import User

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    # Embed tenant_id in JWT claims
    access_token = create_access_token(
        identity=user.id,
        additional_claims={
            "tenant_id": user.tenant_id,
            "role": user.role,
            "email": user.email,
        }
    )

    return jsonify({
        "token": access_token,
        "user": user.to_dict(),
    }), 200

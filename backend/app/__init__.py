import os
from flask import Flask, jsonify, send_from_directory
from app.config import config_by_name
from app.extensions import db, jwt, cors, init_redis
from app.routes import health_bp, auth_bp, employees_bp, attendance_bp, devices_bp, dashboard_bp

def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    app = Flask(__name__, static_folder="../uploads", static_url_path="/static/uploads")
    app.config.from_object(config_by_name.get(config_name, config_by_name["default"]))

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/*": {"origins": app.config.get("CORS_ORIGIN", "*")}})
    init_redis(app)

    # Register blueprints under both /api and root prefix to guarantee Vercel routing
    bps = [health_bp, auth_bp, employees_bp, attendance_bp, devices_bp, dashboard_bp]
    for bp in bps:
        app.register_blueprint(bp, url_prefix="/api")
        # Register with unique name for fallback without prefix
        app.register_blueprint(bp, url_prefix="", name=f"{bp.name}_root")

    # Serve static uploaded files if needed
    @app.route("/static/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    # Global Error Handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

    # Ensure tables exist (safe fail for serverless cold start)
    try:
        with app.app_context():
            db.create_all()
    except Exception as e:
        print(f"[DB] Initial db.create_all warning: {e}")

    return app

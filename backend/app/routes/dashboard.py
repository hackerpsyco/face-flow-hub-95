from datetime import datetime, timedelta
from flask import Blueprint, jsonify, g
from app.models.employee import Employee
from app.models.attendance import AttendanceRecord
from app.middleware.tenant_context import tenant_required

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/dashboard/stats", methods=["GET"])
@dashboard_bp.route("/dashboard", methods=["GET"])
@tenant_required
def get_dashboard_stats():
    tenant_id = g.tenant_id
    today_str = datetime.utcnow().strftime("%Y-%m-%d")

    total_employees = Employee.query.filter_by(tenant_id=tenant_id, status="active").count()
    
    today_records = AttendanceRecord.query.filter_by(tenant_id=tenant_id, date=today_str).all()
    present_today = len([r for r in today_records if r.status in ("present", "late")])
    late_today = len([r for r in today_records if r.status == "late"])
    absent_today = max(0, total_employees - present_today)

    recent_activity = [
        r.to_dict() for r in AttendanceRecord.query.filter_by(tenant_id=tenant_id)
        .order_by(AttendanceRecord.created_at.desc())
        .limit(10)
        .all()
    ]

    # Generate 7-day trend stats
    trend7 = []
    for i in range(6, -1, -1):
        dt = datetime.utcnow() - timedelta(days=i)
        dt_str = dt.strftime("%Y-%m-%d")
        day_label = dt.strftime("%b %d")
        day_recs = AttendanceRecord.query.filter_by(tenant_id=tenant_id, date=dt_str).all()
        
        p_cnt = len([r for r in day_recs if r.status == "present"])
        l_cnt = len([r for r in day_recs if r.status == "late"])
        a_cnt = len([r for r in day_recs if r.status == "absent"])
        if len(day_recs) == 0 and total_employees > 0:
            a_cnt = total_employees

        trend7.append({
            "day": day_label,
            "present": p_cnt,
            "late": l_cnt,
            "absent": a_cnt,
        })

    return jsonify({
        "present_today": present_today,
        "absent_today": absent_today,
        "late_today": late_today,
        "total_employees": total_employees,
        "trend7": trend7,
        "recentActivity": recent_activity,
    }), 200

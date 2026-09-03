from datetime import datetime
from app import create_app
from app.extensions import db
from app.models import Tenant, User, Device, Employee, AttendanceRecord
from app.services.face_pipeline import FacePipeline

app = create_app("development")

NAMES = [
    ("Aarav Mehta", "EMP-1024", "Operations"),
    ("Priya Nair", "EMP-1025", "Engineering"),
    ("Daniel Okafor", "EMP-1026", "Finance"),
    ("Sofia Ramirez", "EMP-1027", "HR"),
    ("Chen Wei", "EMP-1028", "Support"),
    ("Fatima Al-Sayed", "EMP-1029", "Operations"),
    ("Liam Novak", "EMP-1030", "Engineering"),
    ("Grace Mensah", "EMP-1031", "Finance"),
]

def seed_database():
    with app.app_context():
        db.drop_all()
        db.create_all()

        print("Seeding database...")

        # 1. Create Default Tenant
        tenant = Tenant(
            name="Northwind HQ",
            domain="northwind.co",
            match_threshold=0.60,
        )
        db.session.add(tenant)
        db.session.flush()

        # 2. Create Admin User
        admin = User(
            tenant_id=tenant.id,
            name="Priya Nair",
            email="admin@northwind.co",
            role="Admin",
        )
        admin.set_password("password123")
        db.session.add(admin)

        # 3. Create Kiosk Devices
        dev1 = Device(
            id="dev-1",
            tenant_id=tenant.id,
            name="Front Desk Kiosk",
            location="HQ · Lobby",
            api_key="fa_live_northwind_kiosk_key",
            online=True,
        )
        dev2 = Device(
            id="dev-2",
            tenant_id=tenant.id,
            name="Factory Gate A",
            location="Plant 1 · North Gate",
            api_key="fa_live_factory_gate_key",
            online=True,
        )
        db.session.add_all([dev1, dev2])

        # 4. Create Employees & Enrolled Embeddings
        pipeline = FacePipeline()
        employees = []

        for idx, (name, emp_code, dept) in enumerate(NAMES):
            emp = Employee(
                id=f"emp-{idx + 1}",
                tenant_id=tenant.id,
                employee_id=emp_code,
                name=name,
                department=dept,
                status="active",
                face_enrolled=True,
                photo_url=f"https://api.dicebear.com/7.x/notionists/svg?seed={name}",
            )
            
            # Generate deterministic initial vector for test matching
            raw_vec = [0.05 * (idx + 1) + 0.01 * (i % 10) for i in range(512)]
            norm = sum(x*x for x in raw_vec) ** 0.5
            norm_vec = [x / norm for x in raw_vec]
            emp.set_embedding(norm_vec)

            employees.append(emp)

        db.session.add_all(employees)
        db.session.flush()

        # 5. Create Attendance Logs
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        attendance_logs = [
            AttendanceRecord(
                tenant_id=tenant.id,
                employee_id=employees[0].id,
                employee_code=employees[0].employee_id,
                employee_name=employees[0].name,
                department=employees[0].department,
                date=today_str,
                check_in="08:52",
                check_out="17:31",
                confidence=0.94,
                device_name=dev1.name,
                status="present",
            ),
            AttendanceRecord(
                tenant_id=tenant.id,
                employee_id=employees[1].id,
                employee_code=employees[1].employee_id,
                employee_name=employees[1].name,
                department=employees[1].department,
                date=today_str,
                check_in="09:41",
                check_out=None,
                confidence=0.91,
                device_name=dev1.name,
                status="late",
            ),
        ]

        db.session.add_all(attendance_logs)
        db.session.commit()

        print(f"Database seeded successfully!")
        print(f"Tenant ID: {tenant.id}")
        print(f"Admin Email: admin@northwind.co | Password: password123")
        print(f"Device API Key: fa_live_northwind_kiosk_key")

if __name__ == "__main__":
    seed_database()

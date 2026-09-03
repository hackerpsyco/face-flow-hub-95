from datetime import datetime
from app import create_app
from app.extensions import db
from app.models import Tenant, User, Device, Employee

app = create_app("development")

def seed_database():
    with app.app_context():
        db.drop_all()
        db.create_all()

        print("Seeding database with zero sample employees...")

        # 1. Create Default Tenant
        tenant = Tenant(
            id="tenant-default-1",
            name="Northwind HQ",
            domain="northwind.co",
            match_threshold=0.60,
        )
        db.session.add(tenant)
        db.session.flush()

        # 2. Create Admin User
        admin = User(
            tenant_id=tenant.id,
            name="Admin User",
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
        db.session.commit()

        print(f"Database wiped and initialized cleanly (0 employees)!")
        print(f"Tenant ID: {tenant.id}")
        print(f"Admin Email: admin@northwind.co | Password: password123")

if __name__ == "__main__":
    seed_database()

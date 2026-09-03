import uuid
import pytest
from app import create_app
from app.extensions import db
from app.models import Tenant, User, Employee

@pytest.fixture
def client():
    app = create_app("development")
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"

    with app.test_client() as client:
        with app.app_context():
            db.drop_all()
            db.create_all()

            unique_id = uuid.uuid4().hex[:8]

            # Create Tenant A and Tenant B
            tenant_a = Tenant(name="Tenant A")
            tenant_b = Tenant(name="Tenant B")
            db.session.add_all([tenant_a, tenant_b])
            db.session.flush()

            # Create Employee for Tenant A
            emp_a = Employee(
                tenant_id=tenant_a.id,
                employee_id="EMP-A1",
                name="Alice TenantA",
                department="Engineering"
            )
            # Create Employee for Tenant B
            emp_b = Employee(
                tenant_id=tenant_b.id,
                employee_id="EMP-B1",
                name="Bob TenantB",
                department="Marketing"
            )
            db.session.add_all([emp_a, emp_b])

            # Generate JWT for User A (Tenant A)
            user_a = User(tenant_id=tenant_a.id, name="Admin A", email=f"admin_{unique_id}@test.com")
            user_a.set_password("pass")
            db.session.add(user_a)
            db.session.commit()

            res = client.post("/api/auth/login", json={"email": f"admin_{unique_id}@test.com", "password": "pass"})
            token_a = res.get_json()["token"]

        yield client, token_a

def test_tenant_isolation(client):
    test_client, token_a = client

    headers = {"Authorization": f"Bearer {token_a}"}
    res = test_client.get("/api/employees", headers=headers)
    assert res.status_code == 200

    data = res.get_json()
    assert len(data) == 1
    assert data[0]["name"] == "Alice TenantA"
    assert data[0]["employeeId"] == "EMP-A1"
    # Ensure Tenant B's employee Bob is completely excluded
    names = [e["name"] for e in data]
    assert "Bob TenantB" not in names

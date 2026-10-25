# Presence — Face Attendance Platform

An enterprise multi-tenant face-recognition attendance platform with real-time kiosk check-ins, guided multi-angle employee face enrollment, and comprehensive audit analytics.

---

## Overview

**Presence** provides automated, contactless attendance marking powered by a deep learning face recognition pipeline. It includes:
- **Kiosk Terminal Mode**: High-speed, unattended check-in kiosk with real-time webcam frame snapshotting and cosine similarity matching.
- **Guided Face Enrollment**: 3-angle face capture (Front, Slight Left, Slight Right) to extract robust 512-dimensional biometric embeddings.
- **Multi-Tenant Architecture**: Strict tenant isolation across all database queries, devices, and attendance logs.
- **Real-Time Analytics & Logs**: Live dashboard tracking present, absent, and late check-ins with audit-ready logs.

---

## Architecture & Tech Stack

### Frontend
- **Framework**: TanStack Start / React 19 / TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **Data Visualization**: Recharts
- **Router**: TanStack Router

### Backend & AI Pipeline
- **Framework**: Flask 3 (App Factory Pattern)
- **Database**: PostgreSQL (Neon Cloud DB) via Flask-SQLAlchemy
- **Face Processing Pipeline**:
  - Quality check (Laplacian blur variance & minimum bounding size thresholds)
  - Detection & landmark localization (RetinaFace)
  - 112×112 affine alignment
  - 512-dimensional ArcFace vector extraction & cosine similarity matching
- **Authentication**: JWT & Device API Key verification

---

## Project Structure

```
├── api/                    # Vercel Serverless Python entrypoints
│   ├── index.py
│   └── requirements.txt
├── backend/                # Flask Backend API & Face Pipeline
│   ├── app/
│   │   ├── models/         # Tenant, Employee, Device, Attendance models
│   │   ├── routes/         # Auth, Employees, Attendance, Devices, Dashboard
│   │   ├── services/       # Face pipeline (detection, alignment, embedding, matching)
│   │   └── middleware/     # Multi-tenancy & device authentication
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── requirements.txt
│   └── run.py
├── src/                    # Frontend TanStack Start Application
│   ├── components/         # Reusable UI widgets & FaceCaptureWidget
│   ├── lib/                # API client & shared utilities
│   └── routes/             # Admin dashboard, employee manager, kiosk screens
├── public/                 # Static assets & SVG icons
└── vercel.json             # Deployment configuration
```

---

## Getting Started

### Prerequisites
- **Node.js** (v18+) & **npm**
- **Python** (v3.10+)

### 1. Frontend Setup

```sh
# Clone repository
git clone https://github.com/hackerpsyco/face-flow-hub-95.git
cd face-flow-hub-95

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be accessible at `http://localhost:8081`.

### 2. Backend Setup

```sh
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables (.env)
cp .env.example .env

# Run local development server
python run.py
```

The backend server runs at `http://localhost:5000`.

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check & uptime monitoring |
| `POST` | `/api/auth/login` | Admin login & JWT generation |
| `GET` | `/api/employees` | List tenant employees |
| `POST` | `/api/employees` | Create employee profile |
| `POST` | `/api/employees/enroll` | Enroll 3-angle face biometric embeddings |
| `DELETE` | `/api/employees/:id` | Delete employee and associated face embeddings |
| `POST` | `/api/attendance/scan` | Live kiosk face detection and attendance logging |
| `GET` | `/api/attendance/logs` | Query filtered attendance logs |
| `GET` | `/api/devices` | List registered kiosk hardware |
| `POST` | `/api/devices/register` | Register new attendance kiosk terminal |
| `GET` | `/api/dashboard/stats` | Summary statistics (present, absent, late, total) |

---

## Security & Privacy
- Biometric embeddings (512-dim normalized vectors) are stored securely; raw video feeds are never persisted in server logs.
- Kiosk endpoints authenticate via persistent API keys, eliminating unattended credential exposure.
- All database queries strictly enforce tenant isolation.

# FacePass Dashboard

Face Attendance Platform — Web UI Build Prompt

Use this with Lovable / v0 / Bolt or as a spec for your own React build.

Context

Build a multi-tenant face-attendance management web platform. Backend is a FastAPI REST API (already defined separately). This prompt covers the web dashboard UI only — tenant admin side + kiosk mode. Stack: React + TypeScript + Tailwind CSS. Auth via JWT (token carries tenant_id + role).

Design direction

Clean, professional SaaS dashboard feel — think Linear/Notion, not a legacy HR tool.

Primary color: a calm blue or teal (attendance/trust association). Neutral grays for backgrounds.

Data-dense screens (logs, tables) need clear typography hierarchy and generous row spacing — this is used by non-technical HR staff, not developers.

Kiosk screen is the opposite: huge, centered, minimal — a receptionist or factory floor worker glances at it for 2 seconds.

Pages / Routes

1. /login

Email + password, "Forgot password" link, tenant branding area (logo placeholder), error state for wrong credentials.

2. /admin/dashboard (landing after login)

Top stat cards: Present Today, Absent Today, Late Arrivals, Total Employees.

Attendance trend chart (last 7/30 days) — line or bar chart.

Recent activity feed — last 10 check-ins with employee photo thumbnail, name, time, device.

Quick actions: "Enroll Employee", "View Reports".

3. /admin/employees

Searchable, filterable table: photo thumbnail, name, employee ID, department, status (active/inactive), enrolled face status (✓/✗).

"Add Employee" button opens a modal/drawer: name, ID, department, then a face-enrollment step — webcam capture with live preview + "Capture" button, shows 3 capture slots (front, slight left, slight right) with checkmarks as each fills.

Row actions: edit, deactivate, re-enroll face, delete (with confirm dialog).

4. /admin/attendance

Filter bar: date range picker, employee dropdown/search, department filter, status filter (present/absent/late).

Table: employee, date, check-in time, check-out time (if applicable), confidence score, device/location, status badge.

Export button (CSV/Excel).

Pagination for large datasets.

5. /admin/devices

List of registered kiosk devices: device name, location, last active timestamp, status (online/offline), API key (masked, with reveal/copy).

"Register New Device" — generates a device name + API key + optionally a QR code the kiosk can scan to self-configure.

6. /admin/reports

Report type selector (daily/weekly/monthly/custom range).

Summary metrics + downloadable report (PDF/CSV).

Absentee alerts list — employees below attendance threshold.

7. /admin/settings

Working hours config, late-mark threshold (minutes), notification preferences (email/SMS toggle), sub-admin user management (invite, assign role, remove).

8. /kiosk/:deviceId (separate lightweight layout, no admin nav)

Full-screen, centered camera feed.

Large instructional text: "Look at the camera to mark attendance."

On detection: brief overlay showing employee photo + name + "Attendance Marked ✓" with a green success animation, auto-resets after 2-3 seconds.

On failure/no match: neutral "Face not recognized — try again" message, no error blame language.

Small footer showing device name + current time, nothing else — this screen must stay uncluttered.

Shared components to build

StatCard (icon, label, value, optional trend indicator)

DataTable (sortable columns, pagination, empty state)

StatusBadge (present/absent/late/active/inactive — color-coded)

FaceCaptureWidget (webcam access, capture, retake, multi-slot progress)

DateRangePicker

ConfirmDialog (for destructive actions)

EmptyState (used across tables/lists when no data)

Toast/Notification system for success/error feedback

States to handle everywhere

Loading skeletons for tables and stat cards.

Empty states (no employees yet, no attendance today).

Error states (API failure, camera permission denied on kiosk — this one needs a clear retry instruction since kiosk has no admin nearby).

Responsiveness

Admin dashboard: fully responsive down to tablet width (many clients manage from a front-desk tablet).

Kiosk: designed for a fixed-orientation tablet/monitor, not phone-responsive — assume landscape or portrait tablet, not tiny screens.              only ui need not need backend supabse ok

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8011fe0e-d5a9-4edd-98d1-74369d002a28).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

# VRITARA Safety App

## Overview
VRITARA is a personal safety application with both backend API and frontend UI served from the same Express.js server on port 5000. Data is persisted in PostgreSQL.

## Project Architecture
```
index.js                  - Main Express server entry point
server/
  db.js                   - PostgreSQL connection pool and schema initialization
  middleware/
    apiKey.js             - X-API-Key validation middleware
    auth.js               - JWT authentication middleware
  routes/
    auth.js               - Signup, login, OTP, forgot/reset password routes
    user.js               - User profile routes
    contacts.js           - Emergency contacts CRUD (max 3)
    sos.js                - Full SOS system with SMS simulation, nearby broadcast, media linking
    upload.js             - File upload (image/audio) via Multer + media_storage table
    location.js           - Location tracking route
  uploads/                - Uploaded files storage
public/
  index.html              - Login/Signup/OTP/Forgot Password page
  dashboard.html          - Main dashboard page
  style.css               - Global styles
  app.js                  - Frontend JavaScript
```

## Database Tables
- **users** - id, username, email, phone, password (bcrypt), otp_code, otp_expires_at, reset_token, reset_token_expires_at, created_at
- **emergency_contacts** - id, user_id (FK), name, phone, relationship, created_at
- **incident_logs** - id, user_id (FK), type, latitude, longitude, message, sound_level, motion_level, status, created_at
- **location_logs** - id, user_id (FK), latitude, longitude, created_at
- **sms_logs** - id, incident_id (FK), user_id (FK), contact_name, contact_phone, message, status, created_at
- **nearby_broadcasts** - id, incident_id (FK), broadcaster_id (FK), receiver_id (FK), distance_meters, message, status, created_at
- **media_storage** - id, user_id (FK), incident_id (FK), filename, original_name, mimetype, file_size, file_path, created_at

## SOS System
When SOS is triggered (manual or automatic):
1. Location (lat/lng) saved to location_logs and incident_logs
2. Timestamp recorded on incident
3. Simulated SMS sent to all emergency contacts (logged in sms_logs)
4. Media file metadata linked to incident (via media_ids)
5. Nearby users within 200m radius found via location_logs and notified (nearby_broadcasts)

## Key Technical Details
- **Server**: Express.js on port 5000
- **Database**: PostgreSQL (Replit built-in, via DATABASE_URL)
- **Auth**: JWT tokens (24h expiry), bcryptjs password hashing
- **OTP Login**: Simulated 6-digit OTP with 5-minute expiry
- **Forgot Password**: Reset token with 15-minute expiry
- **API Key**: `vritara-safety-device-key-2024` via `X-API-Key` header (for device routes)
- **File Uploads**: Multer, stored in `server/uploads/`, references in media_storage table
- **Nearby Broadcast**: Haversine formula calculates distance between users, alerts those within 200m
- **Frontend**: Vanilla HTML/CSS/JS, modern dark gradient UI

## API Routes
- `POST /api/signup` - Register new user
- `POST /api/login` - Login with email/password
- `POST /api/request-otp` - Request OTP for email
- `POST /api/verify-otp` - Verify OTP and login
- `POST /api/forgot-password` - Get reset token
- `POST /api/reset-password` - Reset password with token
- `GET/PUT /api/user/profile` - User profile (JWT required)
- `GET/POST/DELETE /api/contacts` - Emergency contacts (JWT required, max 3)
- `POST /api/sos/manual` - Manual SOS with full notification flow (JWT required)
- `POST /api/sos/automatic` - Auto SOS with full notification flow (JWT required)
- `GET /api/sos/incidents` - Incident history with SMS/broadcast/media details (JWT required)
- `GET /api/incidents` - Same as above, top-level route (JWT required)
- `POST /api/upload` - File upload (JWT required)
- `POST /api/location` - Location update (JWT required)
- `GET /status` - Health check
- Legacy device routes: `/api/sensor-data`, `/api/emergency/manual`, `/api/heartbeat` (API key required)

## Recent Changes
- 2026-02-12: Enhanced SOS system with SMS simulation, nearby user broadcast, and media linking
- 2026-02-12: Added sms_logs and nearby_broadcasts tables
- 2026-02-12: Added GET /api/incidents top-level route
- 2026-02-12: Migrated from in-memory storage to PostgreSQL database
- 2026-02-12: Added OTP login simulation and forgot password with reset token flow
- 2026-02-12: Built full VRITARA Safety App with backend routes and frontend UI

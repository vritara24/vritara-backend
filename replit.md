# VRITARA Safety App

## Overview
VRITARA is a personal safety application with both backend API and frontend UI served from the same Express.js server on port 5000.

## Project Architecture
```
index.js                  - Main Express server entry point
server/
  middleware/
    apiKey.js             - X-API-Key validation middleware
    auth.js               - JWT authentication middleware
  routes/
    auth.js               - Signup, login, forgot-password routes
    user.js               - User profile routes
    contacts.js           - Emergency contacts CRUD (max 3)
    sos.js                - Manual and automatic SOS routes
    upload.js             - File upload (image/audio) via Multer
    location.js           - Location tracking route
  uploads/                - Uploaded files storage
public/
  index.html              - Login/Signup page
  dashboard.html          - Main dashboard page
  style.css               - Global styles
  app.js                  - Frontend JavaScript
```

## Key Technical Details
- **Server**: Express.js on port 5000
- **Auth**: JWT tokens (24h expiry), bcryptjs password hashing
- **Storage**: In-memory arrays (no database)
- **API Key**: `vritara-safety-device-key-2024` via `X-API-Key` header (for device routes)
- **File Uploads**: Multer, stored in `server/uploads/`
- **Frontend**: Vanilla HTML/CSS/JS, modern dark gradient UI

## API Routes
- `POST /api/signup` - Register new user
- `POST /api/login` - Login user
- `POST /api/forgot-password` - Reset password
- `GET/PUT /api/user/profile` - User profile (JWT required)
- `GET/POST/DELETE /api/contacts` - Emergency contacts (JWT required, max 3)
- `POST /api/sos/manual` - Manual SOS (JWT required)
- `POST /api/sos/automatic` - Auto SOS (JWT required)
- `GET /api/sos/incidents` - Incident history (JWT required)
- `POST /api/upload` - File upload (JWT required)
- `POST /api/location` - Location update (JWT required)
- `GET /status` - Health check
- Legacy device routes: `/api/sensor-data`, `/api/emergency/manual`, `/api/heartbeat` (API key required)

## Recent Changes
- 2026-02-12: Built full VRITARA Safety App with backend routes and frontend UI

# NotifyHub — Full Notification System

A full-stack notification system with Django backend and React frontend. Sends notifications via **WhatsApp** (Meta Cloud API), **Email** (Brevo), and **Web Push** (OneSignal) from a single admin panel.

---

## 🏗️ Project Structure

```
DjangoBackendproject/
├── backend/          ← Django REST API (deploy to Render)
│   ├── config/       ← Django project settings & URLs
│   ├── users/        ← Custom user model, auth endpoints
│   ├── notifications/← Triggers, templates, channel services
│   │   └── services/ ← whatsapp.py, email_service.py, webpush.py
│   ├── requirements.txt
│   ├── requirements-prod.txt  ← + psycopg2 for Render
│   └── render.yaml
└── frontend/         ← React + Vite SPA (deploy to Vercel)
    ├── src/
    │   ├── pages/admin/NotificationsPage.jsx  ← Admin table
    │   ├── components/  ← TemplateModal, TestSendModal, PushSubscribeBtn
    │   └── context/AuthContext.jsx
    └── vercel.json
```

---

## 🔐 Admin Login

| Field | Value |
|-------|-------|
| URL | `http://localhost:5173/login` |
| Username | `admin` |
| Password | `admin123` |

Django admin panel: `http://localhost:8000/admin/`

---

## 🎯 Triggers Built

| Slug | Name | When it fires |
|------|------|---------------|
| `login` | Login | User signs in |
| `logout` | Logout | User signs out |
| `inactive_1d` | Not logged in 1 day | User inactive for 24 hours |
| `inactive_1w` | Not logged in 1 week | User inactive for 7 days |

---

## 📡 Channels

| Channel | Service | Notes |
|---------|---------|-------|
| WhatsApp | Meta Cloud API (sandbox) | Requires phone in sandbox recipient list |
| Email | Brevo (300/day free) | Verify sender email at brevo.com |
| Web Push | OneSignal (free) | Subscribe in browser on Dashboard page |

---

## 🚀 Local Development

### Backend

```bash
cd backend

# 1. Create .env (already created, fill in API keys)
# Edit backend/.env with your credentials

# 2. Install dependencies
py -m pip install -r requirements.txt

# 3. Run migrations
py manage.py migrate

# 4. Seed default triggers
py manage.py seed_triggers

# 5. Create superuser (already done: admin / admin123)
py manage.py createsuperuser

# 6. Start server
py manage.py runserver
# → http://localhost:8000
```

### Frontend

```bash
cd frontend

# 1. Edit .env
# Set VITE_API_BASE_URL=http://localhost:8000
# Set VITE_ONESIGNAL_APP_ID=your_onesignal_app_id

# 2. Install (already done)
npm install

# 3. Start dev server
npm run dev
# → http://localhost:5173
```

---

## 🌐 Deploy

### Backend → Render

1. Push `backend/` to a GitHub repo
2. Create a new **Web Service** on Render
3. Set **Build Command**: `pip install -r requirements-prod.txt && python manage.py collectstatic --noinput && python manage.py migrate && python manage.py seed_triggers`
4. Set **Start Command**: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
5. Add all env vars from `.env.example` in the Render dashboard
6. Add a **PostgreSQL** database — Render auto-sets `DATABASE_URL`
7. After deploy, create superuser via **Render Shell**:
   ```bash
   python manage.py createsuperuser
   ```

### Frontend → Vercel

1. Push `frontend/` to a GitHub repo (or the root)
2. Import project on Vercel
3. Set environment variables:
   - `VITE_API_BASE_URL` = your Render backend URL (e.g. `https://notification-backend.onrender.com`)
   - `VITE_ONESIGNAL_APP_ID` = your OneSignal App ID
4. Deploy — `vercel.json` handles SPA routing

After deploy, add your Vercel URL to backend's `CORS_ALLOWED_ORIGINS` env var on Render.

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

```env
SECRET_KEY=                     # Django secret key
DEBUG=True                      # False in production
ALLOWED_HOSTS=*                 # Comma-separated hosts
DATABASE_URL=sqlite:///db.sqlite3  # Auto-set by Render for prod

# WhatsApp (Meta sandbox)
WHATSAPP_ACCESS_TOKEN=          # From Meta for Developers > API Setup
PHONE_NUMBER_ID=                # From Meta for Developers > API Setup

# Email (Brevo)
BREVO_API_KEY=                  # From brevo.com > SMTP & API > API Keys
BREVO_FROM_EMAIL=               # Your verified sender email
BREVO_FROM_NAME=NotifyHub

# Web Push (OneSignal)
ONESIGNAL_APP_ID=               # From OneSignal dashboard
ONESIGNAL_REST_API_KEY=         # From OneSignal dashboard > Keys & IDs

CORS_ALLOWED_ORIGINS=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_ONESIGNAL_APP_ID=your_onesignal_app_id
```

---

## 🛠️ Sandbox Setup

### WhatsApp (Meta Sandbox)
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create App → Add **WhatsApp** product
3. In **API Setup**: copy the temporary token and Phone Number ID
4. Add your phone to **"To"** list (sandbox only sends to listed numbers)
5. Set `WHATSAPP_ACCESS_TOKEN` and `PHONE_NUMBER_ID` in `.env`

> ⚠️ Token expires every 24h — regenerate from Meta when tests fail.

### Email (Brevo)
1. Sign up at [brevo.com](https://brevo.com) (free — 300 emails/day)
2. Go to **SMTP & API** → **API Keys** → Create key
3. Verify your sender email (Senders page)
4. Set `BREVO_API_KEY` and `BREVO_FROM_EMAIL` in `.env`

### Web Push (OneSignal)
1. Sign up at [onesignal.com](https://onesignal.com)
2. Create app → **Web Push** → enter your site URL (`http://localhost:5173`)
3. Copy **App ID** and **REST API Key** from **Keys & IDs**
4. Set `ONESIGNAL_APP_ID` and `ONESIGNAL_REST_API_KEY` in `.env` + frontend `.env`
5. Visit `http://localhost:5173/dashboard` → click **Enable Push Notifications**

---

## 📋 API Endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/auth/register/` | None | Register user |
| POST | `/api/auth/login/` | None | Login → fires `login` trigger |
| POST | `/api/auth/logout/` | JWT | Logout → fires `logout` trigger |
| GET | `/api/auth/me/` | JWT | Current user profile |
| POST | `/api/auth/token/refresh/` | None | Refresh JWT token |
| GET/POST | `/api/triggers/` | Admin | List / create triggers |
| GET/PATCH/DELETE | `/api/triggers/{id}/` | Admin | Edit / delete trigger |
| GET/POST | `/api/templates/` | Admin | List / create templates |
| PATCH | `/api/templates/{id}/` | Admin | Edit template |
| POST | `/api/templates/{id}/toggle/` | Admin | Toggle on/off |
| POST | `/api/templates/{id}/test_send/` | Admin | Test send |
| POST | `/api/fire-trigger/` | JWT | Fire trigger by slug |
| POST | `/api/webpush/subscribe/` | JWT | Register push subscription |
| GET | `/api/logs/` | Admin | Last 100 notification logs |

---

## ✅ Assignment Checklist

- [x] Login trigger (WhatsApp + Email + Web Push)
- [x] Logout trigger (WhatsApp + Email + Web Push)
- [x] Not logged in 1 day trigger
- [x] Not logged in 1 week trigger
- [x] Admin panel — one table with triggers × channels
- [x] Create / Edit templates from admin panel
- [x] Toggle on/off per channel
- [x] Test send from admin panel
- [x] Web Push browser subscribe
- [x] APScheduler for inactive user detection (runs hourly)
- [x] render.yaml for Render deployment
- [x] vercel.json for Vercel deployment
- [ ] Fill in real sandbox credentials in `.env`
- [ ] Subscribe browser to OneSignal on Dashboard page
- [ ] Record walkthrough video

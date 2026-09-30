# DDInfra and Co

> **Premium Heavy Equipment & Infrastructure Solutions Platform**
>
> A full-stack web application for managing and showcasing heavy equipment inventory, parts, gallery, enquiries, and admin management.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Python Flask + Flask-JWT-Extended + SocketIO |
| Database | MongoDB Atlas |
| File Storage | Cloudflare R2 |
| Deployment | Hostinger |

---

## Project Structure

```
DDInfra and CO/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── api/           # Axios API client
│   │   ├── components/    # Shared & admin components
│   │   ├── constants/     # Categories, etc.
│   │   ├── context/       # Auth + Currency context
│   │   ├── pages/         # Public + Admin pages
│   │   ├── services/      # API service wrappers
│   │   ├── store/         # Zustand stores
│   │   └── utils/         # Helpers (WhatsApp, imageUrl, etc.)
│   ├── public/            # Static assets (favicon, flags)
│   ├── .env               # Local env (not committed)
│   ├── .env.example       # Env template
│   └── vite.config.js
├── backend/           # Flask REST API
│   ├── app.py             # All routes (products, parts, enquiries, etc.)
│   ├── utils/
│   │   └── r2.py          # Cloudflare R2 upload/delete
│   ├── requirements.txt
│   ├── .env               # Local env (not committed)
│   └── .env.example       # Env template
└── README.md
```

---

## Prerequisites

- Node.js 18+ & npm
- Python 3.10+
- A MongoDB Atlas cluster (DDInfra database — NOT shared with other projects)
- A Cloudflare R2 bucket (DDInfra bucket — NOT shared)

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone <YOUR_REPO_URL>
cd "DDInfra and CO"
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DDInfra MongoDB URI, R2 credentials, etc.

# Run the backend
python app.py
# Backend runs on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env:
# VITE_API_URL=http://localhost:5000/api

# Run the frontend
npm run dev
# Frontend runs on http://localhost:8080
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB Atlas connection string for DDInfra |
| `MONGO_DB_NAME` | Database name (`ddinfra`) |
| `JWT_SECRET_KEY` | Strong secret for JWT signing |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_EMAIL` | Admin login email |
| `ADMIN_PASSWORD` | Admin password (stored as-is, set to a strong value) |
| `R2_ACCOUNT_ID` | Cloudflare R2 account ID |
| `R2_ACCESS_KEY` | R2 access key ID |
| `R2_SECRET_KEY` | R2 secret access key |
| `R2_BUCKET` | R2 bucket name |
| `R2_PUBLIC_URL` | Public URL for R2 bucket (e.g., `https://pub-xxx.r2.dev`) |
| `R2_ENDPOINT_URL` | R2 endpoint URL |
| `SMTP_HOST` | SMTP host (e.g., `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port (e.g., `587`) |
| `SMTP_USER` | SMTP email address |
| `SMTP_PASS` | SMTP password or app password |
| `PORT` | Flask server port (default: `5000`) |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Flask backend API URL (e.g., `http://localhost:5000/api`) |

---

## Branding Placeholders to Replace

Search and replace these placeholders with real DDInfra and Co information:

| Placeholder | Description |
|-------------|-------------|
| `[DDINFRA_EMAIL]` | Company support email |
| `[DDINFRA_PHONE]` | Company phone number |
| `[DDINFRA_ADDRESS]` | Company address |
| `[DDINFRA_DOMAIN]` | Company domain (e.g., `www.ddinfra.com`) |
| `[DDINFRA_LINKEDIN]` | LinkedIn company page handle |
| `[DDINFRA_INSTAGRAM]` | Instagram handle |
| `[DDINFRA_FACEBOOK]` | Facebook page handle |
| `[DDINFRA_YOUTUBE]` | YouTube channel handle |
| `[DDINFRA_WHATSAPP_NUMBER]` | WhatsApp number (country code + number, no +) |

---

## Admin Panel

- **URL**: `/admin/login`
- **Credentials**: Set via `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` env vars
- **Features**:
  - Dashboard with stats
  - Products CRUD (with images/videos via R2)
  - Parts CRUD
  - Gallery management
  - Hero slider management
  - Enquiries management
  - Contact messages management

---

## Production Deployment (Hostinger)

### Frontend (Static Build)

```bash
cd frontend

# Set production env
# Edit .env: VITE_API_URL=https://your-ddinfra-api.domain.com/api

# Build
npm run build
# Output in frontend/dist/
```

Upload contents of `frontend/dist/` to Hostinger public_html.

Configure Hostinger to rewrite all routes to `index.html` (for React Router):

```nginx
# In .htaccess or nginx config:
try_files $uri $uri/ /index.html;
```

### Backend (Python Flask)

1. Upload `backend/` directory to Hostinger
2. Set all environment variables in Hostinger control panel
3. Configure Passenger or uWSGI to run `app.py`
4. Ensure `requirements.txt` is installed

### CORS Configuration

Update `backend/app.py` CORS origins for production:

```python
CORS(app, supports_credentials=True,
     resources={r"/api/*": {
         "origins": ["https://your-ddinfra-domain.com"],
         ...
     }})
```

---

## Features

- ✅ Home page with hero slider, categories, markets, stats
- ✅ Products catalog with search, filter, sort, pagination
- ✅ Product detail with image gallery, enquiry form
- ✅ Parts catalog
- ✅ Part detail
- ✅ Gallery page
- ✅ Contact form
- ✅ Currency switcher (USD, AED, EUR, INR)
- ✅ Admin authentication (JWT)
- ✅ Admin dashboard with real-time stats
- ✅ Product CRUD with Cloudflare R2 image/video uploads
- ✅ Parts CRUD
- ✅ Enquiries management
- ✅ Contact messages management
- ✅ Gallery management
- ✅ Hero media management
- ✅ Site settings (via Admin)
- ✅ Real-time notifications (Socket.IO)
- ✅ Terms & Conditions, Privacy Policy pages

---

## Security Notes

- **Never commit** `.env` files to Git — they are in `.gitignore`
- R2 credentials are **backend-only** — never exposed to the React frontend
- MongoDB credentials are **backend-only**
- JWT secrets must be strong random strings in production
- Admin passwords must be strong and unique to DDInfra
- In production, set `FLASK_ENV=production` and ensure `debug=False`

---

## License

© 2026 DDInfra and Co. All rights reserved.

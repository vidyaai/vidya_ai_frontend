# VidyaAI Development Guide

## Project Overview

VidyaAI is an AI-powered educational platform with:
- **Frontend**: Next.js 15 with App Router (TypeScript/JSX hybrid)
- **Backend**: FastAPI with PostgreSQL, deployed separately
- **Core Features**: Video analysis (YouTube/uploaded), AI chat, assignment creation/grading, Stripe subscriptions

## Architecture

### Monorepo Structure
Two separate workspaces (not a true monorepo):
- `vidya_ai_frontend/` - Next.js app
- `vidya_ai_backend/` - FastAPI server

### Frontend: Next.js App Router Patterns

**Route Organization** (`src/app/`):
```
app/
├── (landing)/           # Marketing pages (grouped route)
├── assignments/         # Assignment CRUD
├── chat/               # Video chat interface
├── gallery/            # Video gallery/folders
├── home/               # Dashboard
├── login/              # Authentication
├── pricing/            # Subscription plans
└── layout.tsx          # Root layout with AuthProvider
```

**Key Architectural Decisions**:
- **Hybrid JSX/TSX**: Components are `.jsx` but app routes are `.tsx`
- **Client-side Auth**: Firebase auth via React Context (`src/context/AuthContext.jsx`)
- **Centralized API client**: `src/components/generic/utils.jsx` exports `api` (axios with Firebase token interceptor)

**Auth Pattern**:
```jsx
// All API calls automatically include Firebase ID token
import { api } from '@/components/generic/utils';
const response = await api.post('/api/endpoint', data);
```

**Environment Setup**:
```bash
# Frontend development
cd vidya_ai_frontend
yarn install
yarn dev  # Runs on localhost:3000
```

### Backend: FastAPI Service Architecture

**Core Structure** (`src/`):
```
src/
├── main.py              # App initialization, CORS, router registration
├── models.py            # SQLAlchemy models (Folder, Video, Assignment, etc.)
├── schemas.py           # Pydantic request/response schemas
├── routes/              # API route modules
│   ├── assignments.py   # Assignment CRUD, grading, PDF/Google Forms
│   ├── query.py         # Video chat queries (usage-limited)
│   ├── youtube.py       # Video info, transcript, download
│   ├── payments.py      # Stripe webhook, subscriptions
│   └── ...
├── controllers/
│   ├── subscription_service.py  # Daily usage limits logic
│   └── ...
└── utils/
    ├── firebase_auth.py  # JWT verification dependency
    └── ...
```

**Usage Limits Pattern** (critical for features):
```python
# ALWAYS check limits before expensive operations
from controllers.subscription_service import check_usage_limits, increment_usage

# Check first
usage_check = check_usage_limits(db, user.id, "video_per_day")
if not usage_check["allowed"]:
    raise HTTPException(status_code=429, detail=usage_check["reason"])

# Perform operation...

# Increment after success
increment_usage(db, user.id, "video_per_day", 1)
```

**Usage Types**:
- `"video_per_day"` - Video analysis limit (checked in `/api/youtube/info`)
- `"question_per_video"` - Per-video question limit (checked in `/api/query/video`)

**Subscription Tiers** (defined in `subscription_service.py`):
- Free: 3 videos/day, 6 questions/video/day
- Plus: 10 videos/day, 20 questions/video/day
- Pro: 20 videos/day, unlimited questions/video/day

**Environment Setup**:
```bash
# Backend development (Python 3.13)
cd vidya_ai_backend
python3.13 -m venv vai_venv
source vai_venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
python src/main.py  # Runs on localhost:8000
```

**Required `.env` Variables**:
```bash
# Database
DATABASE_URL=postgresql://...

# Authentication
FIREBASE_CONFIG=./vidyaai-app-firebase-adminsdk-*.json

# Storage
AWS_S3_BUCKET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# AI Services
OPENAI_API_KEY=...
DEEPGRAM_API_KEY=...

# Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLUS_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
```

## Key Integration Patterns

### Firebase Authentication
- Frontend uses Firebase SDK (`firebase/config.js`)
- Backend verifies Firebase ID tokens via `get_current_user` dependency
- Demo mode available when Firebase not configured (`AuthContext.jsx`)

### Database Models (SQLAlchemy)
**Video tracking**:
- `source_type`: `"youtube"` or `"uploaded"`
- `transcript_json`: JSONB field for timestamped segments
- `formatting_status`: Tracks LaTeX/formatting processing
- `download_status`: Tracks video download progress
- `chat_sessions`: JSONB array of chat history per video

**Assignments**:
- Questions stored as JSONB with nested structure
- Supports multi-part questions with optional parts
- Stats calculated via `calculate_assignment_stats()` in `assignments.py`
- Diagram uploads stored in S3, referenced by `file_id`

### Stripe Integration
- Webhook handler at `/api/payments/webhook` processes subscription events
- Local testing: Use Stripe CLI (`stripe listen --forward-to localhost:8000/api/payments/webhook`)
- Test cards documented in `STRIPE_TESTING_QUICK_REF.md`

### S3 Storage Pattern
```python
# Upload files
from controllers.storage import s3_upload_file, s3_presign_url

s3_key = await s3_upload_file(file_content, key_path)
presigned_url = s3_presign_url(s3_key, expiration=3600)
```

## Development Workflows

### Adding New API Endpoints
1. Define Pydantic schemas in `src/schemas.py`
2. Create route in appropriate `src/routes/*.py` module
3. Register router in `src/main.py` (if new module)
4. Add usage limit checks if expensive operation
5. Update frontend API client in `utils.jsx`

### Assignment Question Types
Supported types (see `AssignmentGenerateRequest` schema):
- `"multiple-choice"`, `"true-false"`, `"short-answer"`, `"long-answer"`, `"multi-part"`
- Multi-part questions support `optionalParts` flag

### Testing Stripe Locally
```bash
# Terminal 1: Backend
python src/main.py

# Terminal 2: Stripe CLI
stripe login
stripe listen --forward-to localhost:8000/api/payments/webhook

# Use webhook secret from CLI output in .env
```

### Database Migrations (Alembic)
```bash
cd vidya_ai_backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Common Patterns to Follow

### Frontend API Calls
```jsx
// ALWAYS use the centralized api client
import { api } from '@/components/generic/utils';

// Auto-includes Firebase token
const response = await api.post('/api/youtube/info', { url });
```

### Error Handling (429 Rate Limits)
Frontend intercepts 429 errors and displays user-friendly messages (`utils.jsx` interceptor).

### Video Chat Context
Transcripts are formatted with LaTeX support. Use `formatting_status` to check if available:
```python
formatting_status_info = get_formatting_status(db, video_id)
if formatting_status_info["status"] == "completed":
    transcript = formatting_status_info["formatted_transcript"]
```

### Assignment Creation
- AI generation: POST `/api/assignments/generate` with video context
- Document import: POST `/api/assignments/import-document` (supports PDF, DOCX, MD, HTML)
- Google Forms export: POST `/api/assignments/{id}/generate-google-form`

## Important Notes

- **API_URL Configuration**: Frontend `utils.jsx` currently hardcoded to `localhost:8000` for development (see line 14)
- **Background Tasks**: Video downloads run in ThreadPoolExecutor (`download_executor`)
- **CORS**: Backend allows `https://vidyaai.co`, `localhost:3000`, `localhost:5173`
- **Logging**: Backend uses structured logging via `controllers.config.logger`

## Documentation References

Backend `docs/` folder contains detailed specs:
- `DIAGRAM_UPLOAD_API.md` - Diagram file handling
- `DOCUMENT_IMPORT_README.md` - Document parsing for assignments
- `IMPLEMENTATION_SUMMARY.md` - Subscription system details
- `STRIPE_TESTING_QUICK_REF.md` - Stripe test scenarios

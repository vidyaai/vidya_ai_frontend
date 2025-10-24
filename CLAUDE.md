# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VidyaAI is a React-based educational platform that enables users to interact with videos through AI-powered features including chat, quiz generation, assignment management, and content translation. The app supports both YouTube videos and user-uploaded content.

## Development Commands

**Package Manager:** This project uses Yarn. Always use `yarn` commands, not `npm`.

```bash
# Install dependencies
yarn install

# Start development server (runs on http://0.0.0.0:5173)
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview

# Run linting
yarn lint
```

## Architecture Overview

### Routing & Navigation

The app uses **client-side routing with manual state management** (not React Router in the traditional sense). Navigation is handled through:
- State-based page switching in `App.jsx` via `currentPage` state
- Browser history API with `window.history.pushState` and `popstate` events
- URL parameters for bookmarking (e.g., `/chat?v=videoId`)

Main pages: `landing`, `login`, `home`, `chat`, `gallery`, `translate`, `assignments`, `pricing`, `shared`

### Authentication System

**Firebase Authentication** with fallback demo mode:
- Configuration: `src/firebase/config.js`
- Context provider: `src/context/AuthContext.jsx`
- Supports email/password and Google OAuth
- Demo mode activates when Firebase config is invalid
- Protected routes use `<ProtectedRoute>` component

**Important:** The app falls back to localStorage-based mock authentication if Firebase is not configured. Check `auth.isFirebaseConfigured` to determine mode.

### API Communication

**API Setup:**
- Centralized axios instance in `src/components/generic/utils.jsx`
- API URL determined by `VITE_NODE_ENV` environment variable:
  - `development` → `https://devapi.vidyaai.co`
  - `production` → `https://api.vidyaai.co`
  - `local` → `http://127.0.0.1:8000`
- Automatic Firebase ID token injection via axios interceptor
- Always include `'ngrok-skip-browser-warning': 'true'` header

### State Management

**No Redux/Zustand** - uses React Context + localStorage:
- `AuthContext` for user authentication state
- Component-level state with localStorage persistence
- Per-video chat sessions stored in `chatSessionsByVideo` object
- Video state persists across page refreshes via localStorage

### Component Structure

```
src/
├── App.jsx                      # Main app with routing logic
├── main.jsx                     # React entry point
├── context/
│   └── AuthContext.jsx          # Auth state provider
├── firebase/
│   └── config.js                # Firebase configuration
└── components/
    ├── Assignments/             # Assignment creation, sharing, submissions
    │   ├── AssignmentManager.jsx
    │   ├── AIAssignmentGenerator.jsx
    │   ├── AssignmentBuilder.jsx
    │   ├── AssignmentSharingModal.jsx
    │   ├── AssignmentSubmissions.jsx
    │   └── assignmentApi.js     # API client for assignments
    ├── Chat/                    # Video chat & interaction
    │   ├── ImprovedYouTubePlayer.jsx  # Main video chat component
    │   ├── ChatBoxComponent.jsx
    │   ├── PlayerComponent.jsx
    │   ├── TranscriptComponent.jsx
    │   ├── QuizPanel.jsx
    │   └── VideoUploader.jsx
    ├── Gallery/                 # Video library management
    ├── HomePage/                # Logged-in home page
    ├── Landing/                 # Public landing page
    ├── Login/                   # Authentication forms
    ├── Pricing/                 # Pricing information
    ├── Sharing/                 # Shared resource viewing
    └── generic/                 # Reusable components
        ├── TopBar.jsx           # Navigation bar
        ├── PageHeader.jsx       # Page titles & navigation
        ├── ProtectedRoute.jsx   # Auth guard
        └── utils.jsx            # API client, localStorage, markdown parsing
```

### Key Features & Patterns

**Video Chat System (`ImprovedYouTubePlayer.jsx`):**
- Supports YouTube URLs and uploaded videos
- Per-video chat sessions with localStorage + backend sync
- Real-time transcript parsing with clickable timestamps
- Quiz generation tied to video content
- Shared video support via share tokens

**Assignment System:**
- AI-powered generation from video content or documents
- Multiple question types: MCQ, short answer, multi-part, fill-in-blank, true/false
- Image/diagram support via S3 uploads
- Sharing with specific users or access codes
- Submission tracking and grading

**Shared Resources:**
- Videos and assignments can be shared via unique tokens
- Unauthenticated users can view shared content
- Login redirect preserves share URL via `returnUrl` parameter

**Markdown Parsing:**
- `parseMarkdown()` in `utils.jsx` converts text to React elements
- Supports bold text (`**text**`), timestamps (`mm:ss`), bullet points
- Timestamps become clickable buttons that seek video

## Important Implementation Notes

### Video Loading
- Always check `isLoadingRef.current` before loading videos to prevent race conditions
- Use `loadTimestamp` field to detect duplicate loads
- Video state includes: `videoId`, `sourceType`, `isShared`, `shareToken`, `shareId`

### Chat Sessions
- Sessions are organized per video: `chatSessionsByVideo[videoId] = [session1, session2...]`
- Backend sync occurs via `/api/user-videos/chat-sessions` endpoints
- Session renames emit custom `rename-session` event

### Assignment API
- Centralized in `assignmentApi.js` with full CRUD operations
- Diagram uploads return S3 keys, use `/api/storage/presign` for URLs
- Cleanup orphaned diagrams when updating questions

### Protected Routes
- Wrap authenticated pages with `<ProtectedRoute>`
- Redirects to login page when `currentUser` is null
- Post-login navigation uses `sessionStorage.postLoginTarget`

### URL Parameter Handling
- Share links format: `/shared/{token}` or with `?login=true&returnUrl={url}`
- Video bookmarking: `/chat?v={videoId}`
- Handle URL params only on initial component mount to avoid conflicts

## Styling

- **TailwindCSS** for all styling (configured in `tailwind.config.js`)
- Dark theme with gray-950/900/800 backgrounds
- Gradient accents: indigo, cyan, purple, pink
- Lucide React for icons

## Common Tasks

### Adding a new page
1. Create component in appropriate directory
2. Add case to `renderCurrentPage()` switch in `App.jsx`
3. Create navigation handler with `window.history.pushState`
4. Add URL pattern to `getInitialPage()` if needed

### Adding API endpoints
1. Add method to `api` instance in `utils.jsx` or domain-specific file like `assignmentApi.js`
2. Include `'ngrok-skip-browser-warning': 'true'` header
3. Handle authentication via axios interceptor (automatic)

### Working with videos
- Always use `buildAbsoluteVideoUrl()` for uploaded video URLs
- Check `sourceType` field: `'youtube'` vs `'uploaded'`
- Include `share_token` in API calls for shared videos

### Testing locally
- Set `VITE_NODE_ENV=local` to point to `http://127.0.0.1:8000`
- Firebase demo mode works without backend for basic auth
- Check browser console for API URL confirmation logs

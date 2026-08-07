# 🖥️ Notes App — Frontend

React + TypeScript frontend for the Notes Web App.

- **Live URL:** `https://notes387.vercel.app`
- **Deployed on:** [Vercel](https://vercel.com)
- **Backend API:** `https://notesappback-ubm1.onrender.com`

---

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 (Create React App) |
| Language | TypeScript |
| Routing | React Router v6 |
| HTTP Client | Axios |
| UI Library | Bootstrap 5 + Bootstrap Icons |
| State | React Context API |
| Build Tool | Create React App (CRA) |

---

## 📁 Project Structure

```
frontend/
├── public/
│   └── index.html           # HTML entry point
├── src/
│   ├── components/
│   │   ├── Login.tsx        # Login page with backend warm-up ping
│   │   ├── Dashboard.tsx    # Folder list (reads from DataContext cache)
│   │   ├── FolderView.tsx   # Notes list inside a folder
│   │   ├── NoteView.tsx     # Full note editor/viewer
│   │   ├── Navbar.tsx       # Top navigation bar
│   │   ├── FolderCard.tsx   # Folder card component
│   │   ├── NoteCard.tsx     # Note card component
│   │   ├── CreateFolderModal.tsx
│   │   ├── EditFolderModal.tsx
│   │   └── CreateNoteModal.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx  # JWT auth state, login/logout, axios setup
│   │   ├── DataContext.tsx  # Cross-navigation cache (folders + notes)
│   │   └── ThemeContext.tsx # Dark/light theme toggle
│   ├── services/
│   │   └── api.ts           # All API functions + TypeScript types
│   ├── App.tsx              # Routes and provider tree
│   ├── App.css              # Global styles
│   └── index.tsx            # React entry point
├── .env                     # Environment variables (not committed)
├── tsconfig.json
└── package.json
```

---

## ⚙️ Environment Variables

Create a `.env` file in this directory:

```env
REACT_APP_API_URL=http://localhost:5000
```

For production (set in Vercel dashboard):

```env
REACT_APP_API_URL=https://notesappback-ubm1.onrender.com
```

| Variable | Description |
|----------|-------------|
| `REACT_APP_API_URL` | Base URL of the backend API |

> **Note:** All React environment variables must be prefixed with `REACT_APP_` to be accessible in the browser.

---

## 🚀 Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env file (see above)

# 3. Start the development server
npm start
```

App will be available at `http://localhost:3000`.

> Make sure the backend is also running locally at `http://localhost:5000`, or point `REACT_APP_API_URL` to the deployed backend.

---

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start development server at `localhost:3000` |
| `npm run build` | Create an optimised production build in `/build` |
| `npm test` | Run test suite with Jest |

---

## 🔄 Application Flow

```
/ (Dashboard)
│  └─ Lists all folders from cache (DataContext)
│
└─ /folder/:folderId  (FolderView)
│  └─ Shows notes in a folder
│     ├─ Instant render from cache on back-navigation
│     ├─ Search, sort, paginate notes
│     └─ Create / edit / delete notes
│
└─ /note/:noteId  (NoteView)
│  └─ Full note display and editor
│     ├─ Edit title, content, tags, pin status
│     ├─ Upload / remove images (stored as Base64)
│     └─ Custom created-at / modified-at dates
│
└─ /login  (Login)
   └─ Password-protected entry
      └─ Wakes Render backend on page load
```

---

## 🧠 State Management

### AuthContext
- Stores `isAuthenticated`, `user`, `loading`
- Configures Axios `baseURL` and `Authorization` header globally
- Intercepts 401 responses and redirects to `/login`
- Verifies stored JWT on every app load (`GET /api/auth/verify`)

### DataContext
- Persists data **across React Router page navigations** to eliminate redundant API calls
- `folders` + `foldersLoaded` — Dashboard reads this on every visit; network call only happens once
- `notesCacheByFolder` — Keyed by `folderId`; FolderView shows cached notes instantly when navigating back from a note
- All create/update/delete mutations update both local component state and the context cache simultaneously

### ThemeContext
- Stores the current dark/light theme preference in `localStorage`

---

## ✨ Features

### 🔐 Authentication
- Single shared password login
- JWT stored in `localStorage`
- Auto-logout on token expiry (24h)
- Backend warm-up ping on login page load (reduces Render cold-start impact)

### 📁 Folder Management
- Create, rename, delete folders
- Custom color picker per folder
- Optional description
- Custom created-at date
- Notes count displayed on each folder card

### 📝 Note Taking
- Title + rich content (plain text with large textarea)
- Up to **5 images per note** (stored as Base64 in MongoDB)
- Comma-separated tags
- Pin/unpin notes (pinned notes always sort to top)
- Custom created-at and last-modified dates
- Inline image gallery viewer with navigation

### 🔍 Search & Sort
- Per-folder full-text search (hits MongoDB text index)
- Global search across all notes
- Sort by: Date Created | Last Modified | Title
- Ascending / Descending order toggle
- Pagination (12 notes per page)

### 📱 Responsive UI
- Grid and list view modes for both folders and notes
- Bootstrap 5 responsive grid — works on mobile, tablet, desktop
- Breadcrumb navigation
- Loading spinners and error states

---

## ⚡ Performance Optimisations

| Optimisation | Details |
|---|---|
| **Data cache** | `DataContext` caches folders + notes; back-navigation is instant with no API call |
| **Warm-up ping** | Login page pings `/api/health` immediately to reduce Render cold-start delay |
| **No redundant folder fetch** | FolderView reads the folder object from context (already loaded by Dashboard) |
| **Cache-aware effects** | `isParamChangeRef` prevents duplicate `loadNotes` calls on component mount |
| **JWT verify** | `/api/auth/verify` is purely cryptographic — no DB round-trip |
| **Folder aggregation** | `GET /api/folders` uses a single MongoDB `$group` instead of N sequential writes |

---

## 🚀 Deployment (Vercel)

1. Push code to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Framework preset: **Create React App**
4. Add environment variable in Vercel dashboard:
   ```
   REACT_APP_API_URL = https://notesappback-ubm1.onrender.com
   ```
5. Every push to `main` triggers an automatic re-deploy

---

## 🛠️ TypeScript Types

Key types are defined in [`src/services/api.ts`](src/services/api.ts):

```typescript
interface Folder {
  _id: string;
  name: string;
  description: string;
  color: string;
  notesCount: number;
  mainCreatedAt: string;
  createdAt: string;
}

interface Note {
  _id: string;
  title: string;
  content: string;
  folderId: string | Folder;
  images: { filename: string; originalName: string; mimetype: string; size: number; data: string }[];
  tags: string[];
  isPinned: boolean;
  mainCreatedAt: string;
  mainLastModified: string;
  lastModified: string;
  createdAt: string;
}
```

import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Login and Navbar are on the critical path — always bundled
import Login from './components/Login';
import Navbar from './components/Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Heavy route components loaded on demand — each becomes its own JS chunk.
// The user only downloads Dashboard code when they navigate to "/", etc.
const Dashboard  = lazy(() => import('./components/Dashboard'));
const FolderView = lazy(() => import('./components/FolderView'));
const NoteView   = lazy(() => import('./components/NoteView'));

// ─── Reusable loading screen ────────────────────────────────────────────────

interface PageLoaderProps {
  message?: string;
}

const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading...' }) => (
  <div className="app-page-loader">
    <div className="app-page-loader__card">
      <div className="app-page-loader__spinner" role="status" aria-label="Loading">
        <div className="app-page-loader__ring" />
      </div>
      <p className="app-page-loader__message">{message}</p>
    </div>
  </div>
);

// ─── Auth check loader (shown while JWT is being verified on app boot) ──────

const AuthLoader: React.FC = () => (
  <PageLoader message="Verifying session…" />
);

// ─── Protected route ─────────────────────────────────────────────────────────

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AuthLoader />;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// ─── App content (inside Router) ─────────────────────────────────────────────

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      {isAuthenticated && <Navbar />}

      {/*
        Suspense catches lazy-loaded components while their JS chunk downloads.
        Each route gets a tailored message so the user knows what's happening.
      */}
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading your folders…" />}>
                <Dashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route
          path="/folder/:folderId"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Opening folder…" />}>
                <FolderView />
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route
          path="/note/:noteId"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Opening note…" />}>
                <NoteView />
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────

const App: React.FC = () => (
  <ThemeProvider>
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;

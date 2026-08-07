import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Navigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const { isDark } = useTheme();

  // Warm up the Render backend the instant the login page loads.
  useEffect(() => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/api/health`).catch(() => {}); // fire-and-forget
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!password.trim()) {
      setError('Password is required');
      setLoading(false);
      return;
    }

    const success = await login(password);

    if (!success) {
      setError('Invalid password. Please try again.');
      setPassword('');
    }

    setLoading(false);
  };

  return (
    <div className={isDark ? 'login-hero-bg' : 'login-hero-bg-light'}>
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className={`card border-0 ${isDark ? 'login-glass-card' : 'login-light-card'}`}>
              <div className="card-body p-5">

                {/* Brand */}
                <div className="text-center mb-4">
                  <div className="mb-3">
                    <i
                      className="bi bi-journal-text login-brand-icon"
                      style={{
                        fontSize: '3rem',
                        color: isDark ? '#63b3ff' : '#0056b3'
                      }}
                    />
                  </div>
                  <h1
                    className="h3 fw-bold mb-1"
                    style={{ color: isDark ? '#fff' : '#1a1a2e' }}
                  >
                    Notes App
                  </h1>
                  <p
                    className="mb-0"
                    style={{
                      color: isDark ? 'rgba(255,255,255,0.55)' : '#6c757d',
                      fontSize: '0.88rem'
                    }}
                  >
                    Your secret place to keep your things safe.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label
                      htmlFor="password"
                      className="form-label fw-semibold"
                      style={{ color: isDark ? 'rgba(255,255,255,0.9)' : '#212529' }}
                    >
                      Password
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-lock" />
                      </span>
                      <input
                        type="password"
                        className={`form-control ${error ? 'is-invalid' : ''}`}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        disabled={loading}
                        autoFocus
                      />
                    </div>
                    {error && (
                      <div className="invalid-feedback d-block">
                        <i className="bi bi-exclamation-circle me-1" />
                        {error}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-arrow-right-circle me-2" />
                        Sign In
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <small style={{
                    color: isDark ? 'rgba(255,255,255,0.35)' : '#adb5bd',
                    fontSize: '0.78rem'
                  }}>
                    <i className="bi bi-shield-lock me-1" />
                    Secure access · Personal notes
                  </small>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

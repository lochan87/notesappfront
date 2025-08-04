import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Navbar: React.FC = () => {
  const { logout, user } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className={`navbar navbar-expand-lg ${isDark ? 'navbar-dark bg-dark' : 'navbar-dark bg-primary'} shadow-sm`}>
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          <i className="bi bi-journal-text me-2"></i>
          Notes App
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link 
                className={`nav-link ${isActive('/') ? 'active' : ''}`} 
                to="/"
              >
                <i className="bi bi-house me-1"></i>
                Dashboard
              </Link>
            </li>
          </ul>

          <ul className="navbar-nav">
            {/* Theme Toggle Button */}
            <li className="nav-item me-3">
              <button
                className="theme-toggle nav-link border-0 bg-transparent"
                onClick={toggleTheme}
                title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                style={{
                  color: 'inherit',
                  background: 'transparent',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '50px',
                  padding: '0.5rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <i className={`bi bi-${isDark ? 'sun' : 'moon'}-fill`}></i>
                <span className="d-none d-sm-inline">
                  {isDark ? 'Light' : 'Dark'}
                </span>
              </button>
            </li>
            
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle d-flex align-items-center"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded={showDropdown}
                onClick={(e) => {
                  e.preventDefault();
                  setShowDropdown(!showDropdown);
                }}
              >
                <i className="bi bi-person-circle me-2"></i>
                <span className="d-none d-md-inline">Lochan</span>
              </a>
              <ul className={`dropdown-menu dropdown-menu-end ${showDropdown ? 'show' : ''}`}>
                <li>
                  <div className="dropdown-item-text">
                    <small className="text-muted">
                      Last login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Unknown'}
                    </small>
                  </div>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button 
                    className="dropdown-item text-danger" 
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Logout
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>

      {/* Add Bootstrap JS for dropdown functionality */}
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    </nav>
  );
};

export default Navbar;

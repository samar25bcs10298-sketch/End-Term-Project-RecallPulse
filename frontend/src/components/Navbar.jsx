import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="brand-logo">
          <span className="brand-icon">⚡</span>
          <span className="brand-name">Recall<span className="brand-highlight">Pulse</span></span>
        </Link>

        <div className="nav-links">
          {user ? (
            <>
              <Link to="/dashboard" className="nav-item">Dashboard</Link>
              <Link to="/create" className="nav-item btn-nav-create">+ Ingest Notes</Link>
              <Link to="/analytics" className="nav-item">Analytics</Link>
              <div className="nav-user-dropdown">
                <span className="user-badge">{user.name?.split(' ')[0]}</span>
                <button onClick={handleLogout} className="btn-logout" title="Sign out">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-item">Log In</Link>
              <Link to="/register" className="nav-item btn-primary">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

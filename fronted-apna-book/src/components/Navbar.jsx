import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { CartContext } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import logo from '../assets/logo.png';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [profileOpen, setProfileOpen] = useState(false);
  const { items } = useContext(CartContext);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const cartCount = items.reduce(
    (total, item) => total + (item.quantity ?? 1),
    0
  );

  useEffect(() => {
    const savedTheme = localStorage.getItem('apnabook_theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('apnabook_theme', nextTheme);
  };

  const handleLogout = () => {
    logout();
    setOpen(false);
    setProfileOpen(false);
    navigate('/login', { replace: true });
  };

  const isUser = user?.role === 'user';

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo">
          <img className="logo-icon" src={logo} alt="Pustakly logo" />
          Pustakly
        </Link>
        
        <nav className="nav-links">
          <a href="/#banner" className="nav-link">Highlights</a>
          <a href="/#trending" className="nav-link">Trending</a>
          <a href="/#offers" className="nav-link">Offers</a>
          <a href="/#categories" className="nav-link">Categories</a>
          <Link to="/marketplace" className="nav-link">Marketplace</Link>
          <Link to="/books" className="nav-link">Browse</Link>
        </nav>

        <div className="nav-actions">
          <button
            type="button"
            className="ghost-btn theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          >
            <span className="btn-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
            Mode
          </button>
          {user ? (
            isUser ? (
              <div className="profile-menu">
                <button
                  type="button"
                  className="ghost-btn profile-trigger"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  aria-expanded={profileOpen}
                >
                  <span className="btn-icon">👤</span>
                  My Profile
                </button>
                {profileOpen && (
                  <div className="profile-dropdown">
                    <Link to="/user/dashboard" onClick={() => setProfileOpen(false)}>
                      Dashboard
                    </Link>
                    <Link to="/user/profile" onClick={() => setProfileOpen(false)}>
                      View Profile
                    </Link>
                    <button type="button" onClick={handleLogout}>Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <button type="button" className="ghost-btn" onClick={handleLogout}>
                <span className="btn-icon">🚪</span>
                Logout
              </button>
            )
          ) : (
            <Link to="/login" className="ghost-btn">
              <span className="btn-icon">👤</span>
              Sign in
            </Link>
          )}
          <Link to="/cart" className="primary-btn cart-btn">
            <span className="btn-icon">🛒</span>
            Cart
            <span className="cart-badge">{cartCount}</span>
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="mobile-toggle"
          aria-label="Toggle menu"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div className="mobile-menu">
          <a href="/#banner" onClick={() => setOpen(false)}>Highlights</a>
          <a href="/#trending" onClick={() => setOpen(false)}>Trending</a>
          <a href="/#offers" onClick={() => setOpen(false)}>Offers</a>
          <a href="/#categories" onClick={() => setOpen(false)}>Categories</a>
          <Link to="/marketplace" onClick={() => setOpen(false)}>Marketplace</Link>
          <Link to="/books" onClick={() => setOpen(false)}>Browse</Link>
          <div className="mobile-menu-divider"></div>
          <button
            type="button"
            className="ghost-btn theme-toggle"
            onClick={toggleTheme}
          >
            <span className="btn-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
            Mode
          </button>
          {user ? (
            isUser ? (
              <>
                <Link to="/user/dashboard" className="primary-btn" onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
                <Link to="/user/profile" className="primary-btn" onClick={() => setOpen(false)}>
                  My Profile
                </Link>
                <button type="button" className="primary-btn" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <button type="button" className="primary-btn" onClick={handleLogout}>
                Logout
              </button>
            )
          ) : (
            <Link to="/login" className="primary-btn" onClick={() => setOpen(false)}>
              Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../App.css';

const Navigation = () => {
  const { user, logout, isAdmin, isManager, toggleTheme, theme } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname.startsWith(path) ? 'active' : '';
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { path: '/proposals', icon: '📋', label: 'Propostas', show: true },
    { path: '/products', icon: '📦', label: 'Produtos', show: isAdmin() || isManager() },
    { path: '/users', icon: '👥', label: 'Usuários', show: isAdmin() },
    { path: '/clients', icon: '🏢', label: 'Clientes', show: true },
  ];

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="brand-main">
          <img
            src={theme === 'light' ?
              'https://agaron.help/assets/img/agaronchat-fundobranco.png' :
              'https://agaron.help/assets/img/agaronchat-fundopreto.png'
            }
            alt="Agaron Chat"
            className="nav-logo"
          />
        </div>


        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span className={`hamburger-line ${isMobileMenuOpen ? 'line-1' : ''}`}></span>
          <span className={`hamburger-line ${isMobileMenuOpen ? 'line-2' : ''}`}></span>
          <span className={`hamburger-line ${isMobileMenuOpen ? 'line-3' : ''}`}></span>
        </button>

        <nav className={`main-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`} id="sidebar-nav">
          <div className="nav-links-container">
            {navItems.map((item) =>
              item.show && (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${isActive(item.path)}`}
                  onClick={closeMobileMenu}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </Link>
              )
            )}
          </div>
          <div className="user-role-badge">
            <span className="role-icon">👤</span>
            {user?.role || 'System Administrator'}
          </div>

          <div className="mobile-menu-actions">
            <button
              onClick={() => { toggleTheme(); closeMobileMenu(); }}
              className="mobile-menu-btn"
            >
              <span className="theme-icon">
                {theme === 'light' ? '🌙' : '☀️'}
              </span>
              {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            </button>

            <button
              onClick={handleLogout}
              className="mobile-menu-btn mobile-logout"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Sair do Sistema
            </button>
          </div>
        </nav>

        <div className="nav-actions">
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            id="theme-toggle"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <span className="theme-icon">
              {theme === 'light' ? '🌙' : '☀️'}
            </span>
            <span className="theme-text">
              {theme === 'light' ? 'Dark' : 'Light'}
            </span>
          </button>

          <div className="user-profile" id="user-profile">
            <div className="user-avatar">
              <span className="avatar-icon">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="user-details">
              <span className="user-name">
                {user?.firstName}
              </span>
              <span className="user-position">
                {user?.position}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="logout-btn"
            title="Logout"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span className="logout-text">Sair</span>
          </button>
        </div>

        {isMobileMenuOpen && (
          <div
            className="mobile-overlay"
            onClick={closeMobileMenu}
          ></div>
        )}


      </div>
    </header >
  );
};

export default Navigation;
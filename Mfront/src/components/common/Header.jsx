import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-brand">
          <h1>MoneyTrackr</h1>
        </div>
        
        <div className="header-nav">
          <div className="user-info">
            <span className="user-name">{user?.name || 'User'}</span>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

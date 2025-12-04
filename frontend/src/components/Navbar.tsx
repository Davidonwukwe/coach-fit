// src/components/Navbar.tsx
import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./Navbar.css";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  // Safe avatar
  const avatarSrc =
    user && (user as any).photoURL
      ? (user as any).photoURL
      : "/default-avatar.png";

  return (
    <nav className="nav">
      {/* Left: Logo - Always Visible */}
      <div className="nav-left">
        <div className="nav-logo-icon">🏋️‍♂️</div>
        <Link to="/" className="nav-logo-text">
          Coach-Fit
        </Link>
      </div>

      {/* Right Side - Only Visible if User is Logged In */}
      {user && (
        <>
          {/* Desktop Navigation */}
          <div className="nav-right desktop-only">
            <NavLink to="/dashboard" className="nav-link">
              Dashboard
            </NavLink>

            <NavLink to="/log-workout" className="nav-link">
              Log Workout
            </NavLink>

            <NavLink to="/history" className="nav-link">
              History
            </NavLink>

            <NavLink to="/analytics" className="nav-link">
              Analytics
            </NavLink>

            {/* Profile dropdown */}
            <div className="profile-container">
              <img
                src={avatarSrc}
                className="nav-avatar"
                onClick={toggleDropdown}
                alt="User Avatar"
              />

              {dropdownOpen && (
                <div className="dropdown-menu">
                  <Link to="/profile" className="dropdown-item">
                    Profile Settings
                  </Link>
                  <button onClick={logout} className="dropdown-item logout-item">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Hamburger */}
          <div className="hamburger mobile-only" onClick={toggleMenu}>
            ☰
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="mobile-menu mobile-only">
              <NavLink
                to="/dashboard"
                className="mobile-nav-link"
                onClick={toggleMenu}
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/log-workout"
                className="mobile-nav-link"
                onClick={toggleMenu}
              >
                Log Workout
              </NavLink>

              <NavLink
                to="/history"
                className="mobile-nav-link"
                onClick={toggleMenu}
              >
                History
              </NavLink>

              <NavLink
                to="/analytics"
                className="mobile-nav-link"
                onClick={toggleMenu}
              >
                Analytics
              </NavLink>

              <div className="mobile-profile">
                <Link to="/profile" onClick={toggleMenu}>
                  Profile Settings
                </Link>
                <button onClick={logout}>Logout</button>
              </div>
            </div>
          )}
        </>
      )}
    </nav>
  );
};

export default Navbar;
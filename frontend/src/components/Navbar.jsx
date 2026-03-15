import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  CalendarDays, LayoutDashboard, PlusCircle, ClipboardList,
  LogOut, Menu, X, Ticket, QrCode,
} from 'lucide-react';
import { useState } from 'react';
import './Navbar.css';

const NAV_LINKS = {
  student: [
    { to: '/student/dashboard', label: 'Events', icon: CalendarDays },
    { to: '/student/my-registrations', label: 'My Registrations', icon: Ticket },
  ],
  organizer: [
    { to: '/organizer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/organizer/events', label: 'My Events', icon: ClipboardList },
    { to: '/organizer/create-event', label: 'Create Event', icon: PlusCircle },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = user ? (NAV_LINKS[user.role] || []) : [];
  const isActive = (to) => location.pathname === to;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to={user ? `/${user.role}/dashboard` : '/'} className="navbar-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">EventSphere</span>
        </Link>

        {/* Desktop Nav Links */}
        {user && (
          <div className="navbar-links">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`nav-link ${isActive(to) ? 'active' : ''}`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="navbar-right">
          {user ? (
            <>
              <div className="user-pill">
                <span className="user-avatar">{user.avatar}</span>
                <span className="user-name">{user.name.split(' ')[0]}</span>
                <span className={`role-badge role-${user.role}`}>{user.role}</span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                <LogOut size={15} />
                <span className="hide-mobile">Logout</span>
              </button>
            </>
          ) : (
            <div className="flex gap-1">
              <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}

          {user && (
            <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && user && (
        <div className="mobile-menu">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`mobile-link ${isActive(to) ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

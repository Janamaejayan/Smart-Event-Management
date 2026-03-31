import { createContext, useContext, useState, useCallback } from 'react';

// ─── DEV BYPASS ──────────────────────────────────────────────────────────────
// Set DEV_BYPASS to true to skip login and access all pages freely.
// Change DEV_ROLE to 'organizer' to preview organizer pages.
// Set DEV_BYPASS back to false before deploying!
const DEV_BYPASS = true;
const DEV_ROLE = 'student'; // 'student' | 'organizer'

const DEV_USER = {
  _id: 'dev-user-001',
  name: 'Dev User',
  email: 'dev@example.com',
  role: DEV_ROLE,
};
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    if (DEV_BYPASS) return DEV_USER;
    try {
      const stored = localStorage.getItem('sem_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('sem_user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('sem_user');
    localStorage.removeItem('sem_token');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

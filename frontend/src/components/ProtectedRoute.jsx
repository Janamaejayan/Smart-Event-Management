import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    // Redirect to their correct dashboard
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  return children;
}

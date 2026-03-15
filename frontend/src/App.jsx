import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import EventDetailPage from './pages/student/EventDetailPage';
import MyRegistrationsPage from './pages/student/MyRegistrationsPage';

// Organizer pages
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import CreateEventPage from './pages/organizer/CreateEventPage';
import ManageEventsPage from './pages/organizer/ManageEventsPage';
import EventAttendeesPage from './pages/organizer/EventAttendeesPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Navbar />
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Student */}
            <Route path="/student/dashboard" element={
              <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>
            } />
            <Route path="/student/event/:id" element={
              <ProtectedRoute role="student"><EventDetailPage /></ProtectedRoute>
            } />
            <Route path="/student/my-registrations" element={
              <ProtectedRoute role="student"><MyRegistrationsPage /></ProtectedRoute>
            } />

            {/* Organizer — also let organizer view event detail */}
            <Route path="/organizer/dashboard" element={
              <ProtectedRoute role="organizer"><OrganizerDashboard /></ProtectedRoute>
            } />
            <Route path="/organizer/create-event" element={
              <ProtectedRoute role="organizer"><CreateEventPage /></ProtectedRoute>
            } />
            <Route path="/organizer/events" element={
              <ProtectedRoute role="organizer"><ManageEventsPage /></ProtectedRoute>
            } />
            <Route path="/organizer/event/:id/attendees" element={
              <ProtectedRoute role="organizer"><EventAttendeesPage /></ProtectedRoute>
            } />
            {/* Organizer event detail (read-only card for nav from dashboard) */}
            <Route path="/organizer/event/:id" element={
              <ProtectedRoute role="organizer">
                <Navigate to="/organizer/events" replace />
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

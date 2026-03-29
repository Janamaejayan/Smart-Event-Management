import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyOrgEvents } from '../../services/api';
import {
  LayoutDashboard, CalendarDays, Users, TrendingUp,
  PlusCircle, ClipboardList, ArrowRight, BarChart2,
} from 'lucide-react';
import EventCard from '../../components/EventCard';
import './OrganizerDashboard.css';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrgEvents().then((res) => {
      setEvents(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalRegistered = events.reduce((sum, e) => sum + (e.registered || 0), 0);
  const totalCapacity = events.reduce((sum, e) => sum + (e.capacity || 0), 0);
  const avgFill = totalCapacity > 0 ? Math.round((totalRegistered / totalCapacity) * 100) : 0;

  const stats = [
    { label: 'Total Events', value: events.length, icon: <CalendarDays size={22} />, color: 'purple' },
    { label: 'Total Registrations', value: totalRegistered, icon: <Users size={22} />, color: 'blue' },
    { label: 'Avg. Fill Rate', value: `${avgFill}%`, icon: <TrendingUp size={22} />, color: 'green' },
  ];

  const quickActions = [
    { to: '/organizer/create-event', label: 'Create New Event', icon: <PlusCircle size={18} />, cls: 'btn-primary' },
    { to: '/organizer/events', label: 'Manage Events', icon: <ClipboardList size={18} />, cls: 'btn-secondary' },
    { to: '/organizer/analytics', label: 'Analytics', icon: <BarChart2 size={18} />, cls: 'btn-secondary' },
  ];

  return (
    <div className="page-wrapper fade-in">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="section-title">
            Welcome back, {user?.name?.split(' ')[0]} 🗂
          </h1>
          <p className="section-subtitle">Manage your events and track registrations</p>
        </div>
        <div className="flex gap-1">
          {quickActions.map((a) => (
            <Link key={a.to} to={a.to} className={`btn ${a.cls}`}>
              {a.icon} {a.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Events */}
      <div className="section-header">
        <h2 className="section-title" style={{ fontSize: '1.1rem' }}>Your Events</h2>
        <Link to="/organizer/events" className="btn btn-secondary btn-sm">
          View All <ArrowRight size={14} />
        </Link>
      </div>

      {loading ? (
        <div className="flex-center" style={{ padding: '3rem' }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><CalendarDays size={40} /></div>
          <h3>No events yet</h3>
          <p>Create your first event to get started.</p>
          <Link to="/organizer/create-event" className="btn btn-primary mt-2">
            <PlusCircle size={16} /> Create Event
          </Link>
        </div>
      ) : (
        <div className="events-grid-org">
          {events.slice(0, 3).map((e) => (
            <EventCard key={e.id} event={e} linkPrefix="/organizer" />
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { getMyOrgEvents, deleteEvent } from '../../services/api';
import { PlusCircle, Trash2, Users, CalendarDays, Pencil, BarChart2, MessageSquare } from 'lucide-react';
import './ManageEventsPage.css';

export default function ManageEventsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    getMyOrgEvents().then((res) => {
      setEvents(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e._id !== id && e.id !== id));
      addToast('Event deleted.', 'info');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) return (
    <div className="flex-center" style={{ padding: '6rem' }}>
      <div className="spinner" style={{ width: 48, height: 48 }} />
    </div>
  );

  return (
    <div className="page-wrapper fade-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">My Events</h1>
          <p className="section-subtitle">{events.length} event{events.length !== 1 ? 's' : ''} created</p>
        </div>
        <Link to="/organizer/create-event" className="btn btn-primary">
          <PlusCircle size={16} /> New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><CalendarDays size={48} /></div>
          <h3>No events yet</h3>
          <p>Create your first event to get started.</p>
        </div>
      ) : (
        <div className="events-manage-grid">
          {events.map((event) => {
            const fillPct = Math.round((event.registered / event.capacity) * 100);
            
            const now = new Date();
            let isFinished = false;
            let isClosed = false;

            if (event.endDate && event.endTime) {
              if (now > new Date(`${event.endDate}T${event.endTime}`)) isFinished = true;
            }
            if (event.deadlineDate && event.deadlineTime) {
              if (now > new Date(`${event.deadlineDate}T${event.deadlineTime}`)) isClosed = true;
            }

            return (
              <div key={event.id} className="manage-card">
                {/* Top Strip */}
                <div className="mc-strip" style={{ background: isFinished ? 'var(--text-muted)' : 'var(--accent)' }} />

                {/* Header: Title and Status */}
                <div className="mc-header">
                  <div>
                    <h3 className="mc-title">{event.title}</h3>
                    <div className="mc-tags">
                      {isFinished ? (
                        <span className="badge badge-muted" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', background: 'rgba(255,255,255,0.05)' }}>Finished</span>
                      ) : isClosed ? (
                        <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>Closed</span>
                      ) : null}
                      {event.tags?.map((t) => (
                        <span key={t} className="badge badge-muted" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <span className={`badge mc-status ${event.status === 'published' ? 'badge-success' : 'badge-muted'}`}>
                    {event.status}
                  </span>
                </div>

                {/* Body: Info and Capacity */}
                <div className="mc-body">
                  <div className="mc-info-row">
                    <CalendarDays size={14} /> <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="mc-info-row">
                    <Users size={14} /> <span>{event.venue}</span>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mc-capacity">
                    <div className="mc-cap-header">
                      <span className="label">Registrations</span>
                      <span className="value">{event.registered} / {event.capacity}</span>
                    </div>
                    <div className="mc-bar-bg">
                      <div
                        className={`mc-bar-fill ${fillPct >= 100 ? 'full' : fillPct > 75 ? 'warn' : ''}`}
                        style={{ width: `${Math.min(fillPct, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer: Price Badge and Action Icons */}
                <div className="mc-footer">
                  <div className={`m-type-badge ${event.isPaid ? 'paid' : 'free'}`}>
                    {event.isPaid ? `₹${event.price}` : 'Free'}
                  </div>

                  <div className="mc-actions">
                    <Link
                      to={`/organizer/event/${event._id || event.id}/attendees`}
                      className="mc-action-btn"
                      title="Attendance Sheet"
                    >
                      <Users size={15} />
                    </Link>
                    <Link
                      to={`/organizer/event/${event._id || event.id}/analytics`}
                      className="mc-action-btn"
                      title="Analytics"
                    >
                      <BarChart2 size={15} />
                    </Link>
                    <Link
                      to={`/organizer/event/${event._id || event.id}/feedback`}
                      className="mc-action-btn"
                      title="Feedback & Reviews"
                    >
                      <MessageSquare size={15} />
                    </Link>
                    <button
                      className="mc-action-btn delete"
                      onClick={() => handleDelete(event._id || event.id, event.title)}
                      disabled={deletingId === (event._id || event.id)}
                      title="Delete Event"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

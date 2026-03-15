import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { getMyOrgEvents, deleteEvent } from '../../services/api';
import { PlusCircle, Trash2, Users, CalendarDays, Pencil } from 'lucide-react';
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
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Venue</th>
                <th>Registrations</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const fillPct = Math.round((event.registered / event.capacity) * 100);
                return (
                  <tr key={event.id}>
                    <td>
                      <div className="event-name-cell">
                        <div className="event-color-dot" style={{ background: event.bannerColor }} />
                        <div>
                          <strong>{event.title}</strong>
                          <div className="event-tags-inline">
                            {event.tags?.map((t) => <span key={t} className="badge badge-muted">{t}</span>)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(event.date)}</td>
                    <td>{event.venue}</td>
                    <td>
                      <div>
                        <div className="fill-label">{event.registered}/{event.capacity}</div>
                        <div className="mini-bar">
                          <div
                            className={`mini-fill ${fillPct >= 100 ? 'full' : fillPct > 75 ? 'warn' : ''}`}
                            style={{ width: `${Math.min(fillPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      {event.isPaid
                        ? <span className="badge badge-warning">₹{event.price}</span>
                        : <span className="badge badge-success">Free</span>}
                    </td>
                    <td>
                      <span className={`badge ${event.status === 'published' ? 'badge-success' : 'badge-muted'}`}>
                        {event.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <Link
                          to={`/organizer/event/${event.id}/attendees`}
                          className="btn btn-secondary btn-sm"
                          title="Attendance Sheet"
                        >
                          <Users size={14} />
                        </Link>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(event.id, event.title)}
                          disabled={deletingId === event.id}
                          title="Delete Event"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

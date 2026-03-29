import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users } from 'lucide-react';
import './EventCard.css';

// GRADIENTS removed

export default function EventCard({ event, linkPrefix = '/student' }) {
  const spotsLeft = event.capacity - event.registered;
  const isFull = spotsLeft <= 0;
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

  const bg = isFinished ? 'var(--text-muted)' : 'var(--accent)';

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <Link to={`${linkPrefix}/event/${event.id || event._id}`} className="event-card-link">
      <div className="ec-card">
        {/* Top Strip */}
        <div className="ec-strip" style={{ background: bg }} />

        {/* Header: Title, Tags, Price */}
        <div className="ec-header">
          <div>
            <h3 className="ec-title">{event.title}</h3>
            <div className="ec-tags">
              {isFinished ? (
                <span className="badge badge-muted" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', background: 'rgba(255,255,255,0.05)' }}>Finished</span>
              ) : isClosed ? (
                <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>Registration Closed</span>
              ) : null}
              {event.tags?.map((t) => (
                <span key={t} className="badge badge-muted" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>{t}</span>
              ))}
            </div>
          </div>
          <span className={`ec-price-badge ${event.isPaid ? 'paid' : 'free'}`}>
            {event.isPaid ? `₹${event.price}` : 'Free'}
          </span>
        </div>

        {/* Body: Desc, Info, Capacity */}
        <div className="ec-body">
          <p className="ec-desc">{event.description}</p>
          <div className="ec-info-row">
            <Calendar size={14} /> <span>{formatDate(event.date)}</span>
          </div>
          <div className="ec-info-row">
            <MapPin size={14} /> <span>{event.venue}</span>
          </div>

          {/* Capacity Bar */}
          <div className="ec-capacity">
            <div className="ec-cap-header">
              <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={13} /> {isFull ? 'Fully booked' : `${spotsLeft} spots left`}
              </span>
              <span className="value">{fillPct}%</span>
            </div>
            <div className="ec-bar-bg">
              <div
                className={`ec-bar-fill ${isFull ? 'full' : fillPct > 75 ? 'warn' : ''}`}
                style={{ width: `${Math.min(fillPct, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, IndianRupee } from 'lucide-react';

const GRADIENT_FALLBACKS = [
  'linear-gradient(135deg, #8b5cf6, #3b82f6)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
];

export default function EventCard({ event, linkPrefix = '/student' }) {
  const spotsLeft = event.capacity - event.registered;
  const isFull = spotsLeft <= 0;
  const fillPct = Math.round((event.registered / event.capacity) * 100);
  const bg = event.bannerColor || GRADIENT_FALLBACKS[0];

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <Link to={`${linkPrefix}/event/${event.id}`} className="event-card-link">
      <div className="event-card">
        {/* Banner */}
        <div className="event-banner" style={{ background: bg }}>
          <div className="event-banner-overlay">
            <div className="event-tags">
              {event.tags?.map((tag) => (
                <span key={tag} className="event-tag">{tag}</span>
              ))}
            </div>
            {event.isPaid ? (
              <span className="price-badge">
                <IndianRupee size={13} />₹{event.price}
              </span>
            ) : (
              <span className="price-badge free">Free</span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="event-card-body">
          <h3 className="event-title">{event.title}</h3>
          <p className="event-desc">{event.description}</p>

          <div className="event-meta">
            <span><Calendar size={14} />{formatDate(event.date)}</span>
            <span><MapPin size={14} />{event.venue}</span>
          </div>

          {/* Capacity bar */}
          <div className="capacity-bar-wrapper">
            <div className="capacity-labels">
              <span className="flex gap-1" style={{ alignItems: 'center' }}>
                <Users size={13} />
                {isFull ? 'Fully booked' : `${spotsLeft} spots left`}
              </span>
              <span>{fillPct}%</span>
            </div>
            <div className="capacity-bar">
              <div
                className={`capacity-fill ${isFull ? 'full' : fillPct > 75 ? 'warn' : ''}`}
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

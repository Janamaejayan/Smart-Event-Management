import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getEvents } from '../../services/api';
import EventCard from '../../components/EventCard';
import { Search, SlidersHorizontal, CalendarDays } from 'lucide-react';
import './StudentDashboard.css';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | free | paid

  useEffect(() => {
    getEvents().then((res) => {
      setEvents(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = events.filter((e) => {
    const matchSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase()) ||
      e.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchFilter =
      filter === 'all' ||
      (filter === 'free' && !e.isPaid) ||
      (filter === 'paid' && e.isPaid);
    return matchSearch && matchFilter;
  });

  return (
    <div className="page-wrapper fade-in">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="section-title">
            Hey, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="section-subtitle">Browse and register for upcoming campus events</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="event-controls">
        <div className="search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search events, venues, tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-wrap">
          <SlidersHorizontal size={15} style={{ color: 'var(--text-muted)' }} />
          {['all', 'free', 'paid'].map((f) => (
            <button
              key={f}
              className={`filter-chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Events grid */}
      {loading ? (
        <div className="flex-center" style={{ padding: '4rem' }}>
          <div className="spinner" style={{ width: 48, height: 48 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><CalendarDays size={48} /></div>
          <h3>No events found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="events-grid">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} linkPrefix="/student" />
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEventFeedback, getEventById } from '../../services/api';
import { useToast } from '../../components/Toast';
import {
  ArrowLeft, Star, MessageSquare, Users, TrendingUp,
} from 'lucide-react';
import './EventFeedbackPage.css';

// ─── Star display (read-only) ─────────────────────────────────────────────────
function StarDisplay({ rating, size = 16 }) {
  return (
    <div className="star-display">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={s <= Math.round(rating) ? 'star-filled' : 'star-empty'}
        />
      ))}
    </div>
  );
}

// ─── Distribution bar ─────────────────────────────────────────────────────────
function DistributionBar({ star, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="dist-row">
      <span className="dist-label">{star} <Star size={11} className="star-filled-sm" /></span>
      <div className="dist-track">
        <div className="dist-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="dist-count">{count}</span>
    </div>
  );
}

export default function EventFeedbackPage() {
  const { id } = useParams();
  const { addToast } = useToast();

  const [event, setEvent] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(0); // 0 = all

  useEffect(() => {
    Promise.all([getEventById(id), getEventFeedback(id)])
      .then(([evRes, fbRes]) => {
        setEvent(evRes.data);
        setData(fbRes.data);
        setLoading(false);
      })
      .catch((err) => {
        addToast(err.message, 'error');
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <div className="flex-center" style={{ padding: '6rem' }}>
      <div className="spinner" style={{ width: 48, height: 48 }} />
    </div>
  );

  if (!data) return null;

  const { total, avgRating, distribution, feedbacks } = data;
  const filtered = filter > 0 ? feedbacks.filter((f) => f.rating === filter) : feedbacks;

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="page-wrapper fade-in">
      <Link to="/organizer/events" className="back-link mb-2">
        <ArrowLeft size={16} /> Back to Events
      </Link>

      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="section-title">{event?.title}</h1>
          <p className="section-subtitle">Student Ratings & Feedback</p>
        </div>
      </div>

      {total === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><MessageSquare size={48} /></div>
          <h3>No reviews yet</h3>
          <p>Feedback from students will appear here after the event.</p>
        </div>
      ) : (
        <div className="feedback-layout">
          {/* ── Left: Summary panel ───────────────────────────────── */}
          <div className="feedback-summary card">
            {/* Big average */}
            <div className="avg-rating-block">
              <div className="avg-score">{avgRating.toFixed(1)}</div>
              <StarDisplay rating={avgRating} size={20} />
              <p className="avg-sub">{total} review{total !== 1 ? 's' : ''}</p>
            </div>

            <hr className="divider" />

            {/* Distribution */}
            <div className="dist-chart">
              {[5, 4, 3, 2, 1].map((star) => {
                const entry = distribution.find((d) => d.star === star) || { count: 0 };
                return <DistributionBar key={star} star={star} count={entry.count} total={total} />;
              })}
            </div>

            <hr className="divider" />

            {/* KPI stats */}
            <div className="feedback-kpis">
              <div className="fb-kpi">
                <Users size={16} />
                <span>{total} reviewers</span>
              </div>
              <div className="fb-kpi">
                <TrendingUp size={16} />
                <span>{avgRating >= 4 ? 'Highly rated' : avgRating >= 3 ? 'Well received' : 'Needs improvement'}</span>
              </div>
            </div>

            {/* Filter by star */}
            <div className="star-filter">
              <p className="fb-filter-label">Filter by rating</p>
              <div className="star-filter-btns">
                <button
                  className={`sfb ${filter === 0 ? 'active' : ''}`}
                  onClick={() => setFilter(0)}
                >All</button>
                {[5, 4, 3, 2, 1].map((s) => (
                  <button
                    key={s}
                    className={`sfb ${filter === s ? 'active' : ''}`}
                    onClick={() => setFilter(s === filter ? 0 : s)}
                  >
                    {s}★
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Reviews list ───────────────────────────────── */}
          <div className="feedback-reviews">
            {filtered.length === 0 ? (
              <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                <p>No {filter}★ reviews yet.</p>
              </div>
            ) : (
              filtered.map((fb) => (
                <div key={fb.id} className="review-card card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <div className="reviewer-avatar">
                        {fb.studentName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="reviewer-name">{fb.studentName}</p>
                        <p className="review-date">{formatDate(fb.createdAt)}</p>
                      </div>
                    </div>
                    <StarDisplay rating={fb.rating} size={15} />
                  </div>

                  {fb.comment ? (
                    <p className="review-comment">"{fb.comment}"</p>
                  ) : (
                    <p className="review-no-comment">No written review</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

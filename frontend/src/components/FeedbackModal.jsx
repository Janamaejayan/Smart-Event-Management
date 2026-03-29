import { useState, useEffect } from 'react';
import { Star, X, Send, CheckCircle } from 'lucide-react';
import { submitFeedback, getMyFeedback } from '../services/api';
import { useToast } from './Toast';
import './FeedbackModal.css';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function FeedbackModal({ registration, onClose }) {
  const { addToast } = useToast();
  const eventId = registration?.event?._id || registration?.eventId;
  const eventTitle = registration?.event?.title;

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existing, setExisting] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Load existing feedback (if student already rated)
  useEffect(() => {
    if (!eventId) return;
    getMyFeedback(eventId)
      .then((res) => {
        if (res.data) {
          setExisting(res.data);
          setRating(res.data.rating);
          setComment(res.data.comment || '');
          setIsAnonymous(res.data.isAnonymous || false);
        }
      })
      .catch(() => {});
  }, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      addToast('Please select a star rating.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await submitFeedback(eventId, rating, comment, isAnonymous);
      setSubmitted(true);
      addToast(existing ? 'Feedback updated!' : 'Thank you for your feedback! 🌟', 'success');
      setTimeout(() => onClose(), 1800);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hovered || rating;

  return (
    <div className="fb-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fb-modal card fade-in">
        {/* Header */}
        <div className="fb-header">
          <div>
            <h2 className="fb-title">{existing ? 'Update Your Review' : 'Rate this Event'}</h2>
            <p className="fb-event-name">{eventTitle}</p>
          </div>
          <button className="fb-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div className="fb-success">
            <CheckCircle size={48} />
            <p>Review submitted!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Star rating */}
            <div className="fb-stars-section">
              <p className="fb-section-label">Your Rating</p>
              <div className="fb-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`fb-star ${displayRating >= star ? 'filled' : ''}`}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(star)}
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    <Star size={36} />
                  </button>
                ))}
              </div>
              {displayRating > 0 && (
                <p className="fb-rating-label">{LABELS[displayRating]}</p>
              )}
            </div>

            {/* Comment */}
            <div className="form-group">
              <label className="form-label">Your Review <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Share what you liked or what could be improved…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
              />
              <p className="form-hint">{comment.length}/1000</p>
            </div>

            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <input
                type="checkbox"
                id="anonymous-check"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              <label htmlFor="anonymous-check" className="form-label" style={{ margin: 0, cursor: 'pointer', fontSize: '0.85rem' }}>
                Submit anonymously <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(hide my name from organizer)</span>
              </label>
            </div>

            <div className="fb-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || rating === 0}
              >
                {submitting ? (
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                ) : (
                  <Send size={15} />
                )}
                {existing ? 'Update Review' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

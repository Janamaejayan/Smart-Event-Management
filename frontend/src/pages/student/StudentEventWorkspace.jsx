import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { getRegistrationById, selfCheckin, submitFeedback, getMyFeedback } from '../../services/api';
import { ArrowLeft, CheckCircle, Clock, MapPin, CalendarDays, Download, Star, Info } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function StudentEventWorkspace() {
  const { id } = useParams(); // registrationId
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Attendance state
  const [attCode, setAttCode] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  
  // Feedback state
  const [feedback, setFeedback] = useState({ rating: 0, comment: '', isAnonymous: false });
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [submittingFB, setSubmittingFB] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const res = await getRegistrationById(id);
      const regData = { ...res.data, event: res.data.eventId };
      setData(regData);
      if (regData.event && regData.event._id) {
        const fbRes = await getMyFeedback(regData.event._id);
        if (fbRes.data) setExistingFeedback(fbRes.data);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const isPastEvent = (dateStr) => dateStr && new Date(dateStr) < new Date();

  const hasEventStarted = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return true;
    const startDateTime = new Date(`${dateStr}T${timeStr}`);
    return new Date() >= startDateTime;
  };

  // --- Handlers ---
  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (attCode.length !== 6) return addToast('Code must be 6 characters', 'error');
    setCheckingIn(true);
    try {
      await selfCheckin(data.event._id, attCode.toUpperCase());
      addToast('Checked in successfully!', 'success');
      setData(prev => ({ ...prev, isPresent: true }));
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (feedback.rating === 0) return addToast('Please select a rating', 'error');
    setSubmittingFB(true);
    try {
      const res = await submitFeedback(data.event._id, feedback.rating, feedback.comment, feedback.isAnonymous);
      addToast('Feedback submitted!', 'success');
      setExistingFeedback(res.data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmittingFB(false);
    }
  };

  if (loading) return <div className="flex-center" style={{ padding: '6rem' }}><div className="spinner" style={{ width: 48, height: 48 }} /></div>;
  if (!data || !data.event) return <div className="flex-center"><p>Registration not found.</p></div>;

  const { event, isPresent } = data;
  const isPast = isPastEvent(event.date);

  return (
    <div className="page-wrapper fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <Link to="/student/registrations" className="back-link">
        <ArrowLeft size={16} /> Back to My Registrations
      </Link>

      {/* Header Card */}
      <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem', background: 'var(--bg-lighter)', borderTop: '4px solid var(--accent)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.5rem', color: 'var(--text-color)' }}>{event.title}</h1>
            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CalendarDays size={14}/> {new Date(event.date).toLocaleDateString()}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={14}/> {event.time}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={14}/> {event.venue}</span>
            </div>
          </div>
          <span className={`badge ${data.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>
            {data.status ? data.status.toUpperCase() : 'UNKNOWN'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* Attendance Card */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '1.5rem', width: '100%', textAlign: 'left', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Attendance & Entry</h3>
          
          {isPresent ? (
            <div style={{ padding: '2rem 1rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-lg)', width: '100%' }}>
              <CheckCircle size={48} color="var(--success)" style={{ marginBottom: '1rem' }} />
              <h2 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Checked In</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>You are securely marked as present.</p>
            </div>
          ) : !hasEventStarted(event.date, event.time) ? (
            <div style={{ padding: '2rem', background: 'var(--bg-lighter)', borderRadius: 'var(--radius-md)', width: '100%', color: 'var(--text-muted)' }}>
              <Clock size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Event hasn't started yet</h4>
              <p style={{ fontSize: '0.9rem' }}>Check-in forms will unlock securely when the event begins at {event.time}.</p>
            </div>
          ) : (
            <>
              {/* QR Code */}
              <div style={{ padding: '1rem', background: 'white', borderRadius: 'var(--radius-md)', marginBottom: '1rem', display: 'inline-block' }}>
                <QRCodeSVG value={data.qrCode || 'NO-QR-CODE'} size={150} level="H" />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Show this QR to the Organizer at the entrance.
              </p>
              
              <div style={{ width: '100%', position: 'relative', marginBottom: '1.5rem' }}>
                <hr style={{ borderColor: 'var(--border-color)'}} />
                <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--card-bg)', padding: '0 0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)'}}>OR</span>
              </div>

              {/* Self Check-In Form */}
              <form onSubmit={handleCheckIn} style={{ width: '100%' }}>
                <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-color)', textAlign: 'left' }}>Self Check-In Code</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="ENTER CODE" 
                    maxLength={6}
                    value={attCode}
                    onChange={(e) => setAttCode(e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.2rem', fontWeight: 'bold' }}
                  />
                  <button type="submit" className="btn btn-primary" disabled={checkingIn || attCode.length !== 6}>
                    {checkingIn ? '...' : 'Verify'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Resources Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Shared Resources</h3>
          
          {(!event.resources || event.resources.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
              <Info size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
              <p style={{ fontSize: '0.9rem' }}>No resources exported for this event yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {event.resources.map((res, i) => (
                <a 
                  key={i} 
                  href={res.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ justifyContent: 'space-between', padding: '1rem', textDecoration: 'none' }}
                >
                  <span style={{ fontWeight: 500, color: 'var(--text-color)' }}>{res.title}</span>
                  <Download size={16} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feedback Card */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Event Ratings & Feedback</h3>
        
        {existingFeedback ? (
          <div style={{ background: 'var(--bg-lighter)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={18} fill={s <= existingFeedback.rating ? 'var(--warning)' : 'transparent'} color={s <= existingFeedback.rating ? 'var(--warning)' : 'var(--text-muted)'} />
              ))}
            </div>
            <p style={{ color: 'var(--text-color)', fontStyle: 'italic' }}>"{existingFeedback.comment}"</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
              Posted {existingFeedback.isAnonymous ? 'Anonymously' : 'Publicly'} on {new Date(existingFeedback.createdAt).toLocaleDateString()}
            </p>
          </div>
        ) : !isPast ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-lighter)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '0.9rem' }}>Feedback will unlock after the event date has passed.</p>
          </div>
        ) : (
          <form onSubmit={handleFeedbackSubmit}>
            <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Overall Rating</p>
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}
                  onClick={() => setFeedback({ ...feedback, rating: s })}
                >
                  <Star size={32} fill={s <= feedback.rating ? 'var(--warning)' : 'transparent'} color={s <= feedback.rating ? 'var(--warning)' : 'var(--text-muted)'} />
                </button>
              ))}
            </div>
            <div className="form-group">
              <label className="form-label">Tell us what you thought (optional)</label>
              <textarea 
                className="form-input" 
                rows="3" 
                placeholder="Share your experience..."
                onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                id="anon"
                onChange={(e) => setFeedback({ ...feedback, isAnonymous: e.target.checked })}
              />
              <label htmlFor="anon" style={{ fontSize: '0.9rem' }}>Post anonymously</label>
            </div>
            <button type="submit" className="btn btn-primary mt-2" disabled={submittingFB}>
              {submittingFB ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        )}
      </div>

    </div>
  );
}

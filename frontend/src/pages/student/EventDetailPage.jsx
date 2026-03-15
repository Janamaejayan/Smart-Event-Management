import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { getEventById, getMyRegistrations, registerForEvent } from '../../services/api';
import {
  Calendar, MapPin, Users, IndianRupee, ArrowLeft,
  CheckCircle, CreditCard, Loader2,
} from 'lucide-react';
import './EventDetailPage.css';

export default function EventDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([
      getEventById(id),
      getMyRegistrations(),
    ]).then(([evRes, myRegsRes]) => {
      setEvent(evRes.data);
      setAlreadyRegistered(myRegsRes.data.some((r) => r.eventId?._id === id || r.eventId === id));
      setLoading(false);
    }).catch(() => {
      navigate('/student/dashboard');
    });
  }, [id]);

  const validate = () => {
    const errs = {};
    (event.customFields || []).forEach((field) => {
      if (field.required && !formValues[field.label]) {
        errs[field.label] = 'This field is required';
      }
    });
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      await registerForEvent(event._id || event.id, formValues);
      setSuccess(true);
      setAlreadyRegistered(true);
      addToast('Successfully registered! 🎉', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const val = formValues[field.label] ?? '';
    const err = errors[field.label];

    const onChange = (v) => setFormValues((prev) => ({ ...prev, [field.label]: v }));

    if (field.type === 'select') {
      return (
        <div key={field.id} className="form-group">
          <label className="form-label">
            {field.label} {field.required && <span style={{ color: 'var(--danger)' }}>*</span>}
          </label>
          <select className="form-select" value={val} onChange={(e) => onChange(e.target.value)}>
            <option value="">Select an option</option>
            {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          {err && <span className="form-error">{err}</span>}
        </div>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <div key={field.id} className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              className="checkbox-input"
              checked={!!val}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span>{field.label}</span>
          </label>
        </div>
      );
    }

    return (
      <div key={field.id} className="form-group">
        <label className="form-label">
          {field.label} {field.required && <span style={{ color: 'var(--danger)' }}>*</span>}
        </label>
        <input
          type="text"
          className="form-input"
          value={val}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
        {err && <span className="form-error">{err}</span>}
      </div>
    );
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) return (
    <div className="flex-center" style={{ padding: '6rem' }}>
      <div className="spinner" style={{ width: 48, height: 48 }} />
    </div>
  );

  const isFull = event.registered >= event.capacity;

  return (
    <div className="page-wrapper fade-in">
      <Link to="/student/dashboard" className="back-link">
        <ArrowLeft size={16} /> Back to Events
      </Link>

      <div className="event-detail-layout">
        {/* Left — Event info */}
        <div className="event-info-col">
          <div className="event-detail-banner" style={{ background: event.bannerColor }} />

          <div className="event-info-card card">
            <div className="event-tags" style={{ marginBottom: '0.75rem' }}>
              {event.tags?.map((t) => <span key={t} className="badge badge-accent">{t}</span>)}
              {event.isPaid
                ? <span className="badge badge-warning"><IndianRupee size={12} />₹{event.price}</span>
                : <span className="badge badge-success">Free</span>}
            </div>
            <h1 className="event-detail-title">{event.title}</h1>
            <p className="event-detail-desc">{event.description}</p>

            <hr className="divider" />

            <div className="event-detail-meta">
              <div className="meta-item">
                <Calendar size={18} />
                <div>
                  <span className="meta-label">Date & Time</span>
                  <span className="meta-value">{formatDate(event.date)} at {event.time}</span>
                </div>
              </div>
              <div className="meta-item">
                <MapPin size={18} />
                <div>
                  <span className="meta-label">Venue</span>
                  <span className="meta-value">{event.venue}</span>
                </div>
              </div>
              <div className="meta-item">
                <Users size={18} />
                <div>
                  <span className="meta-label">Capacity</span>
                  <span className="meta-value">{event.registered} / {event.capacity} registered</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Registration */}
        <div className="event-reg-col">
          {alreadyRegistered || success ? (
            <div className="card registered-card">
              <CheckCircle size={40} style={{ color: 'var(--success)', marginBottom: '0.75rem' }} />
              <h3>You're registered!</h3>
              <p>Check your registrations page to see your QR code and event details.</p>
              <Link to="/student/my-registrations" className="btn btn-primary btn-full mt-2">
                View My Registrations
              </Link>
            </div>
          ) : isFull ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <h3 style={{ color: 'var(--danger)' }}>Event Full</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>No more spots available.</p>
            </div>
          ) : (
            <div className="card">
              <h2 className="reg-form-title">Register for this event</h2>
              {event.isPaid && (
                <div className="alert alert-warning mb-2">
                  <CreditCard size={16} />
                  <div>
                    <strong>Paid event — ₹{event.price}</strong><br />
                    <span style={{ fontSize: '0.8rem' }}>Payment gateway integration coming soon. Registration confirmed automatically for now.</span>
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmit} noValidate>
                {(event.customFields || []).map(renderField)}
                <button
                  type="submit"
                  className="btn btn-primary btn-full btn-lg mt-2"
                  disabled={submitting}
                >
                  {submitting
                    ? <><Loader2 size={18} className="spin-icon" /> Registering…</>
                    : 'Complete Registration'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

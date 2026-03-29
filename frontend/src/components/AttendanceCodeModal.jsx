import { useState } from 'react';
import { useToast } from './Toast';
import { selfCheckin } from '../services/api';
import { X, Check } from 'lucide-react';
import './FeedbackModal.css';

export default function AttendanceCodeModal({ registration, onClose, onSuccess }) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim() || code.length !== 6) {
      return addToast('Please enter the 6-character code', 'error');
    }
    setSubmitting(true);
    try {
      await selfCheckin(registration.event._id || registration.event.id, code);
      addToast('Self check-in successful!', 'success');
      onSuccess();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content fade-in card" style={{ maxWidth: 400 }}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        <h2 style={{ marginBottom: '0.5rem' }}>Mark Attendance</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Enter the 6-character attendance code provided by the organizer for <strong>{registration.event.title}</strong>.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              className="form-input"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. A9XB8F"
              maxLength={6}
              style={{ fontSize: '1.5rem', letterSpacing: '0.5rem', textAlign: 'center', textTransform: 'uppercase', fontWeight: 'bold' }}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full mt-2" disabled={submitting}>
            {submitting ? 'Verifying...' : <><Check size={16} /> Submit Code</>}
          </button>
        </form>
      </div>
    </div>
  );
}

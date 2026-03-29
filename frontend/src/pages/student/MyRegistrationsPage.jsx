import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyRegistrations } from '../../services/api';
import { Calendar, MapPin, CheckCircle, Clock } from 'lucide-react';
import './MyRegistrationsPage.css';

export default function MyRegistrationsPage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyRegistrations().then((res) => {
      const regs = res.data.map((r) => ({ ...r, event: r.eventId }));
      setRegistrations(regs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

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
          <h1 className="section-title">My Registrations</h1>
          <p className="section-subtitle">Events you've signed up for</p>
        </div>
      </div>

      {registrations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Calendar size={48} /></div>
          <h3>No registrations yet</h3>
          <p>Browse events and register for ones you're interested in.</p>
        </div>
      ) : (
        <div className="reg-list">
          {registrations.map((reg) => (
            <div key={reg.id} className="reg-card card fade-in">
              <div
                className="reg-banner-strip"
                style={{ background: 'var(--accent)' }}
              />

              <div className="reg-card-body">
                <div className="reg-card-main">
                  <div>
                    <h3 className="reg-event-title">{reg.event?.title}</h3>
                    <div className="reg-meta">
                      <span><Calendar size={13} />{formatDate(reg.event?.date)}</span>
                      <span><MapPin size={13} />{reg.event?.venue}</span>
                      <span><Clock size={13} />Registered {new Date(reg.registeredAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="reg-card-right">
                    <span className={`badge ${reg.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>
                      {reg.status === 'confirmed' && <CheckCircle size={11} />}
                      {reg.status}
                    </span>
                    
                    <Link
                      to={`/student/workspace/${reg._id || reg.id}`}
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}
                    >
                      Enter Event Workspace
                    </Link>
                  </div>
                </div>

                {reg.formData && Object.keys(reg.formData).length > 0 && (
                  <div className="form-data-section">
                    <p className="form-data-label">Registration details</p>
                    <div className="form-data-grid">
                      {Object.entries(reg.formData).map(([key, val]) => (
                        <div key={key} className="form-data-item">
                          <span className="form-data-key">{key}</span>
                          <span className="form-data-val">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

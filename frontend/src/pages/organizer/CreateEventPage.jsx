import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { createEvent, uploadFile } from '../../services/api';
import {
  Plus, Trash2, ChevronRight, ChevronLeft, Check,
  Type, List, CheckSquare, IndianRupee, Eye, UploadCloud
} from 'lucide-react';
import './CreateEventPage.css';

const STEPS = ['Basic Info', 'Custom Fields', 'Settings', 'Preview'];

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input', icon: <Type size={16} /> },
  { value: 'select', label: 'Dropdown', icon: <List size={16} /> },
  { value: 'checkbox', label: 'Checkbox', icon: <CheckSquare size={16} /> },
];

// Banner colors removed

export default function CreateEventPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [info, setInfo] = useState({
    title: '', description: '', date: '', time: '',
    endDate: '', endTime: '', deadlineDate: '', deadlineTime: '',
    venue: '', capacity: 100, tags: '',
    isPaid: false,
    price: '',
    resources: [], // Array of { title, url, file, uploading }
  });

  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState({ label: '', type: 'text', options: '', required: false });

  // ── Step renderers (called as functions, NOT as <Components />, to prevent
  //    React unmounting inputs on every re-render which causes focus loss) ──

  const renderInfoStep = () => (
    <div>
      <div className="grid-2">
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Event Title *</label>
          <input className="form-input" value={info.title} onChange={(e) => setInfo({ ...info, title: e.target.value })} placeholder="Eg: Tech Summit 2026" />
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Description *</label>
          <textarea className="form-textarea" value={info.description} onChange={(e) => setInfo({ ...info, description: e.target.value })} placeholder="Describe your event…" />
        </div>
        <div className="form-group">
          <label className="form-label">Start Date *</label>
          <input type="date" className="form-input" value={info.date} onChange={(e) => setInfo({ ...info, date: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Start Time *</label>
          <input type="time" className="form-input" value={info.time} onChange={(e) => setInfo({ ...info, time: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">End Date *</label>
          <input type="date" className="form-input" value={info.endDate} onChange={(e) => setInfo({ ...info, endDate: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">End Time *</label>
          <input type="time" className="form-input" value={info.endTime} onChange={(e) => setInfo({ ...info, endTime: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Registration Deadline Date *</label>
          <input type="date" className="form-input" value={info.deadlineDate} onChange={(e) => setInfo({ ...info, deadlineDate: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Registration Deadline Time *</label>
          <input type="time" className="form-input" value={info.deadlineTime} onChange={(e) => setInfo({ ...info, deadlineTime: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Venue *</label>
          <input className="form-input" value={info.venue} onChange={(e) => setInfo({ ...info, venue: e.target.value })} placeholder="Eg: Main Auditorium" />
        </div>
        <div className="form-group">
          <label className="form-label">Capacity *</label>
          <input type="number" className="form-input" value={info.capacity} min={1} onChange={(e) => setInfo({ ...info, capacity: parseInt(e.target.value) || 1 })} />
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Tags (comma-separated)</label>
          <input className="form-input" value={info.tags} onChange={(e) => setInfo({ ...info, tags: e.target.value })} placeholder="Technology, Networking, Hackathon" />
        </div>
      </div>
    </div>
  );

  // ── Step 2: Custom Fields ──
  const addField = () => {
    if (!newField.label.trim()) return;
    const options = newField.type === 'select'
      ? newField.options.split(',').map((o) => o.trim()).filter(Boolean)
      : [];
    setFields([...fields, { id: `cf${Date.now()}`, ...newField, options }]);
    setNewField({ label: '', type: 'text', options: '', required: false });
  };

  const removeField = (id) => setFields(fields.filter((f) => f.id !== id));

  const renderFieldsStep = () => (
    <div>
      <p className="step-desc">Add custom fields that registrants must fill in.</p>

      {/* Existing fields */}
      {fields.length > 0 && (
        <div className="field-list">
          {fields.map((f) => (
            <div key={f.id} className="field-item">
              <div className="field-item-info">
                <span className="field-type-icon">
                  {FIELD_TYPES.find((t) => t.value === f.type)?.icon}
                </span>
                <div>
                  <span className="field-label">{f.label}</span>
                  <span className="field-meta">
                    {f.type}{f.required ? ' · Required' : ' · Optional'}
                    {f.type === 'select' && ` · ${f.options.join(', ')}`}
                  </span>
                </div>
              </div>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeField(f.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new field UI */}
      <div className="add-field-card card">
        <h4 className="add-field-title">Add a Field</h4>
        <div className="grid-2">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Field Label</label>
            <input className="form-input" value={newField.label} onChange={(e) => setNewField({ ...newField, label: e.target.value })} placeholder="Eg: Year of Study" />
          </div>
          <div className="form-group">
            <label className="form-label">Field Type</label>
            <select className="form-select" value={newField.type} onChange={(e) => setNewField({ ...newField, type: e.target.value })}>
              {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {newField.type === 'select' && (
            <div className="form-group">
              <label className="form-label">Options (comma-separated)</label>
              <input className="form-input" value={newField.options} onChange={(e) => setNewField({ ...newField, options: e.target.value })} placeholder="Option 1, Option 2, Option 3" />
            </div>
          )}
          <div className="form-group" style={{ justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: '0.6rem' }}>
            <label className="checkbox-label" style={{ cursor: 'pointer' }}>
              <input type="checkbox" className="checkbox-input" checked={newField.required} onChange={(e) => setNewField({ ...newField, required: e.target.checked })} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Required</span>
            </label>
          </div>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={addField} disabled={!newField.label.trim()}>
          <Plus size={15} /> Add Field
        </button>
      </div>
    </div>
  );

  // ── Step 3: Settings ──
  const addResource = () => {
    setInfo((prev) => ({ ...prev, resources: [...prev.resources, { title: '', url: '', file: null, uploading: false }] }));
  };

  const removeResource = (index) => {
    setInfo((prev) => ({ ...prev, resources: prev.resources.filter((_, i) => i !== index) }));
  };

  const updateResource = (index, field, value) => {
    setInfo((prev) => {
      const updated = [...prev.resources];
      updated[index][field] = value;
      return { ...prev, resources: updated };
    });
  };

  const handleFileUpload = async (index, file) => {
    if (!file) return;
    
    updateResource(index, 'file', file.name);
    updateResource(index, 'uploading', true);
    
    try {
      const res = await uploadFile(file);
      updateResource(index, 'url', res.data.url);
      addToast('File uploaded successfully to Cloudinary', 'success');
    } catch (err) {
      addToast(err.message, 'error');
      updateResource(index, 'file', null);
    } finally {
      updateResource(index, 'uploading', false);
    }
  };

  const renderSettingsStep = () => (
    <div className="fade-in">
      <div className="settings-section">
        <div className="settings-row card">
          <div>
            <h4>Paid Event</h4>
            <p>Enable ticket pricing for this event</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={info.isPaid} onChange={(e) => setInfo({ ...info, isPaid: e.target.checked })} />
            <span className="switch-track" />
          </label>
        </div>

        {info.isPaid && (
          <div className="payment-placeholder card fade-in">
            <div className="payment-placeholder-icon"><IndianRupee size={28} /></div>
            <h4>Payment Gateway</h4>
            <p>Set the ticket price below. Payment integration (Razorpay / Stripe) will be added in a future update.</p>
            <div className="form-group mt-2" style={{ maxWidth: 200 }}>
              <label className="form-label">Ticket Price (₹)</label>
              <input type="number" className="form-input" value={info.price} min={0} onChange={(e) => setInfo({ ...info, price: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="alert alert-info mt-2">
              <span>💡 For now, registrations will be confirmed automatically regardless of payment.</span>
            </div>
          </div>
        )}

        <div className="settings-row card mt-2">
          <div>
            <h4>Resources</h4>
            <p>Add links or documents for attendees</p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addResource}><Plus size={14} /> Add</button>
        </div>
        {info.resources.map((r, i) => (
          <div key={i} className="card mt-1" style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem', alignItems: 'center' }}>
            <input className="form-input" placeholder="Resource Title" value={r.title} onChange={(e) => updateResource(i, 'title', e.target.value)} style={{ flex: 1 }} />
            {r.uploading ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Uploading...</span>
            ) : r.url ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Uploaded!</span>
            ) : (
              <input type="file" onChange={(e) => handleFileUpload(i, e.target.files[0])} style={{ width: '150px', fontSize: '0.8rem' }} />
            )}
            <button type="button" className="btn btn-danger btn-sm" onClick={() => removeResource(i)} disabled={r.uploading}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div>
      <div className="card mt-2" style={{ padding: '1.5rem' }}>
        <div className="event-tags mb-1">
          {info.tags.split(',').filter(Boolean).map((t) => (
            <span key={t} className="badge badge-accent">{t.trim()}</span>
          ))}
          {info.isPaid
            ? <span className="badge badge-warning">₹{info.price}</span>
            : <span className="badge badge-success">Free</span>}
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{info.title || '(No title)'}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.6' }}>{info.description}</p>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <span>⏳ Starts: {info.date} {info.time}</span>
          <span>🏁 Ends: {info.endDate} {info.endTime}</span>
          <span>⚠️ Deadline: {info.deadlineDate} {info.deadlineTime}</span>
          <span>📍 {info.venue}</span>
          <span>👥 Capacity: {info.capacity}</span>
        </div>
        {fields.length > 0 && (
          <>
            <hr className="divider" />
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Registration Fields</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {fields.map((f) => (
                <div key={f.id} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--accent-light)' }}>{f.type === 'checkbox' ? '☑' : f.type === 'select' ? '▾' : '_'}</span>
                  <span>{f.label} {f.required && <span style={{ color: 'var(--danger)' }}>*</span>}</span>
                </div>
              ))}
            </div>
          </>
        )}
        {info.resources.length > 0 && info.resources.some(r => r.title && r.url) && (
          <div style={{ marginTop: '1.5rem', background: 'var(--bg-lighter)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)', fontSize: '0.95rem' }}>Attached Resources ({info.resources.filter(r => r.title && r.url).length})</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {info.resources.filter(r => r.title && r.url).map((r, i) => (
                <li key={i} style={{ marginBottom: '0.25rem' }}>📄 {r.title}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  // Map step index → render function (called directly, NOT as JSX components)
  const renderStep = () => [renderInfoStep, renderFieldsStep, renderSettingsStep, renderPreviewStep][step]();

  const canNext = () => {
    if (step === 0) return info.title && info.description && info.date && info.time && info.endDate && info.endTime && info.deadlineDate && info.deadlineTime && info.venue && info.capacity;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const tags = info.tags.split(',').map((t) => t.trim()).filter(Boolean);
      const eventData = {
        ...info,
        tags,
        customFields: fields,
        capacity: Number(info.capacity),
        price: Number(info.price),
        resources: info.resources.filter(r => r.title.trim() && r.url.trim()).map(r => ({ title: r.title, url: r.url })),
      };
      await createEvent(eventData);
      addToast('Event created successfully! 🎉', 'success');
      navigate('/organizer/events');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper fade-in">
      <div className="create-event-wrap">
        <div className="section-header">
          <div>
            <h1 className="section-title">Create New Event</h1>
            <p className="section-subtitle">Fill in the details step by step</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="step-indicator">
          {STEPS.map((s, i) => (
            <div key={s} className="step" style={{ flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <button
                type="button"
                className={`step-dot ${i < step ? 'done' : i === step ? 'active' : ''}`}
                onClick={() => i < step && setStep(i)}
                style={{ cursor: i < step ? 'pointer' : 'default' }}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </button>
              <span className={`step-label ${i === step ? 'active' : ''} hide-mobile`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`step-line ${i < step ? 'done' : ''}`} style={{ flex: 1 }} />}
            </div>
          ))}
        </div>

        {/* Step content — rendered as plain JSX, not as a <Component />, to prevent
             focus loss caused by React unmounting on re-render */}
        <div className="card step-card">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="step-nav">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
          >
            <ChevronLeft size={16} /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting || !info.title}
            >
              {submitting ? 'Publishing…' : <><Check size={16} /> Publish Event</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

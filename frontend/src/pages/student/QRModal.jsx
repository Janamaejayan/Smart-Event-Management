import { useEffect, useRef } from 'react';
import { X, QrCode, Calendar, MapPin } from 'lucide-react';
import './QRModal.css';

// Simple QR visual using a grid pattern based on the code string
function SimpleQR({ code }) {
  const size = 10;
  // Generate a deterministic grid from the code string
  const cells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const charCode = code.charCodeAt((r * size + c) % code.length);
      const filled = (charCode + r + c) % 3 !== 0;
      // Always fill border
      const border = r === 0 || r === size - 1 || c === 0 || c === size - 1;
      // Corner markers
      const corner =
        (r < 3 && c < 3) || (r < 3 && c > size - 4) || (r > size - 4 && c < 3);
      cells.push(
        <div
          key={`${r}-${c}`}
          className={`qr-cell ${border || corner || filled ? 'qr-filled' : ''}`}
        />
      );
    }
  }
  return <div className="qr-grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>{cells}</div>;
}

export default function QRModal({ registration, onClose }) {
  const overlayRef = useRef(null);
  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="modal-card fade-in">
        <div className="modal-header">
          <div className="flex gap-1" style={{ alignItems: 'center' }}>
            <QrCode size={20} style={{ color: 'var(--accent-light)' }} />
            <span className="modal-title">Your Check-In QR Code</span>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="qr-wrapper">
            <SimpleQR code={registration.qrCode} />
            <p className="qr-code-text">{registration.qrCode}</p>
          </div>

          <div className="modal-event-info">
            <h3 className="modal-event-title">{registration.event?.title}</h3>
            <div className="modal-meta">
              <span><Calendar size={14} />{formatDate(registration.event?.date)}</span>
              <span><MapPin size={14} />{registration.event?.venue}</span>
            </div>
            <p className="qr-hint">
              Show this code to the event organizer at the entrance for check-in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

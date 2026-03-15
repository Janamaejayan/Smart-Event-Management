import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import {
  getEventById,
  getEventAttendance,
  markAttendance,
  checkinByQR,
} from '../../services/api';
import {
  ArrowLeft, QrCode, Users, CheckCircle, XCircle,
  Download, Camera, CameraOff, Search,
} from 'lucide-react';
import './EventAttendeesPage.css';

// ─── QR Scanner Component ─────────────────────────────────────────────────────
function QRScannerPanel({ eventId, onCheckin }) {
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanStatus, setScanStatus] = useState(null); // {type, message}
  const { addToast } = useToast();

  const startScanner = async () => {
    if (!window.Html5Qrcode) {
      // Dynamically available via html5-qrcode package
      addToast('QR scanner module not loaded.', 'error');
      return;
    }
    setScanStatus(null);
    try {
      html5QrRef.current = new window.Html5Qrcode('qr-reader');
      await html5QrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decoded) => {
          await stopScanner();
          await processQR(decoded);
        },
        () => {}
      );
      setScanning(true);
    } catch (err) {
      addToast('Camera access denied or unavailable.', 'error');
    }
  };

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop(); } catch {}
      html5QrRef.current = null;
    }
    setScanning(false);
  };

  const processQR = async (code) => {
    try {
      const res = await checkinByQR(code, eventId);
      setScanStatus({ type: 'success', message: `✅  ${res.data.studentName} checked in!` });
      onCheckin(res.data);
      addToast(`${res.data.studentName} checked in successfully!`, 'success');
    } catch (err) {
      setScanStatus({ type: 'error', message: `❌  ${err.message}` });
      addToast(err.message, 'error');
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await processQR(manualCode.trim());
    setManualCode('');
  };

  useEffect(() => () => { stopScanner(); }, []);

  return (
    <div className="scanner-panel card">
      <div className="scanner-header">
        <QrCode size={20} style={{ color: 'var(--accent-light)' }} />
        <h3>QR Check-In Scanner</h3>
      </div>

      {/* Camera */}
      <div className="qr-reader-wrap">
        <div id="qr-reader" style={{ width: '100%' }} />
        {!scanning && (
          <div className="qr-reader-placeholder">
            <Camera size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
            <p>Camera off</p>
          </div>
        )}
      </div>

      <div className="scanner-actions">
        {scanning ? (
          <button className="btn btn-danger btn-full" onClick={stopScanner}>
            <CameraOff size={16} /> Stop Scanner
          </button>
        ) : (
          <button className="btn btn-primary btn-full" onClick={startScanner}>
            <Camera size={16} /> Start Camera Scanner
          </button>
        )}
      </div>

      <div className="scanner-divider"><span>or enter manually</span></div>

      {/* Manual entry */}
      <form onSubmit={handleManualSubmit} className="manual-entry">
        <input
          className="form-input"
          placeholder="Paste QR code text…"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
        />
        <button type="submit" className="btn btn-secondary" disabled={!manualCode.trim()}>
          <Search size={15} /> Check In
        </button>
      </form>

      {scanStatus && (
        <div className={`scan-status ${scanStatus.type}`}>{scanStatus.message}</div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EventAttendeesPage() {
  const { id } = useParams();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([getEventById(id), getEventAttendance(id)]).then(([evRes, attRes]) => {
      setEvent(evRes.data);
      setAttendance(attRes.data);
      setLoading(false);
    });
  }, [id]);

  const handleToggle = async (record) => {
    try {
      const res = await markAttendance(record.id || record._id, !record.present);
      setAttendance((prev) =>
        prev.map((a) => (a.id === record.id || a._id === record._id ? { ...a, ...res.data } : a))
      );
      addToast(
        `${record.studentName} marked as ${res.data.present ? 'present' : 'absent'}.`,
        res.data.present ? 'success' : 'info'
      );
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleCheckinFromQR = (result) => {
    setAttendance((prev) =>
      prev.map((a) => (a.studentId === result.studentId ? { ...a, ...result } : a))
    );
  };

  const exportCSV = () => {
    const rows = [
      ['Name', 'Student ID', 'Present', 'Checked In At'],
      ...attendance.map((a) => [
        a.studentName,
        a.studentId,
        a.present ? 'Yes' : 'No',
        a.checkedInAt ? new Date(a.checkedInAt).toLocaleString('en-IN') : '-',
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${event?.title || id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = attendance.filter((a) =>
    a.studentName?.toLowerCase().includes(search.toLowerCase())
  );

  const presentCount = attendance.filter((a) => a.present).length;

  if (loading) return (
    <div className="flex-center" style={{ padding: '6rem' }}>
      <div className="spinner" style={{ width: 48, height: 48 }} />
    </div>
  );

  return (
    <div className="page-wrapper fade-in">
      <Link to="/organizer/events" className="back-link">
        <ArrowLeft size={16} /> Back to Events
      </Link>

      <div className="section-header">
        <div>
          <h1 className="section-title">{event?.title}</h1>
          <p className="section-subtitle">Attendance Sheet</p>
        </div>
        <button className="btn btn-secondary" onClick={exportCSV}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Stats row */}
      <div className="attendance-stats">
        <div className="att-stat">
          <span className="att-stat-value">{attendance.length}</span>
          <span className="att-stat-label">Registered</span>
        </div>
        <div className="att-stat present">
          <span className="att-stat-value">{presentCount}</span>
          <span className="att-stat-label">Present</span>
        </div>
        <div className="att-stat absent">
          <span className="att-stat-value">{attendance.length - presentCount}</span>
          <span className="att-stat-label">Absent</span>
        </div>
        <div className="att-stat">
          <span className="att-stat-value">
            {attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0}%
          </span>
          <span className="att-stat-label">Attendance Rate</span>
        </div>
      </div>

      <div className="attendees-layout">
        {/* Attendance table */}
        <div className="attendees-table-col">
          {/* Search */}
          <div className="search-wrap mb-2" style={{ maxWidth: 360 }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search attendees…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Users size={40} /></div>
              <h3>No attendees yet</h3>
              <p>Registrations will appear here automatically.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student Name</th>
                    <th>Status</th>
                    <th>Checked In At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((record, idx) => (
                    <tr key={record.id}>
                      <td>{idx + 1}</td>
                      <td>{record.studentName}</td>
                      <td>
                        {record.present ? (
                          <span className="badge badge-success">
                            <CheckCircle size={11} /> Present
                          </span>
                        ) : (
                          <span className="badge badge-danger">
                            <XCircle size={11} /> Absent
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {record.checkedInAt
                          ? new Date(record.checkedInAt).toLocaleTimeString('en-IN')
                          : '—'}
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${record.present ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => handleToggle(record)}
                        >
                          {record.present ? 'Mark Absent' : 'Mark Present'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* QR Scanner */}
        <div className="scanner-col">
          <QRScannerPanel eventId={id} onCheckin={handleCheckinFromQR} />
        </div>
      </div>
    </div>
  );
}

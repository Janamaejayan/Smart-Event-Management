import { Link } from 'react-router-dom';
import { Calendar, Users, QrCode, ClipboardList, ArrowRight, Zap } from 'lucide-react';
import './LandingPage.css';

const features = [
  {
    icon: <Calendar size={24} />,
    title: 'Smart Event Creation',
    desc: 'Organizers build events with custom registration fields, capacity limits, and flexible settings in minutes.',
    color: 'purple',
  },
  {
    icon: <ClipboardList size={24} />,
    title: 'Dynamic Registration Forms',
    desc: 'Every event has a tailored registration form — add text fields, dropdowns, checkboxes and more.',
    color: 'blue',
  },
  {
    icon: <QrCode size={24} />,
    title: 'QR Code Attendance',
    desc: 'Students check in with their personal QR code. Organizers confirm attendance in real time.',
    color: 'green',
  },
  {
    icon: <Users size={24} />,
    title: 'Attendance Sheets',
    desc: 'Live attendee list with present/absent status and one-click CSV export for organizers.',
    color: 'yellow',
  },
];

export default function LandingPage() {
  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-content">
          <div className="hero-pill">
            <Zap size={13} /> Smart Campus Event Management
          </div>
          <h1 className="hero-title">
            Events That Actually <span className="gradient-text">Work</span>
          </h1>
          <p className="hero-subtitle">
            One platform for organizers to create, and students to discover, register, and attend campus events — seamlessly.
          </p>
          <div className="hero-ctas">
            <Link to="/register" className="btn btn-primary btn-lg">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Sign In
            </Link>
          </div>

          <div className="hero-demo-creds">
            <span>🔑 Demo:</span>
            <code>student@demo.com</code> or <code>organizer@demo.com</code>
            <span>— password: <code>demo123</code></span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section container">
        <div className="text-center mb-2">
          <h2 className="section-title">Everything you need</h2>
          <p className="section-subtitle" style={{ marginTop: '0.5rem' }}>
            Designed for campus communities, built for every kind of event.
          </p>
        </div>
        <div className="features-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card card">
              <div className={`stat-icon ${f.color}`} style={{ marginBottom: '1rem' }}>
                {f.icon}
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles CTA */}
      <section className="roles-section container">
        <div className="roles-grid">
          <div className="role-card organizer-card">
            <h3>I'm an Organizer</h3>
            <p>Create events, manage registrations, track attendance, and export reports.</p>
            <Link to="/register" className="btn btn-primary">Start Organizing →</Link>
          </div>
          <div className="role-card student-card">
            <h3>I'm a Student</h3>
            <p>Browse upcoming events, register instantly, and check in with your QR code.</p>
            <Link to="/register" className="btn btn-secondary">Explore Events →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

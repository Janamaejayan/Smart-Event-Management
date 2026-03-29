import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { getEventAnalytics, getOrgAnalyticsOverview, getMyOrgEvents } from '../../services/api';
import {
  ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import {
  ArrowLeft, BarChart2, Users, Calendar, TrendingUp,
  Target, CheckCircle, DollarSign, Activity,
} from 'lucide-react';
import './EventAnalyticsPage.css';

// ─── Custom Pie label ─────────────────────────────────────────────────────────
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, value, percent }) => {
  if (value === 0) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#f1f5f9" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label && <p className="tooltip-label">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill || '#a78bfa' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, color }) {
  return (
    <div className={`kpi-card kpi-${color}`}>
      <div className="kpi-icon">{icon}</div>
      <div>
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Per-Event Analytics View ─────────────────────────────────────────────────
function EventView({ eventId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    getEventAnalytics(eventId)
      .then((res) => { setData(res.data); setLoading(false); })
      .catch((err) => { addToast(err.message, 'error'); setLoading(false); });
  }, [eventId]);

  if (loading) return (
    <div className="flex-center" style={{ padding: '6rem' }}>
      <div className="spinner" style={{ width: 48, height: 48 }} />
    </div>
  );
  if (!data) return null;

  const { event, kpis, attendanceBreakdown, paymentBreakdown, regOverTime, checkinTimeline } = data;

  return (
    <>
      {/* Event meta */}
      <div className="analytics-event-meta">
        <div>
          <h1 className="section-title">{event.title}</h1>
          <p className="section-subtitle">{event.venue} · {event.date}</p>
        </div>
        <span className={`badge ${event.status === 'published' ? 'badge-success' : 'badge-muted'}`}>
          {event.status}
        </span>
      </div>

      {/* KPI row */}
      <div className="kpi-grid">
        <KpiCard label="Registered" value={kpis.registered} sub={`of ${kpis.capacity} seats`} icon={<Users size={20} />} color="purple" />
        <KpiCard label="Capacity Fill" value={`${kpis.fillPct}%`} sub={kpis.fillPct >= 100 ? 'Fully booked! 🎉' : `${kpis.capacity - kpis.registered} seats left`} icon={<Target size={20} />} color="blue" />
        <KpiCard label="Present" value={kpis.presentCount} sub={`${kpis.attendanceRate}% attendance rate`} icon={<CheckCircle size={20} />} color="green" />
        <KpiCard label="Absent" value={kpis.absentCount} sub="Did not attend" icon={<Activity size={20} />} color="red" />
      </div>

      {/* Charts — row 1 */}
      <div className="charts-grid-2">
        {/* Attendance donut */}
        <div className="chart-card">
          <h3 className="chart-title">Attendance Breakdown</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={attendanceBreakdown} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={3} dataKey="value" labelLine={false} label={renderCustomLabel}>
                {attendanceBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Payment breakdown donut */}
        <div className="chart-card">
          <h3 className="chart-title">Payment Status</h3>
          {!event.isPaid ? (
            <div className="chart-empty">
              <DollarSign size={32} />
              <p>This is a free event</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={paymentBreakdown} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={3} dataKey="value" labelLine={false} label={renderCustomLabel}>
                  {paymentBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Registrations over time */}
      <div className="chart-card chart-wide">
        <h3 className="chart-title">Registrations Over Time</h3>
        {regOverTime.length === 0 ? (
          <div className="chart-empty"><Calendar size={32} /><p>No registrations yet</p></div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={regOverTime} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="cumGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
              <Area type="monotone" dataKey="count" name="Daily Registrations" stroke="#8b5cf6" strokeWidth={2} fill="url(#regGradient)" dot={{ fill: '#8b5cf6', r: 3 }} />
              <Area type="monotone" dataKey="cumulative" name="Total Registrations" stroke="#3b82f6" strokeWidth={2} fill="url(#cumGradient)" dot={{ fill: '#3b82f6', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Check-in timeline */}
      <div className="chart-card chart-wide">
        <h3 className="chart-title">Check-In Timeline (by hour)</h3>
        {checkinTimeline.length === 0 ? (
          <div className="chart-empty"><TrendingUp size={32} /><p>No check-ins recorded yet</p></div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={checkinTimeline} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="checkins" name="Check-Ins" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  );
}

// ─── Overview Analytics View ──────────────────────────────────────────────────
function OverviewView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    getOrgAnalyticsOverview()
      .then((res) => { setData(res.data); setLoading(false); })
      .catch((err) => { addToast(err.message, 'error'); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex-center" style={{ padding: '6rem' }}>
      <div className="spinner" style={{ width: 48, height: 48 }} />
    </div>
  );
  if (!data) return null;

  const { totalEvents, totalRegistrations, attendanceRate, statusBreakdown, fillRates, regPerEvent } = data;

  return (
    <>
      <div className="analytics-event-meta">
        <div>
          <h1 className="section-title">Analytics Overview</h1>
          <p className="section-subtitle">Platform-wide stats across all your events</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <KpiCard label="Total Events" value={totalEvents} icon={<Calendar size={20} />} color="purple" />
        <KpiCard label="Total Registrations" value={totalRegistrations} icon={<Users size={20} />} color="blue" />
        <KpiCard label="Avg. Attendance Rate" value={`${attendanceRate}%`} icon={<CheckCircle size={20} />} color="green" />
        <KpiCard label="Published Events" value={statusBreakdown.find(s => s.name === 'Published')?.value ?? 0} icon={<Activity size={20} />} color="yellow" />
      </div>

      {/* Charts row */}
      <div className="charts-grid-2">
        {/* Event status donut */}
        <div className="chart-card">
          <h3 className="chart-title">Events by Status</h3>
          {totalEvents === 0 ? (
            <div className="chart-empty"><Calendar size={32} /><p>No events yet</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusBreakdown.filter(s => s.value > 0)} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={3} dataKey="value" labelLine={false} label={renderCustomLabel}>
                  {statusBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Registrations per event */}
        <div className="chart-card">
          <h3 className="chart-title">Registrations per Event</h3>
          {regPerEvent.length === 0 ? (
            <div className="chart-empty"><Users size={32} /><p>No events yet</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={regPerEvent} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="registrations" name="Registrations" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Fill rate bar chart */}
      <div className="chart-card chart-wide">
        <h3 className="chart-title">Capacity Fill Rate per Event</h3>
        {fillRates.length === 0 ? (
          <div className="chart-empty"><Target size={32} /><p>No events yet</p></div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={fillRates} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
              <Bar dataKey="registered" name="Registered" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="capacity" name="Capacity" fill="rgba(139,92,246,0.2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EventAnalyticsPage({ overview = false }) {
  const { id } = useParams();

  return (
    <div className="page-wrapper fade-in">
      <div className="analytics-back-row">
        <Link to={overview ? '/organizer/dashboard' : '/organizer/events'} className="back-link">
          <ArrowLeft size={16} />
          {overview ? 'Back to Dashboard' : 'Back to Events'}
        </Link>
        {!overview && (
          <Link to="/organizer/analytics" className="btn btn-secondary btn-sm">
            <BarChart2 size={14} /> Overview
          </Link>
        )}
      </div>

      {overview ? <OverviewView /> : <EventView eventId={id} />}
    </div>
  );
}

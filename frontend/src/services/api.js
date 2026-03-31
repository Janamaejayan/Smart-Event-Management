/**
 * api.js — Centralized HTTP client for the EventSphere backend
 *
 * Usage: import { loginUser, getEvents, ... } from '../services/api';
 *
 * All functions throw an Error with the server's message on failure,
 * so existing catch(err) => addToast(err.message) patterns work unchanged.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── HTTP helper ──────────────────────────────────────────────────────────────
async function request(path, options = {}) {
  const token = localStorage.getItem('sem_token');

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }

  return data;
}

const get  = (path)         => request(path, { method: 'GET' });
const post = (path, body)   => request(path, { method: 'POST',   body });
const put  = (path, body)   => request(path, { method: 'PUT',    body });
const del  = (path)         => request(path, { method: 'DELETE' });

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const loginUser    = (email, password) => post('/auth/login',    { email, password });
export const registerUser = (name, email, password, role) =>
  post('/auth/register', { name, email, password, role });
export const getMe        = () => get('/auth/me');

// ─── Events ──────────────────────────────────────────────────────────────────
export const getEvents        = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/events${qs ? `?${qs}` : ''}`);
};
export const getMyOrgEvents   = ()          => get('/events/my');
export const getEventById     = (id)        => get(`/events/${id}`);
export const createEvent      = (body)      => post('/events', body);
export const updateEvent      = (id, body)  => put(`/events/${id}`, body);
export const deleteEvent      = (id)        => del(`/events/${id}`);

// ─── Registrations ────────────────────────────────────────────────────────────
export const registerForEvent    = (eventId, formData) =>
  post('/registrations', { eventId, formData });
export const getMyRegistrations  = ()           => get('/registrations/my');
export const getRegistrationById = (id)         => get(`/registrations/${id}`);
export const getEventRegistrations = (eventId)  => get(`/registrations/event/${eventId}`);
export const cancelRegistration  = (id)         => del(`/registrations/${id}`);

// ─── Attendance ───────────────────────────────────────────────────────────────
export const getEventAttendance  = (eventId)          => get(`/attendance/event/${eventId}`);
export const markAttendance      = (id, present)       => put(`/attendance/${id}`, { present });
export const checkinByQR         = (qrCode, eventId)  => post('/attendance/checkin', { qrCode, eventId });
export const selfCheckin         = (eventId, code)    => post('/attendance/self-checkin', { eventId, code });

// ─── Analytics ────────────────────────────────────────────────────────────────
export const getOrgAnalyticsOverview = ()    => get('/analytics/overview');
export const getEventAnalytics       = (id) => get(`/analytics/event/${id}`);

// ─── Feedback ────────────────────────────────────────────────────────────────
export const submitFeedback      = (eventId, rating, comment, isAnonymous) => post('/feedback', { eventId, rating, comment, isAnonymous });
export const getMyFeedback       = (eventId) => get(`/feedback/my/${eventId}`);
export const getEventFeedback    = (eventId) => get(`/feedback/event/${eventId}`);
export const getEventRatingSummary = (eventId) => get(`/feedback/event/${eventId}/summary`);

// ─── Cloudinary Upload ─────────────────────────────────────────────────────────
export const uploadFile = async (file) => {
  const token = localStorage.getItem('sem_token');
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData, // do not set Content-Type, fetch will set it with the boundary
  });
  
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || `Upload failed (${res.status})`);
  }
  return data;
};

// ─── Razorpay Verification ─────────────────────────────────────────────────────
export const verifyPayment = (paymentData) => post('/payments/verify', paymentData);

// ─── Mock Database ────────────────────────────────────────────────────────────
// Simulates MongoDB collections. Mutated in-memory (resets on refresh).

export const mockUsers = [
  {
    id: 'u1',
    name: 'Alice Organizer',
    email: 'organizer@demo.com',
    password: 'demo123',
    role: 'organizer',
    avatar: 'AO',
  },
  {
    id: 'u2',
    name: 'Bob Student',
    email: 'student@demo.com',
    password: 'demo123',
    role: 'student',
    avatar: 'BS',
  },
];

export const mockEvents = [
  {
    id: 'e1',
    organizerId: 'u1',
    title: 'Tech Summit 2026',
    description:
      'Join us for a full-day conference featuring talks on AI, Web3, and the future of software engineering. Network with industry leaders and fellow students.',
    date: '2026-04-15',
    time: '09:00',
    venue: 'Main Auditorium, Block A',
    capacity: 200,
    registered: 142,
    bannerColor: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
    tags: ['Technology', 'Networking'],
    isPaid: false,
    price: 0,
    status: 'published',
    customFields: [
      { id: 'cf1', label: 'Year of Study', type: 'select', options: ['1st Year', '2nd Year', '3rd Year', '4th Year'], required: true },
      { id: 'cf2', label: 'Department', type: 'text', required: true },
      { id: 'cf3', label: 'Do you have dietary restrictions?', type: 'checkbox', required: false },
    ],
  },
  {
    id: 'e2',
    organizerId: 'u1',
    title: 'Hackathon 2026 — BuildIt',
    description:
      '24-hour coding marathon. Form teams of up to 4, solve real-world problems, and win exciting prizes. All experience levels welcome!',
    date: '2026-05-02',
    time: '18:00',
    venue: 'Innovation Lab, Block C',
    capacity: 120,
    registered: 89,
    bannerColor: 'linear-gradient(135deg, #10b981, #3b82f6)',
    tags: ['Hackathon', 'Coding'],
    isPaid: true,
    price: 150,
    status: 'published',
    customFields: [
      { id: 'cf4', label: 'Team Name', type: 'text', required: true },
      { id: 'cf5', label: 'Team Size', type: 'select', options: ['1', '2', '3', '4'], required: true },
      { id: 'cf6', label: 'GitHub Profile URL', type: 'text', required: false },
    ],
  },
  {
    id: 'e3',
    organizerId: 'u1',
    title: 'Cultural Night — Spectrum',
    description:
      'An evening of music, dance, and art showcasing the diverse talent of our student community. Food stalls, performances, and more.',
    date: '2026-04-28',
    time: '17:00',
    venue: 'Open Air Theatre',
    capacity: 500,
    registered: 310,
    bannerColor: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    tags: ['Cultural', 'Entertainment'],
    isPaid: true,
    price: 80,
    status: 'published',
    customFields: [
      { id: 'cf7', label: 'Are you performing?', type: 'checkbox', required: false },
      { id: 'cf8', label: 'T-Shirt Size', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], required: true },
    ],
  },
];

export const mockRegistrations = [
  {
    id: 'r1',
    eventId: 'e1',
    studentId: 'u2',
    formData: { 'Year of Study': '3rd Year', Department: 'CSE', 'Do you have dietary restrictions?': false },
    paymentStatus: 'free',
    status: 'confirmed',
    registeredAt: '2026-03-10T10:30:00Z',
    qrCode: 'REG-u2-e1-QR',
  },
];

export const mockAttendance = [
  // { id, eventId, studentId, studentName, checkedInAt, present }
];

// ─── Simulated API functions ──────────────────────────────────────────────────

const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));

// AUTH
export const apiLogin = async (email, password) => {
  await delay();
  const user = mockUsers.find((u) => u.email === email && u.password === password);
  if (!user) throw new Error('Invalid credentials');
  const { password: _, ...safeUser } = user;
  return { user: safeUser, token: `mock-jwt-${user.id}` };
};

export const apiRegister = async ({ name, email, password, role }) => {
  await delay();
  if (mockUsers.find((u) => u.email === email)) throw new Error('Email already registered');
  const newUser = {
    id: `u${Date.now()}`,
    name,
    email,
    password,
    role,
    avatar: name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2),
  };
  mockUsers.push(newUser);
  const { password: _, ...safeUser } = newUser;
  return { user: safeUser, token: `mock-jwt-${newUser.id}` };
};

// EVENTS
export const apiGetEvents = async () => {
  await delay();
  return mockEvents.filter((e) => e.status === 'published');
};

export const apiGetEventById = async (id) => {
  await delay();
  const event = mockEvents.find((e) => e.id === id);
  if (!event) throw new Error('Event not found');
  return event;
};

export const apiGetOrganizerEvents = async (organizerId) => {
  await delay();
  return mockEvents.filter((e) => e.organizerId === organizerId);
};

export const apiCreateEvent = async (eventData) => {
  await delay();
  const newEvent = {
    id: `e${Date.now()}`,
    ...eventData,
    registered: 0,
    status: 'published',
    bannerColor: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
  };
  mockEvents.push(newEvent);
  return newEvent;
};

export const apiUpdateEvent = async (id, updates) => {
  await delay();
  const idx = mockEvents.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error('Event not found');
  mockEvents[idx] = { ...mockEvents[idx], ...updates };
  return mockEvents[idx];
};

export const apiDeleteEvent = async (id) => {
  await delay();
  const idx = mockEvents.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error('Event not found');
  mockEvents.splice(idx, 1);
  return { success: true };
};

// REGISTRATIONS
export const apiRegisterForEvent = async ({ eventId, studentId, studentName, formData }) => {
  await delay();
  const existing = mockRegistrations.find((r) => r.eventId === eventId && r.studentId === studentId);
  if (existing) throw new Error('Already registered for this event');
  const newReg = {
    id: `r${Date.now()}`,
    eventId,
    studentId,
    formData,
    paymentStatus: 'free',
    status: 'confirmed',
    registeredAt: new Date().toISOString(),
    qrCode: `REG-${studentId}-${eventId}-QR`,
  };
  mockRegistrations.push(newReg);
  // bump registered count
  const ev = mockEvents.find((e) => e.id === eventId);
  if (ev) ev.registered = (ev.registered || 0) + 1;
  // add to attendance sheet
  mockAttendance.push({
    id: `a${Date.now()}`,
    eventId,
    studentId,
    studentName,
    checkedInAt: null,
    present: false,
  });
  return newReg;
};

export const apiGetMyRegistrations = async (studentId) => {
  await delay();
  return mockRegistrations
    .filter((r) => r.studentId === studentId)
    .map((r) => ({ ...r, event: mockEvents.find((e) => e.id === r.eventId) }));
};

// ATTENDANCE
export const apiGetEventAttendance = async (eventId) => {
  await delay();
  return mockAttendance
    .filter((a) => a.eventId === eventId)
    .map((a) => ({
      ...a,
      studentName: mockUsers.find((u) => u.id === a.studentId)?.name || a.studentName || 'Unknown',
    }));
};

export const apiMarkAttendance = async (attendanceId, present) => {
  await delay();
  const record = mockAttendance.find((a) => a.id === attendanceId);
  if (!record) throw new Error('Record not found');
  record.present = present;
  record.checkedInAt = present ? new Date().toISOString() : null;
  return record;
};

export const apiCheckinByQR = async (qrCode, eventId) => {
  await delay(600);
  // Find the registration matching this QR
  const reg = mockRegistrations.find((r) => r.qrCode === qrCode && r.eventId === eventId);
  if (!reg) throw new Error('Invalid QR code or wrong event');
  const attendanceRecord = mockAttendance.find((a) => a.studentId === reg.studentId && a.eventId === eventId);
  if (!attendanceRecord) throw new Error('Attendee not found');
  if (attendanceRecord.present) throw new Error('Already checked in');
  attendanceRecord.present = true;
  attendanceRecord.checkedInAt = new Date().toISOString();
  return {
    ...attendanceRecord,
    studentName: mockUsers.find((u) => u.id === attendanceRecord.studentId)?.name || 'Unknown',
  };
};

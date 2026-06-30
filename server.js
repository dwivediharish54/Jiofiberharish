const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

const ADMIN_USER = process.env.ADMIN_USER || 'harish';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Ritesh@2004';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change_this_secret';
const BOOKINGS_FILE = path.join(__dirname, 'bookings.json');

const hashedAdminPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Helper for bookings storage
async function loadBookings() {
  try {
    const content = await fs.readFile(BOOKINGS_FILE, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function saveBookings(bookings) {
  await fs.writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), 'utf8');
}

// Protect sensitive admin routes before serving static content
app.use((req, res, next) => {
  const needsAuth = req.path === '/admin' || req.path.startsWith('/admin');
  if (!needsAuth) return next();
  if (req.path === '/admin/login' || req.path === '/admin/login/') return next();
  if (req.session && req.session.authenticated) return next();
  return res.redirect('/admin/login');
});

// Static files (site)
app.use(express.static(path.join(__dirname)));

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.get('/admin', (req, res) => {
  return res.redirect('/admin/login');
});

app.get('/admin/appointments', (req, res) => {
  return res.redirect('/admin/appointments.html');
});

app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.redirect('/admin/login?error=1');
  const isUsernameCorrect = username === ADMIN_USER;
  const isPasswordCorrect = await bcrypt.compare(password, hashedAdminPassword);
  if (isUsernameCorrect && isPasswordCorrect) {
    req.session.authenticated = true;
    return res.redirect('/admin/appointments.html');
  }
  return res.redirect('/admin/login?error=1');
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

app.get('/admin/bookings', async (req, res) => {
  const bookings = await loadBookings();
  res.json(bookings);
});

app.post('/api/bookings', async (req, res) => {
  const values = req.body;
  const booking = {
    customerName: values.customerName,
    customerPhone: values.customerPhone,
    customerEmail: values.customerEmail,
    serviceType: values.serviceType,
    preferredDate: values.preferredDate,
    preferredTime: values.preferredTime,
    message: values.message,
    status: 'Pending',
    createdAt: new Date().toISOString(),
  };
  const bookings = await loadBookings();
  bookings.push(booking);
  await saveBookings(bookings);
  res.status(201).json({ success: true });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
  console.log('Open this address on other devices on your LAN to access the site.');
});

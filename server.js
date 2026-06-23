require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const store = require('./backend/storage/excelStore');

const authRoutes = require('./backend/routes/auth');
const dietRoutes = require('./backend/routes/diets');
const adminRoutes = require('./backend/routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

store.loadWorkbook()
  .then(() => console.log('Excel data workbook ready:', store.workbookPath))
  .catch((err) => console.error('Excel workbook setup failed:', err.message));

app.disable('x-powered-by');
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(session({
  name: 'balance-plate.sid',
  secret: process.env.SESSION_SECRET || 'replace_this_balance-plate_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

app.use(express.static(__dirname));

app.use('/api/auth', authRoutes);
app.use('/api/diets', dietRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Balance-Plate API is running', storage: 'excel', workbook: store.workbookPath });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ success: false, message: 'API route not found' });
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log('Balance-Plate server running at http://localhost:' + PORT);
});

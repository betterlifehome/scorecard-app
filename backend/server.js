require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./lib/db');

const uploadRoutes   = require('./routes/upload');
const smsRoutes      = require('./routes/sms');
const employeeRoutes = require('./routes/employees');
const notifyRoutes   = require('./routes/notify');
const historyRoutes  = require('./routes/history');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? '*'
    : (process.env.FRONTEND_URL || 'http://localhost:5173'),
  credentials: true,
}));
app.use(express.json());

app.use('/api/upload',    uploadRoutes);
app.use('/api/sms',       smsRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/notify',    notifyRoutes);
app.use('/api/history',   historyRoutes);

app.get('/api/health', async (req, res) => {
  let dbOk = false;
  let dbError = null;
  if (process.env.DATABASE_URL) {
    try {
      const { pool } = require('./lib/db');
      await pool.query('SELECT 1');
      dbOk = true;
    } catch (err) {
      dbError = err.message;
    }
  }
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    twilio:    !!process.env.TWILIO_ACCOUNT_SID,
    sendgrid:  !!process.env.SENDGRID_API_KEY,
    database:  dbOk,
    dbError,
  });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

async function start() {
  if (process.env.DATABASE_URL) {
    await initDB();
  } else {
    console.warn('⚠️  DATABASE_URL not set — history features disabled');
  }
  app.listen(PORT, () => {
    console.log(`\n🚀 Scorecard server running on http://localhost:${PORT}`);
    console.log(`   Twilio:    ${process.env.TWILIO_ACCOUNT_SID ? '✅' : '⚠️  not configured'}`);
    console.log(`   SendGrid:  ${process.env.SENDGRID_API_KEY   ? '✅' : '⚠️  not configured'}`);
    console.log(`   Database:  ${process.env.DATABASE_URL       ? '✅' : '⚠️  not configured'}`);
  });
}

start();

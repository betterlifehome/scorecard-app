require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const uploadRoutes = require('./routes/upload');
const smsRoutes = require('./routes/sms');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// API routes
app.use('/api/upload', uploadRoutes);
app.use('/api/sms', smsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n🚀 Scorecard server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Twilio: ${process.env.TWILIO_ACCOUNT_SID ? '✅ configured' : '⚠️  not configured (add to .env)'}`);
});

const express = require('express');
const router = express.Router();

/**
 * POST /api/sms/send
 * Body: { to, message }
 */
router.post('/send', async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: 'Both "to" and "message" fields are required.' });
  }

  // Validate Twilio config
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    return res.status(503).json({
      error: 'Twilio is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER to your .env file.',
    });
  }

  try {
    const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    const result = await twilio.messages.create({
      from: TWILIO_FROM_NUMBER,
      to: formatPhone(to),
      body: message,
    });

    console.log(`SMS sent to ${to}: SID ${result.sid}`);

    res.json({
      success: true,
      sid: result.sid,
      status: result.status,
      to: result.to,
    });

  } catch (err) {
    console.error('Twilio error:', err);
    res.status(500).json({
      error: err.message || 'Failed to send SMS.',
      twilioCode: err.code,
    });
  }
});

/**
 * POST /api/sms/send-bulk
 * Body: { messages: [{ to, message, employeeName }] }
 * Sends to multiple recipients, returns per-recipient results.
 */
router.post('/send-bulk', async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: '"messages" must be a non-empty array.' });
  }

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    return res.status(503).json({ error: 'Twilio is not configured.' });
  }

  const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  const results = [];

  for (const { to, message, employeeName } of messages) {
    try {
      const result = await twilio.messages.create({
        from: TWILIO_FROM_NUMBER,
        to: formatPhone(to),
        body: message,
      });
      results.push({ to, employeeName, success: true, sid: result.sid });
    } catch (err) {
      results.push({ to, employeeName, success: false, error: err.message });
    }
  }

  const successCount = results.filter(r => r.success).length;

  res.json({
    success: true,
    sent: successCount,
    failed: results.length - successCount,
    results,
  });
});

/**
 * GET /api/sms/status
 * Check whether Twilio is configured.
 */
router.get('/status', (req, res) => {
  const configured = !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
  );
  res.json({
    configured,
    fromNumber: configured ? process.env.TWILIO_FROM_NUMBER : null,
  });
});

/**
 * Normalize phone numbers to E.164 format.
 * Handles US numbers (10 digits) and already-formatted numbers.
 */
function formatPhone(raw) {
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (String(raw).startsWith('+')) return raw; // Already E.164
  return `+${digits}`;
}

module.exports = router;

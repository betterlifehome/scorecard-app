const express = require('express');
const router = express.Router();

function getTwilioClient() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return null;
  const twilio = require('twilio');
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

function getSendGrid() {
  const { SENDGRID_API_KEY } = process.env;
  if (!SENDGRID_API_KEY) return null;
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(SENDGRID_API_KEY);
  return sgMail;
}

function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return phone.startsWith('+') ? phone : null;
}

// POST /api/notify/send
// Body: { recipients: [{ name, email, phone, message, sendSms, sendEmail }] }
// Returns per-recipient results
router.post('/send', async (req, res) => {
  const { recipients } = req.body;
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'recipients array required' });
  }

  const twilioClient = getTwilioClient();
  const sgMail = getSendGrid();
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'scorecards@betterlifehome.com';
  const fromName = process.env.SENDGRID_FROM_NAME || 'Better Life Home Cleaning';

  const results = await Promise.all(recipients.map(async (r) => {
    const result = { name: r.name, sms: null, email: null };

    // Send SMS
    if (r.sendSms && r.phone) {
      if (!twilioClient) {
        result.sms = { success: false, error: 'Twilio not configured' };
      } else {
        const to = normalizePhone(r.phone);
        if (!to) {
          result.sms = { success: false, error: 'Invalid phone number' };
        } else {
          try {
            const msg = await twilioClient.messages.create({
              body: r.message,
              from: process.env.TWILIO_FROM_NUMBER,
              to,
            });
            result.sms = { success: true, sid: msg.sid };
          } catch (err) {
            result.sms = { success: false, error: err.message };
          }
        }
      }
    }

    // Send Email
    if (r.sendEmail && r.email) {
      if (!sgMail) {
        result.email = { success: false, error: 'SendGrid not configured' };
      } else {
        try {
          await sgMail.send({
            to: r.email,
            from: { email: fromEmail, name: fromName },
            subject: `Your Weekly Scorecard — Better Life Home Cleaning`,
            text: r.message,
          });
          result.email = { success: true };
        } catch (err) {
          result.email = { success: false, error: err.message };
        }
      }
    }

    return result;
  }));

  const successCount = results.filter(
    r => (r.sms?.success || !r.sms) && (r.email?.success || !r.email)
  ).length;

  res.json({ success: true, sent: successCount, total: results.length, results });
});

module.exports = router;

const BASE = '/api';

export async function processReports(weeklyFile, sixMonthFile) {
  const formData = new FormData();
  formData.append('weeklyReport', weeklyFile);
  formData.append('sixMonthReport', sixMonthFile);

  const res = await fetch(`${BASE}/upload/process`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to process reports');
  return data;
}

export async function sendSMS(to, message) {
  const res = await fetch(`${BASE}/sms/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, message }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send SMS');
  return data;
}

export async function sendBulkSMS(messages) {
  const res = await fetch(`${BASE}/sms/send-bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send bulk SMS');
  return data;
}

export async function getSMSStatus() {
  const res = await fetch(`${BASE}/sms/status`);
  return res.json();
}

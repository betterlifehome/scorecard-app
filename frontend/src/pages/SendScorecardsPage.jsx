import { useState, useEffect, useContext } from 'react';
import { Send, Mail, MessageSquare, ChevronDown, ChevronUp, Check, AlertCircle, Edit2 } from 'lucide-react';
import { AppContext } from '../components/Layout';
import { buildScorecardMessage, normalizeName } from '../lib/scorecard';

export default function SendScorecardsPage() {
  const { scorecards } = useContext(AppContext);
  const [employees, setEmployees] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null);
  const [expandedKey, setExpandedKey] = useState(null);

  useEffect(() => {
    fetch('/api/employees').then(r => r.json()).then(setEmployees).catch(console.error);
  }, []);

  useEffect(() => {
    if (!scorecards.length || !employees.length) return;

    const matched = scorecards.map(sc => {
      // Try exact nameKey first, then fuzzy match on normalized first+last
      const scFirst = normalizeName(sc.firstName);
      const scLast  = normalizeName(sc.lastName);
      const emp = employees.find(e =>
        e.nameKey === sc.nameKey ||
        (normalizeName(e.firstName) === scFirst && normalizeName(e.lastName) === scLast) ||
        (normalizeName(e.lastName) + normalizeName(e.firstName)) === (scLast + scFirst)
      );
      const message = buildScorecardMessage(sc);
      return {
        nameKey: sc.nameKey,
        name: `${sc.firstName} ${sc.lastName}`,
        email: emp?.email || '',
        phone: emp?.phone || '',
        message,
        sendEmail: !!emp?.email,
        sendSms: !!emp?.phone,
        selected: !!(emp?.email || emp?.phone),
        matched: !!emp,
      };
    });

    setRecipients(matched);
  }, [scorecards, employees]);

  function updateRecipient(nameKey, updates) {
    setRecipients(prev => prev.map(r => r.nameKey === nameKey ? { ...r, ...updates } : r));
  }

  function toggleAll(selected) {
    setRecipients(prev => prev.map(r => ({ ...r, selected })));
  }

  async function handleSend() {
    const toSend = recipients.filter(r => r.selected && (r.sendEmail || r.sendSms));
    if (!toSend.length) return alert('No recipients selected with email or phone.');

    setSending(true);
    setResults(null);
    try {
      const res = await fetch('/api/notify/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients: toSend }),
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setResults({ error: err.message });
    }
    setSending(false);
  }

  const selectedCount = recipients.filter(r => r.selected).length;
  const unmatchedCount = recipients.filter(r => !r.matched).length;

  if (!scorecards.length) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <Send size={40} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
        <p>Upload reports first to generate scorecards, then come here to send them.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Send size={24} color="var(--color-primary)" />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Send Scorecards</h1>
        </div>
        <button
          onClick={handleSend}
          disabled={sending || selectedCount === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending || selectedCount === 0 ? 0.6 : 1, fontSize: '0.875rem', fontWeight: 600 }}
        >
          <Send size={15} /> {sending ? 'Sending...' : `Send to ${selectedCount}`}
        </button>
      </div>

      {unmatchedCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem', color: '#92400e' }}>
          <AlertCircle size={15} />
          {unmatchedCount} tech{unmatchedCount > 1 ? 's' : ''} not in your employee roster — add them in the Employees tab to send scorecards.
        </div>
      )}

      {results && (
        <div style={{ padding: '0.75rem 1rem', background: results.error ? '#fef2f2' : '#f0fdf4', border: `1px solid ${results.error ? '#fecaca' : '#bbf7d0'}`, borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem', color: results.error ? '#991b1b' : '#166534' }}>
          {results.error ? results.error : `✅ Sent to ${results.sent} of ${results.total} recipients`}
        </div>
      )}

      {/* Select all */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
        <button onClick={() => toggleAll(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', textDecoration: 'underline' }}>Select all</button>
        <button onClick={() => toggleAll(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', textDecoration: 'underline' }}>Deselect all</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {recipients.map(r => (
          <div key={r.nameKey} style={{ background: 'var(--color-surface)', border: `1px solid ${r.selected ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 10, overflow: 'hidden', opacity: r.matched ? 1 : 0.6 }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', gap: '0.75rem' }}>
              <input
                type="checkbox"
                checked={r.selected}
                disabled={!r.matched}
                onChange={e => updateRecipient(r.nameKey, { selected: e.target.checked })}
                style={{ width: 16, height: 16, cursor: r.matched ? 'pointer' : 'not-allowed' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'flex', gap: '0.75rem', marginTop: 2 }}>
                  {r.email ? <span>✉ {r.email}</span> : <span style={{ color: '#ef4444' }}>no email</span>}
                  {r.phone ? <span>📱 {r.phone}</span> : <span style={{ color: '#ef4444' }}>no phone</span>}
                  {!r.matched && <span style={{ color: '#f59e0b' }}>⚠ not in roster</span>}
                </div>
              </div>

              {/* Send via toggles */}
              {r.matched && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => updateRecipient(r.nameKey, { sendEmail: !r.sendEmail })}
                    disabled={!r.email}
                    title="Send email"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.3rem 0.6rem', borderRadius: 6, border: '1px solid', borderColor: r.sendEmail && r.email ? 'var(--color-primary)' : 'var(--color-border)', background: r.sendEmail && r.email ? '#e8f5e9' : 'transparent', color: r.sendEmail && r.email ? 'var(--color-primary)' : 'var(--color-text-muted)', cursor: r.email ? 'pointer' : 'not-allowed', fontSize: '0.78rem', opacity: r.email ? 1 : 0.4 }}
                  >
                    <Mail size={13} /> Email
                  </button>
                  <button
                    onClick={() => updateRecipient(r.nameKey, { sendSms: !r.sendSms })}
                    disabled={!r.phone}
                    title="Send SMS"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.3rem 0.6rem', borderRadius: 6, border: '1px solid', borderColor: r.sendSms && r.phone ? 'var(--color-primary)' : 'var(--color-border)', background: r.sendSms && r.phone ? '#e8f5e9' : 'transparent', color: r.sendSms && r.phone ? 'var(--color-primary)' : 'var(--color-text-muted)', cursor: r.phone ? 'pointer' : 'not-allowed', fontSize: '0.78rem', opacity: r.phone ? 1 : 0.4 }}
                  >
                    <MessageSquare size={13} /> SMS
                  </button>
                </div>
              )}

              {/* Expand/collapse message */}
              <button
                onClick={() => setExpandedKey(expandedKey === r.nameKey ? null : r.nameKey)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}
              >
                <Edit2 size={15} />
                {expandedKey === r.nameKey ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>

            {/* Editable message */}
            {expandedKey === r.nameKey && (
              <div style={{ borderTop: '1px solid var(--color-border)', padding: '0.75rem 1rem', background: '#fafafa' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.4rem' }}>Edit message:</label>
                <textarea
                  value={r.message}
                  onChange={e => updateRecipient(r.nameKey, { message: e.target.value })}
                  rows={8}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.82rem', fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
            )}

            {/* Result row */}
            {results && results.results && (() => {
              const res = results.results.find(res => res.name === r.name);
              if (!res) return null;
              return (
                <div style={{ borderTop: '1px solid var(--color-border)', padding: '0.4rem 1rem', fontSize: '0.78rem', display: 'flex', gap: '1rem', background: '#f9fafb' }}>
                  {res.email && <span style={{ color: res.email.success ? '#166534' : '#991b1b' }}>{res.email.success ? '✅ Email sent' : `❌ Email: ${res.email.error}`}</span>}
                  {res.sms && <span style={{ color: res.sms.success ? '#166534' : '#991b1b' }}>{res.sms.success ? '✅ SMS sent' : `❌ SMS: ${res.sms.error}`}</span>}
                </div>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}

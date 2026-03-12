import { useState } from 'react';
import { X, MessageSquare, CheckCircle, AlertCircle, Loader, Users } from 'lucide-react';
import { buildScorecardMessage } from '../lib/scorecard';
import { sendBulkSMS } from '../lib/api';

export default function BulkSMSModal({ scorecards, weekOf, onClose }) {
  const eligible = scorecards.filter(t => t.phone);
  const [selected, setSelected] = useState(new Set(eligible.map(t => t.id)));
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null);

  function toggle(id) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  function toggleAll() {
    if (selected.size === eligible.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(eligible.map(t => t.id)));
    }
  }

  async function handleSend() {
    const toSend = eligible.filter(t => selected.has(t.id));
    if (!toSend.length) return;

    setSending(true);
    setResults(null);

    const messages = toSend.map(tech => ({
      to: tech.phone,
      message: buildScorecardMessage(tech, weekOf),
      employeeName: tech.employeeName,
    }));

    try {
      const data = await sendBulkSMS(messages);
      setResults(data);
    } catch (err) {
      setResults({ error: err.message });
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(15,17,23,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--white)',
        borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: 520,
        maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--ink-100)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'var(--brand-light)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={18} color="var(--brand)" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink-900)' }}>Send Bulk Scorecards</div>
              <div style={{ fontSize: 12, color: 'var(--ink-400, #8b909e)' }}>{eligible.length} technicians with phone numbers</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-300)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Results view */}
        {results ? (
          <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
            {results.error ? (
              <div style={{ color: 'var(--danger)', display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={16} /> {results.error}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <div style={{ flex: 1, background: 'var(--success-bg)', borderRadius: 'var(--radius-md)', padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--success)' }}>{results.sent}</div>
                    <div style={{ fontSize: 12, color: 'var(--success)' }}>Sent successfully</div>
                  </div>
                  {results.failed > 0 && (
                    <div style={{ flex: 1, background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--danger)' }}>{results.failed}</div>
                      <div style={{ fontSize: 12, color: 'var(--danger)' }}>Failed</div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {results.results?.map((r, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px',
                      background: r.success ? 'var(--success-bg)' : 'var(--danger-bg)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 13,
                    }}>
                      {r.success
                        ? <CheckCircle size={14} color="var(--success)" />
                        : <AlertCircle size={14} color="var(--danger)" />
                      }
                      <span style={{ fontWeight: 500, color: 'var(--ink-700)' }}>{r.employeeName}</span>
                      <span style={{ marginLeft: 'auto', color: r.success ? 'var(--success)' : 'var(--danger)', fontSize: 12 }}>
                        {r.success ? r.to : r.error}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <button
              onClick={onClose}
              style={{
                marginTop: 20, width: '100%', padding: '10px',
                background: 'var(--brand)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-md)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Tech list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px' }}>
              <button
                onClick={toggleAll}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, color: 'var(--brand)', fontWeight: 600,
                  padding: '8px 0', display: 'flex', alignItems: 'center', gap: 6,
                  marginBottom: 8,
                }}
              >
                <Users size={13} />
                {selected.size === eligible.length ? 'Deselect all' : 'Select all'}
                <span style={{ color: 'var(--ink-300)', fontWeight: 400 }}>({selected.size} selected)</span>
              </button>

              {eligible.map(tech => (
                <label key={tech.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  background: selected.has(tech.id) ? 'var(--brand-light)' : 'transparent',
                  transition: 'background 0.1s',
                  marginBottom: 4,
                }}>
                  <input
                    type="checkbox"
                    checked={selected.has(tech.id)}
                    onChange={() => toggle(tech.id)}
                    style={{ accentColor: 'var(--brand)', width: 16, height: 16 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-700)' }}>{tech.employeeName}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-400, #8b909e)', fontFamily: 'var(--font-mono)' }}>{tech.phone}</div>
                  </div>
                  {tech.overallScore !== null && tech.overallScore !== undefined && (
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>{tech.overallScore}%</span>
                  )}
                </label>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--ink-100)', display: 'flex', gap: 10 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '10px', background: 'none',
                  border: '1px solid var(--ink-100)', borderRadius: 'var(--radius-md)',
                  fontSize: 14, cursor: 'pointer', color: 'var(--ink-500)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!selected.size || sending}
                style={{
                  flex: 2, padding: '10px',
                  background: selected.size ? 'var(--brand)' : 'var(--ink-100)',
                  color: selected.size ? '#fff' : 'var(--ink-300)',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  fontSize: 14, fontWeight: 600,
                  cursor: selected.size && !sending ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {sending
                  ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</>
                  : <><MessageSquare size={14} /> Send to {selected.size} technicians</>
                }
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

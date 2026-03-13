import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MessageSquare, ChevronRight, TrendingUp, Users, Star, Zap, Send, X, Phone, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../components/Layout';
import { getMetricColor, getMetricBg, getMetricLabel, formatScore, buildScorecardMessage, normalizeName } from '../lib/scorecard';
import BulkSMSModal from '../components/BulkSMSModal';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtWeek(w) {
  if (!w) return '';
  const d = new Date(w);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export default function ScorecardsPage() {
  const { scorecards, stats, weekOf, availableWeeks, switchWeek, loadingDB } = useApp();
  const [search, setSearch]       = useState('');
  const [sortBy, setSortBy]       = useState('lastName');
  const [showBulkSMS, setShowBulkSMS] = useState(false);
  const [quickSend, setQuickSend] = useState(null); // tech being quick-sent

  const filtered = scorecards
    .filter(t => t.fullName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'lastName')   return a.lastName.localeCompare(b.lastName);
      if (sortBy === 'quality')    return (b.avgSurveyScore ?? 0) - (a.avgSurveyScore ?? 0);
      if (sortBy === 'absences')   return (b.weeklyUnexcused ?? 0) - (a.weeklyUnexcused ?? 0);
      if (sortBy === 'efficiency') return (b.efficiencyScore ?? 0) - (a.efficiencyScore ?? 0);
      return 0;
    });

  const activeCount = scorecards.filter(s => s.weeklyWorked > 0).length;

  if (loadingDB && !scorecards.length) {
    return <div style={{ textAlign: 'center', padding: 80, color: 'var(--ink-400)' }}>Loading scorecards…</div>;
  }

  if (!scorecards.length) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: 'var(--ink-700)' }}>No scorecards yet</h2>
        <p style={{ color: 'var(--ink-400)', marginBottom: 24 }}>Upload your reports to generate weekly scorecards.</p>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'var(--brand)', color: '#fff', borderRadius: 'var(--radius-md)', fontWeight: 500, fontSize: 14, textDecoration: 'none' }}>
          Go to Upload
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: 'var(--ink-900)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Weekly Scorecards
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <p style={{ color: 'var(--ink-400)', fontSize: 14, margin: 0 }}>
              {activeCount} active · {scorecards.length} total
              {weekOf && ` · Week of ${fmtWeek(weekOf)}`}
            </p>
            {/* Week switcher */}
            {availableWeeks.length > 1 && (
              <select
                value={weekOf}
                onChange={e => switchWeek(e.target.value)}
                style={{ padding: '2px 8px', border: '1px solid var(--ink-100)', borderRadius: 6, fontSize: 12, color: 'var(--ink-600)', background: 'var(--white)', cursor: 'pointer' }}
              >
                {availableWeeks.map(w => (
                  <option key={w} value={w}>Week of {fmtWeek(w)}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowBulkSMS(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          <MessageSquare size={15} /> Send All Scorecards
        </button>
      </div>

      {/* Summary stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 28 }}>
          <StatCard icon={<Users size={16} color="var(--brand)" />}         label="Active"           value={activeCount} />
          <StatCard icon={<Star size={16} color="var(--warning)" />}        label="Avg Quality"      value={formatScore(stats.avgSurveyScore)}  color={getMetricColor('quality',      stats.avgSurveyScore)} />
          <StatCard icon={<MessageSquare size={16} color="var(--brand)" />} label="Avg Response"     value={formatScore(stats.avgResponseRate)} color={getMetricColor('response',     stats.avgResponseRate)} />
          <StatCard icon={<TrendingUp size={16} color="var(--info)" />}     label="Avg Efficiency"   value={formatScore(stats.avgEfficiency)}   color={getMetricColor('efficiency',   stats.avgEfficiency)} />
          <StatCard icon={<Zap size={16} color="#6b3fa0" />}                label="Avg Productivity" value={formatScore(stats.avgQuality)}      color={getMetricColor('productivity', stats.avgQuality)} />
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-300)' }} />
          <input type="text" placeholder="Search technicians…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 34, paddingRight: 12, height: 38, border: '1px solid var(--ink-100)', borderRadius: 'var(--radius-md)', fontSize: 14, background: 'var(--white)', color: 'var(--ink-700)', outline: 'none' }}
          />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: '0 12px', height: 38, border: '1px solid var(--ink-100)', borderRadius: 'var(--radius-md)', fontSize: 14, background: 'var(--white)', color: 'var(--ink-700)', cursor: 'pointer', outline: 'none' }}
        >
          <option value="lastName">Sort: Name</option>
          <option value="quality">Sort: Quality</option>
          <option value="efficiency">Sort: Efficiency</option>
          <option value="absences">Sort: Absences</option>
        </select>
      </div>

      {/* Tech grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {filtered.map(tech => (
          <TechCard key={tech.id} tech={tech} onQuickSend={() => setQuickSend(tech)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--ink-300)' }}>No technicians match your search.</div>
      )}

      {showBulkSMS && <BulkSMSModal scorecards={scorecards} weekOf={weekOf} onClose={() => setShowBulkSMS(false)} />}
      {quickSend && <QuickSendModal tech={quickSend} onClose={() => setQuickSend(null)} />}
    </div>
  );
}

// ─── Quick Send Modal ────────────────────────────────────────────────────────
function QuickSendModal({ tech, onClose }) {
  const [phone, setPhone]     = useState('');
  const [message, setMessage] = useState(() => buildScorecardMessage(tech));
  const [sending, setSending] = useState(false);
  const [result, setResult]   = useState(null);

  useState(() => {
    fetch('/api/employees')
      .then(r => r.json())
      .then(emps => {
        const emp = emps.find(e =>
          e.nameKey === tech.nameKey ||
          (normalizeName(e.firstName) === normalizeName(tech.firstName) &&
           normalizeName(e.lastName)  === normalizeName(tech.lastName))
        );
        if (emp?.phone) setPhone(emp.phone);
      })
      .catch(() => {});
  }, []);

  async function handleSend() {
    if (!phone || !message) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phone, message }),
      });
      const data = await res.json();
      setResult(data.success ? { success: true } : { success: false, error: data.error });
    } catch (err) {
      setResult({ success: false, error: err.message });
    }
    setSending(false);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(15,17,23,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--ink-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Send to {tech.firstName} {tech.lastName}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-400)' }}>Individual scorecard SMS</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-300)' }}><X size={18} /></button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Phone */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--ink-500)', display: 'block', marginBottom: 4 }}>Phone number</label>
            <div style={{ position: 'relative' }}>
              <Phone size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-300)' }} />
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (314) 555-0000"
                style={{ width: '100%', paddingLeft: 32, paddingRight: 12, height: 36, border: '1px solid var(--ink-100)', borderRadius: 'var(--radius-md)', fontSize: 14, outline: 'none', background: 'var(--ink-050)', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Message */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--ink-500)', display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Message</span>
              <span style={{ color: 'var(--ink-300)' }}>{message.length} chars</span>
            </label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={10}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--ink-100)', borderRadius: 'var(--radius-md)', fontSize: 13, fontFamily: 'monospace', lineHeight: 1.6, resize: 'vertical', outline: 'none', background: 'var(--ink-050)', boxSizing: 'border-box' }} />
          </div>

          {result && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 'var(--radius-md)', background: result.success ? 'var(--success-bg)' : 'var(--danger-bg)', color: result.success ? 'var(--success)' : 'var(--danger)', fontSize: 13 }}>
              {result.success ? <><CheckCircle size={14} /> Sent successfully!</> : <><AlertCircle size={14} /> {result.error}</>}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '10px', background: 'none', border: '1px solid var(--ink-100)', borderRadius: 'var(--radius-md)', fontSize: 14, cursor: 'pointer', color: 'var(--ink-500)' }}>
              Cancel
            </button>
            <button onClick={handleSend} disabled={!phone || !message || sending}
              style={{ flex: 2, padding: '10px', background: phone && message ? 'var(--brand)' : 'var(--ink-100)', color: phone && message ? '#fff' : 'var(--ink-300)', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600, cursor: phone && message && !sending ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {sending ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</> : <><Send size={14} /> Send SMS</>}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Tech Card ───────────────────────────────────────────────────────────────
function TechCard({ tech, onQuickSend }) {
  const isActive = tech.weeklyWorked > 0;

  return (
    <div style={{ background: 'var(--white)', border: `1px solid ${isActive ? 'var(--ink-100)' : 'var(--ink-050)'}`, borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', opacity: isActive ? 1 : 0.6 }}>
      {/* Clickable area → detail page */}
      <Link to={`/scorecards/${tech.id}`} style={{ textDecoration: 'none', display: 'block', padding: '18px 20px 12px' }}
        onMouseEnter={e => e.currentTarget.parentElement.style.boxShadow = 'var(--shadow-md)'}
        onMouseLeave={e => e.currentTarget.parentElement.style.boxShadow = 'var(--shadow-sm)'}
      >
        {/* Name + quality badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink-900)', marginBottom: 2 }}>{tech.fullName}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-300)' }}>
              {isActive ? `${tech.weeklyWorked} days worked` : 'Not active this week'}
            </div>
          </div>
          {tech.avgSurveyScore > 0 && isActive && (
            <div style={{ background: getMetricBg('quality', tech.avgSurveyScore), color: getMetricColor('quality', tech.avgSurveyScore), fontWeight: 700, fontSize: 17, padding: '4px 10px', borderRadius: 'var(--radius-md)' }}>
              {tech.avgSurveyScore}%
            </div>
          )}
        </div>

        {isActive && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px 16px', marginBottom: 12 }}>
              <MiniScore label="Quality"      metric="quality"      value={tech.avgSurveyScore} />
              <MiniScore label="Response"     metric="response"     value={tech.responseRate} />
              <MiniScore label="Efficiency"   metric="efficiency"   value={tech.efficiencyScore} />
              <MiniScore label="Productivity" metric="productivity" value={tech.qualityScore} />
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <AbsencePill label="unexcused" value={tech.weeklyUnexcused} threshold={0} />
              {tech.weeklyLate > 0 && <AbsencePill label="late" value={tech.weeklyLate} threshold={2} />}
              {tech.rollingUnexcused !== null && <AbsencePill label="6mo" value={tech.rollingUnexcused} threshold={2} />}
              <ChevronRight size={14} color="var(--ink-300)" style={{ marginLeft: 'auto' }} />
            </div>
          </>
        )}
      </Link>

      {/* Quick send button — below card, separate from link */}
      {isActive && (
        <div style={{ borderTop: '1px solid var(--ink-100)', padding: '8px 14px' }}>
          <button
            onClick={onQuickSend}
            style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '6px 10px', background: 'none', border: '1px solid var(--ink-100)', borderRadius: 6, fontSize: 12, color: 'var(--ink-500)', cursor: 'pointer', justifyContent: 'center', fontWeight: 500 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-light)'; e.currentTarget.style.color = 'var(--brand)'; e.currentTarget.style.borderColor = 'var(--brand)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--ink-500)'; e.currentTarget.style.borderColor = 'var(--ink-100)'; }}
          >
            <MessageSquare size={13} /> Send Scorecard
          </button>
        </div>
      )}
    </div>
  );
}

function MiniScore({ label, metric, value }) {
  const color = getMetricColor(metric, value);
  const barWidth = metric === 'productivity'
    ? Math.min(value ?? 0, 130) / 1.3
    : Math.min(value ?? 0, 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color }}>{formatScore(value)}</span>
      </div>
      <div style={{ height: 3, background: 'var(--ink-100)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${barWidth}%`, background: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

function AbsencePill({ label, value, threshold }) {
  const isRed = (value ?? 0) > threshold;
  return (
    <div style={{ fontSize: 11, background: isRed ? 'var(--danger-bg)' : 'var(--ink-050)', color: isRed ? 'var(--danger)' : 'var(--ink-500)', padding: '2px 7px', borderRadius: 99, fontWeight: 500 }}>
      {value} {label}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--ink-100)', borderRadius: 'var(--radius-md)', padding: '14px 16px', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        {icon}
        <span style={{ fontSize: 11, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || 'var(--ink-900)', letterSpacing: '-0.03em' }}>{value}</div>
    </div>
  );
}

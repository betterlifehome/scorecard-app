import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Phone, CheckCircle, AlertCircle, Loader, Briefcase, Clock, DollarSign } from 'lucide-react';
import { useApp } from '../components/Layout';
import { getScoreColor, getScoreBg, getScoreLabel, formatScore, buildScorecardMessage } from '../lib/scorecard';
import { sendSMS } from '../lib/api';

export default function TechDetailPage() {
  const { id } = useParams();
  const { scorecards } = useApp();
  const tech = scorecards.find(t => String(t.id) === String(id));

  const [message, setMessage] = useState(() => tech ? buildScorecardMessage(tech) : '');
  const [phone, setPhone]     = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  if (!tech) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <p style={{ color: 'var(--ink-400, #8b909e)', marginBottom: 16 }}>Technician not found.</p>
        <Link to="/scorecards" style={{ color: 'var(--brand)' }}>← Back to scorecards</Link>
      </div>
    );
  }

  async function handleSend() {
    if (!phone || !message) return;
    setSending(true);
    setSendResult(null);
    try {
      const result = await sendSMS(phone, message);
      setSendResult({ success: true, sid: result.sid });
    } catch (err) {
      setSendResult({ success: false, error: err.message });
    } finally {
      setSending(false);
    }
  }

  const isActive = tech.weeklyWorked > 0;

  const scoreMetrics = [
    { label: 'Quality Score',   value: tech.avgSurveyScore,  desc: 'Avg. score from customer surveys (col Z)' },
    { label: 'Response Rate',   value: tech.responseRate,    desc: 'Customers who responded to scorecard (col AA)' },
    { label: 'Efficiency',      value: tech.efficiencyScore, desc: 'Job hours vs clock hours (col AE)' },
  ];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <Link to="/scorecards" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        color: 'var(--ink-400, #8b909e)', fontSize: 13, marginBottom: 24,
        textDecoration: 'none',
      }}>
        <ArrowLeft size={14} /> All scorecards
      </Link>

      {/* Hero */}
      <div style={{
        background: 'var(--brand-dark)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
        marginBottom: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20,
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', marginBottom: 6 }}>
            {tech.fullName}
          </h1>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              {isActive ? `${tech.weeklyWorked} days worked this week` : 'Not active this week'}
            </span>
            {tech.jobs > 0 && (
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                {tech.jobs} jobs · ${tech.revenue?.toLocaleString('en-US', { maximumFractionDigits: 0 }) ?? 0} revenue
              </span>
            )}
          </div>
        </div>

        {tech.overallScore !== null && isActive && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Overall Score
            </div>
            <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.04em', color: '#6be8a8' }}>
              {tech.overallScore}%
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              {getScoreLabel(tech.overallScore)}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left: scores + absences */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 4 score cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {scoreMetrics.map(({ label, value, desc }) => (
              <ScoreCard key={label} label={label} value={value} desc={desc} />
            ))}
          </div>

          {/* Absence block */}
          <div style={{
            background: 'var(--white)', border: '1px solid var(--ink-100)',
            borderRadius: 'var(--radius-lg)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Attendance
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
              <AbsenceBlock label="Unexcused" value={tech.weeklyUnexcused} period="This week" threshold={0} />
              <AbsenceBlock label="Late"      value={tech.weeklyLate}      period="This week" threshold={1} />
              <AbsenceBlock label="Excused"   value={tech.weeklyExcused}   period="This week" threshold={99} />
            </div>
            {tech.hasRollingData && (
              <>
                <div style={{ fontSize: 11, color: 'var(--ink-300)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                  Rolling 6 months
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <AbsenceBlock label="Unexcused" value={tech.rollingUnexcused} period="6 months" threshold={2} />
                  <AbsenceBlock label="Late"      value={tech.rollingLate}      period="6 months" threshold={4} />
                  <AbsenceBlock label="Excused"   value={tech.rollingExcused}   period="6 months" threshold={99} />
                </div>
              </>
            )}
          </div>

          {/* Volume stats */}
          {isActive && (
            <div style={{
              background: 'var(--white)', border: '1px solid var(--ink-100)',
              borderRadius: 'var(--radius-lg)', padding: '16px 20px', boxShadow: 'var(--shadow-sm)',
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12,
            }}>
              <VolStat icon={<Briefcase size={14} color="var(--brand)" />} label="Days" value={tech.weeklyWorked ?? '—'} />
              <VolStat icon={<Briefcase size={14} color="var(--brand)" />} label="Jobs" value={tech.jobs ?? '—'} />
              <VolStat icon={<Clock size={14} color="var(--info)" />}      label="Job hrs"   value={tech.jobHours?.toFixed(1) ?? '—'} />
              <VolStat icon={<Clock size={14} color="#6366f1" />}          label="Clock hrs" value={tech.clockHours?.toFixed(1) ?? '—'} />
              <VolStat icon={<DollarSign size={14} color="var(--warning)" />} label="Revenue"
                value={tech.revenue ? `$${tech.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'} />
            </div>
          )}
        </div>

        {/* Right: SMS */}
        <div style={{
          background: 'var(--white)', border: '1px solid var(--ink-100)',
          borderRadius: 'var(--radius-lg)', padding: '20px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={16} color="var(--brand)" />
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-700)' }}>Send Scorecard via SMS</span>
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 5, display: 'block' }}>Phone number</label>
            <div style={{ position: 'relative' }}>
              <Phone size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-300)' }} />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 (314) 555-0000"
                style={{
                  width: '100%', paddingLeft: 32, paddingRight: 12,
                  height: 36, border: '1px solid var(--ink-100)',
                  borderRadius: 'var(--radius-md)', fontSize: 14,
                  color: 'var(--ink-700)', outline: 'none', background: 'var(--ink-050)',
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 5, display: 'flex', justifyContent: 'space-between' }}>
              <span>Message</span>
              <span style={{ color: 'var(--ink-300)' }}>{message.length} chars</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={12}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--ink-100)',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontFamily: 'var(--font-mono)',
                lineHeight: 1.6,
                color: 'var(--ink-700)',
                background: 'var(--ink-050)',
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>

          <button
            onClick={() => setMessage(buildScorecardMessage(tech))}
            style={{
              background: 'none', border: '1px solid var(--ink-100)',
              borderRadius: 'var(--radius-md)', padding: '6px 12px',
              fontSize: 12, color: 'var(--ink-400, #8b909e)', cursor: 'pointer',
            }}
          >
            Reset to default message
          </button>

          {sendResult && (
            <div style={{
              display: 'flex', gap: 8, alignItems: 'center',
              padding: '10px 12px', borderRadius: 'var(--radius-md)',
              background: sendResult.success ? 'var(--success-bg)' : 'var(--danger-bg)',
              color: sendResult.success ? 'var(--success)' : 'var(--danger)',
              fontSize: 13,
            }}>
              {sendResult.success
                ? <><CheckCircle size={14} /> Sent successfully!</>
                : <><AlertCircle size={14} /> {sendResult.error}</>
              }
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={!phone || !message || sending}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px 16px',
              background: phone && message ? 'var(--brand)' : 'var(--ink-100)',
              color: phone && message ? '#fff' : 'var(--ink-300)',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: 14, fontWeight: 600,
              cursor: phone && message && !sending ? 'pointer' : 'not-allowed',
            }}
          >
            {sending
              ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</>
              : <><MessageSquare size={14} /> Send SMS</>
            }
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ScoreCard({ label, value, desc }) {
  return (
    <div style={{
      background: getScoreBg(value),
      border: `1px solid ${getScoreColor(value)}22`,
      borderRadius: 'var(--radius-md)',
      padding: '14px 16px',
    }} title={desc}>
      <div style={{ fontSize: 10, color: 'var(--ink-400, #8b909e)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: getScoreColor(value), letterSpacing: '-0.03em', marginBottom: 3 }}>
        {formatScore(value)}
      </div>
      <div style={{ fontSize: 10, color: getScoreColor(value), opacity: 0.8 }}>
        {getScoreLabel(value)}
      </div>
    </div>
  );
}

function AbsenceBlock({ label, value, period, threshold }) {
  const highlight = (value ?? 0) > threshold;
  return (
    <div style={{
      background: highlight ? 'var(--danger-bg)' : 'var(--ink-050)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 12px',
      border: highlight ? '1px solid #f5c6c2' : '1px solid transparent',
    }}>
      <div style={{ fontSize: 10, color: highlight ? 'var(--danger)' : 'var(--ink-400, #8b909e)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: highlight ? 'var(--danger)' : 'var(--ink-700)', letterSpacing: '-0.03em' }}>
        {value ?? '—'}
      </div>
    </div>
  );
}

function VolStat({ icon, label, value }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
        {icon}
        <span style={{ fontSize: 11, color: 'var(--ink-400, #8b909e)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)' }}>{value}</div>
    </div>
  );
}

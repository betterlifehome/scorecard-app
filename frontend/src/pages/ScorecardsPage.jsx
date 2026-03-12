import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MessageSquare, ChevronRight, TrendingUp, Users, Star, Zap } from 'lucide-react';
import { useApp } from '../components/Layout';
import { getScoreColor, getScoreBg, getScoreLabel, formatScore } from '../lib/scorecard';
import BulkSMSModal from '../components/BulkSMSModal';

export default function ScorecardsPage() {
  const { scorecards, stats } = useApp();
  const [search, setSearch]   = useState('');
  const [sortBy, setSortBy]   = useState('lastName');
  const [showBulkSMS, setShowBulkSMS] = useState(false);

  if (!scorecards.length) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: 'var(--ink-700)' }}>No scorecards yet</h2>
        <p style={{ color: 'var(--ink-400, #8b909e)', marginBottom: 24 }}>Upload your reports to generate weekly scorecards.</p>
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px',
          background: 'var(--brand)', color: '#fff', borderRadius: 'var(--radius-md)',
          fontWeight: 500, fontSize: 14, textDecoration: 'none',
        }}>
          Go to Upload
        </Link>
      </div>
    );
  }

  const filtered = scorecards
    .filter(t => t.fullName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'lastName')      return a.lastName.localeCompare(b.lastName);
      if (sortBy === 'overallScore')  return (b.overallScore ?? 0) - (a.overallScore ?? 0);
      if (sortBy === 'qualityScore')  return (b.qualityScore ?? 0) - (a.qualityScore ?? 0);
      if (sortBy === 'absences')      return (b.weeklyUnexcused ?? 0) - (a.weeklyUnexcused ?? 0);
      return 0;
    });

  // Active = worked at least 1 day this week
  const activeCount = scorecards.filter(s => s.weeklyWorked > 0).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: 'var(--ink-900)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Weekly Scorecards
          </h1>
          <p style={{ color: 'var(--ink-400, #8b909e)', fontSize: 14 }}>
            {activeCount} active this week · {scorecards.length} total technicians
          </p>
        </div>
        <button
          onClick={() => setShowBulkSMS(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 18px', background: 'var(--brand)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-md)', fontSize: 14,
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          <MessageSquare size={15} />
          Send All Scorecards
        </button>
      </div>

      {/* Summary stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 28 }}>
          <StatCard icon={<Users size={16} color="var(--brand)" />}       label="Active"         value={activeCount} />
          <StatCard icon={<Star size={16} color="var(--warning)" />}      label="Avg Quality"    value={formatScore(stats.avgQuality)}      color={getScoreColor(stats.avgQuality)} />
          <StatCard icon={<Zap size={16} color="#6b3fa0" />}              label="Avg Survey"     value={formatScore(stats.avgSurveyScore)}  color={getScoreColor(stats.avgSurveyScore)} />
          <StatCard icon={<TrendingUp size={16} color="var(--info)" />}   label="Avg Efficiency" value={formatScore(stats.avgEfficiency)}   color={getScoreColor(stats.avgEfficiency)} />
          <StatCard icon={<MessageSquare size={16} color="var(--brand)" />} label="Avg Response" value={formatScore(stats.avgResponseRate)} color={getScoreColor(stats.avgResponseRate)} />
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-300)' }} />
          <input
            type="text"
            placeholder="Search technicians…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 34, paddingRight: 12,
              height: 38, border: '1px solid var(--ink-100)',
              borderRadius: 'var(--radius-md)', fontSize: 14, background: 'var(--white)',
              color: 'var(--ink-700)', outline: 'none',
            }}
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{
            padding: '0 12px', height: 38, border: '1px solid var(--ink-100)',
            borderRadius: 'var(--radius-md)', fontSize: 14, background: 'var(--white)',
            color: 'var(--ink-700)', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="lastName">Sort: Name</option>
          <option value="overallScore">Sort: Overall Score</option>
          <option value="qualityScore">Sort: Quality</option>
          <option value="absences">Sort: Absences</option>
        </select>
      </div>

      {/* Tech grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {filtered.map(tech => (
          <TechCard key={tech.id} tech={tech} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--ink-300)' }}>
          No technicians match your search.
        </div>
      )}

      {showBulkSMS && (
        <BulkSMSModal
          scorecards={scorecards}
          onClose={() => setShowBulkSMS(false)}
        />
      )}
    </div>
  );
}

function TechCard({ tech }) {
  const overall = tech.overallScore;
  const isActive = tech.weeklyWorked > 0;

  return (
    <Link to={`/scorecards/${tech.id}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: 'var(--white)',
          border: `1px solid ${isActive ? 'var(--ink-100)' : 'var(--ink-050)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '18px 20px',
          cursor: 'pointer',
          transition: 'all 0.15s',
          boxShadow: 'var(--shadow-sm)',
          opacity: isActive ? 1 : 0.6,
        }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
      >
        {/* Name + overall score */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink-900)', marginBottom: 2 }}>
              {tech.fullName}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-300)' }}>
              {isActive ? `${tech.weeklyWorked} days worked` : 'Not active this week'}
            </div>
          </div>
          {overall !== null && overall !== undefined && isActive && (
            <div style={{
              background: getScoreBg(overall),
              color: getScoreColor(overall),
              fontWeight: 700,
              fontSize: 17,
              padding: '4px 10px',
              borderRadius: 'var(--radius-md)',
              letterSpacing: '-0.02em',
            }}>
              {overall}%
            </div>
          )}
        </div>

        {isActive && (
          <>
            {/* Mini score bars */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px 16px', marginBottom: 12 }}>
              <MiniScore label="Quality"    value={tech.qualityScore} />
              <MiniScore label="Response"   value={tech.responseRate} />
              <MiniScore label="Survey Avg" value={tech.avgSurveyScore} />
              <MiniScore label="Efficiency" value={tech.efficiencyScore} />
            </div>

            {/* Absences footer */}
            <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid var(--ink-100)', alignItems: 'center', flexWrap: 'wrap' }}>
              <AbsencePill label="unexcused" value={tech.weeklyUnexcused} threshold={0} />
              {tech.weeklyLate > 0 && <AbsencePill label="late" value={tech.weeklyLate} threshold={2} />}
              {tech.rollingUnexcused !== null && (
                <AbsencePill label="6mo" value={tech.rollingUnexcused} threshold={2} />
              )}
              <ChevronRight size={14} color="var(--ink-300)" style={{ marginLeft: 'auto' }} />
            </div>
          </>
        )}
      </div>
    </Link>
  );
}

function MiniScore({ label, value }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-400, #8b909e)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: getScoreColor(value) }}>
          {formatScore(value)}
        </span>
      </div>
      <div style={{ height: 3, background: 'var(--ink-100)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(value ?? 0, 100)}%`,
          background: getScoreColor(value),
          borderRadius: 2,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}

function AbsencePill({ label, value, threshold }) {
  const isRed = (value ?? 0) > threshold;
  return (
    <div style={{
      fontSize: 11,
      background: isRed ? 'var(--danger-bg)' : 'var(--ink-050)',
      color: isRed ? 'var(--danger)' : 'var(--ink-500)',
      padding: '2px 7px',
      borderRadius: 99,
      fontWeight: 500,
    }}>
      {value} {label}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--ink-100)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 16px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        {icon}
        <span style={{ fontSize: 11, color: 'var(--ink-400, #8b909e)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || 'var(--ink-900)', letterSpacing: '-0.03em' }}>
        {value}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const THRESHOLD = 130;

export default function BenefitsPage() {
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedYear,  setSelectedYear]  = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [expandedKey, setExpandedKey] = useState(null);

  useEffect(() => {
    fetch('/api/history/months')
      .then(r => r.json())
      .then(months => {
        setAvailableMonths(months);
        if (months.length > 0) {
          setSelectedYear(String(months[0].year));
          setSelectedMonth(String(months[0].month));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedYear) return;
    loadData();
  }, [selectedYear, selectedMonth]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ year: selectedYear });
      if (selectedMonth) params.set('month', selectedMonth);
      const res = await fetch(`/api/history/monthly?${params}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  const years = [...new Set(availableMonths.map(m => m.year))].sort((a,b) => b-a);

  function pct(hours) {
    return Math.min(100, Math.round((hours / THRESHOLD) * 100));
  }

  function barColor(hours) {
    if (hours >= THRESHOLD) return '#16a34a';
    if (hours >= THRESHOLD * 0.8) return '#f59e0b';
    return '#6366f1';
  }

  if (availableMonths.length === 0) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <Clock size={40} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
        <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No historical data yet</p>
        <p style={{ fontSize: '0.875rem' }}>Upload weekly reports and the data will appear here automatically.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Clock size={24} color="var(--color-primary)" />
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Hours & Benefit Eligibility</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
              {THRESHOLD}+ clock hours in a calendar month = benefit eligible
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            value={selectedYear}
            onChange={e => { setSelectedYear(e.target.value); setSelectedMonth(''); }}
            style={{ padding: '0.4rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.875rem' }}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            style={{ padding: '0.4rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.875rem' }}
          >
            <option value="">All months</option>
            {availableMonths.filter(m => String(m.year) === selectedYear).map(m => (
              <option key={m.month} value={m.month}>{MONTHS[m.month - 1]}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: '1rem', color: '#991b1b', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {loading && (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>Loading...</p>
      )}

      {data && !loading && (
        <>
          {/* Summary bar */}
          {selectedMonth && (() => {
            const eligible = data.employees.filter(e => e.months.some(m => m.benefitEligible)).length;
            return (
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'Total Techs', value: data.employees.length, color: '#6366f1' },
                  { label: 'Benefit Eligible', value: eligible, color: '#16a34a' },
                  { label: 'Not Yet Eligible', value: data.employees.length - eligible, color: '#f59e0b' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0.75rem 1.25rem', flex: '1 1 120px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Employee list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {data.employees.map(emp => {
              const expanded = expandedKey === emp.nameKey;
              // If viewing a single month, show that month's data prominently
              const focusMonth = selectedMonth
                ? emp.months.find(m => String(m.month) === selectedMonth)
                : null;

              return (
                <div key={emp.nameKey} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
                  {/* Row */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{emp.firstName} {emp.lastName}</div>

                      {focusMonth ? (
                        <div style={{ marginTop: '0.4rem' }}>
                          {/* Progress bar */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ flex: 1, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ width: `${pct(focusMonth.clockHours)}%`, height: '100%', background: barColor(focusMonth.clockHours), borderRadius: 4, transition: 'width 0.3s' }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: barColor(focusMonth.clockHours), whiteSpace: 'nowrap' }}>
                              {focusMonth.clockHours.toFixed(1)} hrs
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            <span>{focusMonth.daysWorked} days</span>
                            <span>{focusMonth.jobs} jobs</span>
                            <span>{focusMonth.jobHours.toFixed(1)} job hrs</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                          {emp.months.length} month{emp.months.length !== 1 ? 's' : ''} of data
                          {' · '}{emp.months.filter(m => m.benefitEligible).length} eligible
                        </div>
                      )}
                    </div>

                    {/* Eligibility badge */}
                    {focusMonth && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem', borderRadius: 20, background: focusMonth.benefitEligible ? '#f0fdf4' : '#fffbeb', border: `1px solid ${focusMonth.benefitEligible ? '#bbf7d0' : '#fde68a'}`, fontSize: '0.75rem', fontWeight: 600, color: focusMonth.benefitEligible ? '#16a34a' : '#92400e', whiteSpace: 'nowrap' }}>
                        {focusMonth.benefitEligible
                          ? <><CheckCircle size={13} /> Eligible</>
                          : <><AlertCircle size={13} /> {(THRESHOLD - focusMonth.clockHours).toFixed(1)} hrs to go</>
                        }
                      </div>
                    )}

                    {/* Expand */}
                    <button
                      onClick={() => setExpandedKey(expanded ? null : emp.nameKey)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}
                    >
                      <ChevronDown size={16} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                  </div>

                  {/* Month-by-month breakdown */}
                  {expanded && (
                    <div style={{ borderTop: '1px solid var(--color-border)', padding: '0.75rem 1rem', background: '#fafafa' }}>
                      <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ color: 'var(--color-text-muted)' }}>
                            {['Month', 'Clock Hrs', 'Job Hrs', 'Days', 'Jobs', 'Status'].map(h => (
                              <th key={h} style={{ textAlign: 'left', padding: '0.3rem 0.5rem', fontWeight: 600 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {emp.months.map(m => (
                            <tr key={`${m.year}-${m.month}`} style={{ borderTop: '1px solid var(--color-border)' }}>
                              <td style={{ padding: '0.4rem 0.5rem', fontWeight: 500 }}>{MONTHS[m.month-1]} {m.year}</td>
                              <td style={{ padding: '0.4rem 0.5rem', fontWeight: 600, color: barColor(m.clockHours) }}>{m.clockHours.toFixed(1)}</td>
                              <td style={{ padding: '0.4rem 0.5rem' }}>{m.jobHours.toFixed(1)}</td>
                              <td style={{ padding: '0.4rem 0.5rem' }}>{m.daysWorked}</td>
                              <td style={{ padding: '0.4rem 0.5rem' }}>{m.jobs}</td>
                              <td style={{ padding: '0.4rem 0.5rem' }}>
                                {m.benefitEligible
                                  ? <span style={{ color: '#16a34a', fontWeight: 600 }}>✅ Eligible</span>
                                  : <span style={{ color: '#92400e' }}>{(THRESHOLD - m.clockHours).toFixed(1)} hrs short</span>
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

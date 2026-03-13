/**
 * Per-metric color thresholds for Better Life Home Cleaning
 *
 * Quality (Avg. col Z):    ≥98 bright green, 96-98 light green, 94-96 yellow, <94 red
 * Response Rate (col AA):  ≥60 bright green, 50-60 light green, 40-50 yellow, <40 red
 * Efficiency (col AE):     ≥85 bright green, 80-85 light green, 75-80 yellow, <75 red
 * Productivity (col Z/L):  ≥105 bright green, 98-105 green, 92-98 yellow, <92 red
 */

const COLORS = {
  brightGreen: '#16a34a',
  lightGreen:  '#4ade80',
  yellow:      '#f59e0b',
  red:         '#ef4444',
  muted:       '#9ca3af',
};

const BG = {
  brightGreen: '#f0fdf4',
  lightGreen:  '#f0fdf4',
  yellow:      '#fffbeb',
  red:         '#fef2f2',
  muted:       '#f9fafb',
};

function colorFor(value, thresholds) {
  if (value === null || value === undefined || value === 0) return COLORS.muted;
  if (value >= thresholds[0]) return COLORS.brightGreen;
  if (value >= thresholds[1]) return COLORS.lightGreen;
  if (value >= thresholds[2]) return COLORS.yellow;
  return COLORS.red;
}

function bgFor(value, thresholds) {
  if (value === null || value === undefined || value === 0) return BG.muted;
  if (value >= thresholds[0]) return BG.brightGreen;
  if (value >= thresholds[1]) return BG.lightGreen;
  if (value >= thresholds[2]) return BG.yellow;
  return BG.red;
}

// Threshold arrays: [brightGreen, lightGreen, yellow] — below yellow = red
const T = {
  quality:     [98, 96, 94],
  response:    [60, 50, 40],
  efficiency:  [85, 80, 75],
  productivity:[105, 98, 92],
};

export function getMetricColor(metric, value) {
  return colorFor(value, T[metric] || T.quality);
}

export function getMetricBg(metric, value) {
  return bgFor(value, T[metric] || T.quality);
}

export function getMetricLabel(metric, value) {
  if (value === null || value === undefined || value === 0) return 'No data';
  const t = T[metric] || T.quality;
  if (value >= t[0]) return 'Excellent';
  if (value >= t[1]) return 'Good';
  if (value >= t[2]) return 'Fair';
  return 'Needs Attention';
}

// Legacy helpers (used in a few places — route through quality thresholds as default)
export function getScoreColor(value) { return colorFor(value, T.quality); }
export function getScoreBg(value)    { return bgFor(value, T.quality); }
export function getScoreLabel(value) { return getMetricLabel('quality', value); }

export function formatScore(val) {
  if (val === null || val === undefined || val === 0) return '—';
  return `${val}%`;
}

/**
 * SMS scorecard message — supports custom template from localStorage.
 * Quality Score = Avg. column (avgSurveyScore).
 */
export function buildScorecardMessage(tech, weekLabel, customTemplate) {
  const week = weekLabel || 'this week';
  const name = tech.firstName || tech.fullName?.split(' ')[0] || '';

  // Use custom template if provided, otherwise check localStorage, then default
  const template = customTemplate
    || (typeof window !== 'undefined' && localStorage.getItem('scorecard_template'))
    || null;

  if (template) {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      const map = {
        firstName:        name,
        week,
        qualityScore:     tech.avgSurveyScore  ?? '—',
        responseRate:     tech.responseRate     ?? '—',
        efficiencyScore:  tech.efficiencyScore  ?? '—',
        productivityScore: tech.qualityScore    ?? '—',
        weeklyUnexcused:  tech.weeklyUnexcused  ?? 0,
        rollingUnexcused: tech.rollingUnexcused ?? 0,
        weeklyLate:       tech.weeklyLate       ?? 0,
      };
      return map[key] !== undefined ? map[key] : `{${key}}`;
    });
  }

  // Default built-in template
  const lines = [
    `Hi ${name}! Here's your Better Life scorecard for ${week}:`,
    '',
  ];

  if (tech.avgSurveyScore > 0)  lines.push(`⭐ Quality Score: ${tech.avgSurveyScore}%`);
  if (tech.responseRate > 0)    lines.push(`📋 Customer Response Rate: ${tech.responseRate}%`);
  if (tech.efficiencyScore > 0) lines.push(`⚡ Efficiency: ${tech.efficiencyScore}%`);
  if (tech.qualityScore > 0)    lines.push(`📈 Productivity: ${tech.qualityScore}%`);

  lines.push('');
  lines.push(`📅 Unplanned Absences:`);
  lines.push(`   This week: ${tech.weeklyUnexcused ?? 0}`);
  if (tech.rollingUnexcused !== null && tech.rollingUnexcused !== undefined) {
    lines.push(`   Rolling 6 months: ${tech.rollingUnexcused}`);
  }
  if (tech.weeklyLate > 0) lines.push(`   Late this week: ${tech.weeklyLate}`);

  lines.push('');
  lines.push('Keep up the great work! Questions? Reply to this message.');

  return lines.join('\n');
}

/**
 * Normalize a name for fuzzy matching
 */
export function normalizeName(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

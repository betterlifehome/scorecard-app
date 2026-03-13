/**
 * Generate the default SMS scorecard message for a technician.
 * Does NOT include overall score — that is an internal metric only.
 */
export function buildScorecardMessage(tech, weekLabel) {
  const week = weekLabel || 'this week';
  const name = tech.firstName || tech.fullName.split(' ')[0];

  const lines = [
    `Hi ${name}! Here's your Better Life scorecard for ${week}:`,
    '',
  ];

  if (tech.avgSurveyScore > 0) {
    lines.push(`⭐ Quality Score: ${tech.avgSurveyScore}%`);
  }
  if (tech.responseRate > 0) {
    lines.push(`📋 Customer Response Rate: ${tech.responseRate}%`);
  }
  if (tech.efficiencyScore > 0) {
    lines.push(`⚡ Efficiency: ${tech.efficiencyScore}%`);
  }

  lines.push('');
  lines.push(`📅 Unplanned Absences:`);
  lines.push(`   This week: ${tech.weeklyUnexcused ?? 0}`);
  if (tech.rollingUnexcused !== null && tech.rollingUnexcused !== undefined) {
    lines.push(`   Rolling 6 months: ${tech.rollingUnexcused}`);
  }
  if (tech.weeklyLate > 0) {
    lines.push(`   Late this week: ${tech.weeklyLate}`);
  }

  lines.push('');
  lines.push('Keep up the great work! Questions? Reply to this message.');

  return lines.join('\n');
}

export function getScoreColor(score) {
  if (score === null || score === undefined || score === 0) return 'var(--ink-300)';
  if (score >= 90) return 'var(--score-excellent)';
  if (score >= 80) return 'var(--score-good)';
  if (score >= 70) return 'var(--score-fair)';
  return 'var(--score-poor)';
}

export function getScoreBg(score) {
  if (score === null || score === undefined || score === 0) return 'var(--ink-050)';
  if (score >= 90) return '#e8f5ee';
  if (score >= 80) return '#eef5e8';
  if (score >= 70) return '#fff4e0';
  return '#fdecea';
}

export function getScoreLabel(score) {
  if (score === null || score === undefined || score === 0) return 'No data';
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Fair';
  return 'Needs Attention';
}

export function formatScore(val) {
  if (val === null || val === undefined || val === 0) return '—';
  return `${val}%`;
}

/**
 * Normalize a name for fuzzy matching — strips spaces, punctuation, accents, lowercases.
 * e.g. "O'Brien" → "obrien", "De La Cruz" → "delacruz"
 */
export function normalizeName(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]/g, '');      // remove spaces, punctuation
}

const XLSX = require('xlsx');

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Better Life Home Cleaning — Report Parser
 *
 * Both reports (weekly and 6-month rolling) export from the same CRM screen
 * with IDENTICAL column structure. Columns are positional (not named lookups):
 *
 *  A  = Last name
 *  B  = First name
 *  G  = Worked (days)
 *  H  = Excused absences
 *  I  = Unexcused absences  ← UNPLANNED ABSENCES
 *  J  = Late
 *  K  = Off
 *  L  = Score (quality score 0–100)
 *  M  = Jobs completed
 *  T  = Total surveys sent
 *  Z  = Avg. (average survey score, used as productivity proxy)
 *  AA = Response Rate (%) ← CUSTOMER RESPONSE RATE
 *  AB = Job Hours
 *  AC = Clock Hours
 *  AD = Revenue
 *  AE = Efficiency (%)  ← EFFICIENCY SCORE
 *
 * The file has NO employee ID column. Matching between the two reports is
 * done by normalised full name (Last + First).
 *
 * Non-technician rows (Score=0, Worked=0) are filtered out automatically.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Column letter → zero-based index helper
function colToIdx(col) {
  col = col.toUpperCase();
  let idx = 0;
  for (let i = 0; i < col.length; i++) {
    idx = idx * 26 + (col.charCodeAt(i) - 64);
  }
  return idx - 1; // 0-based
}

const COL = {
  lastName:     colToIdx('A'),   // 0
  firstName:    colToIdx('B'),   // 1
  worked:       colToIdx('G'),   // 6
  excused:      colToIdx('H'),   // 7
  unexcused:    colToIdx('I'),   // 8  ← unplanned absences
  late:         colToIdx('J'),   // 9
  off:          colToIdx('K'),   // 10
  score:        colToIdx('L'),   // 11 ← quality score
  jobs:         colToIdx('M'),   // 12
  totalSurveys: colToIdx('T'),   // 19
  avgSurvey:    colToIdx('Z'),   // 25 ← productivity proxy
  responseRate: colToIdx('AA'),  // 26 ← customer response rate
  jobHours:     colToIdx('AB'),  // 27
  clockHours:   colToIdx('AC'),  // 28
  revenue:      colToIdx('AD'),  // 29
  efficiency:   colToIdx('AE'),  // 30 ← efficiency score
};

/**
 * Parse an uploaded file buffer into a 2D array of rows.
 * Row 0 = headers, Row 1+ = data.
 * Accepts .xlsx, .xls, and .csv files.
 */
function parseFileBuffer(buffer, originalName) {
  const ext = (originalName || '').split('.').pop().toLowerCase();

  let workbook;
  if (ext === 'csv') {
    workbook = XLSX.read(buffer, { type: 'buffer', raw: false });
  } else if (['xlsx', 'xls'].includes(ext)) {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } else {
    throw new Error(`Unsupported file type: .${ext}. Please upload .xlsx, .xls, or .csv`);
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // sheet_to_json with header:1 returns raw 2D array, preserving column positions
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (!rows || rows.length < 2) {
    throw new Error('The file appears to be empty or has no data rows.');
  }

  return rows;
}

/**
 * Convert a cell value to a float, returning null if not parseable.
 */
function toFloat(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = parseFloat(String(val));
  return isNaN(n) ? null : n;
}

/**
 * Convert to integer count (absences, days worked, etc.).
 */
function toInt(val) {
  const n = toFloat(val);
  return n === null ? 0 : Math.round(n);
}

/**
 * Round a float score to 1 decimal place, or return null.
 */
function roundScore(val) {
  const n = toFloat(val);
  return n === null ? null : Math.round(n * 10) / 10;
}

/**
 * Build a normalised key for name matching: "lastname firstname" → "lastnamefirstname"
 */
function nameKey(last, first) {
  const normalize = s => String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  return `${normalize(last)}${normalize(first)}`;
}

/**
 * Determine whether a row represents an active technician.
 * Filters out header row, non-tech admin accounts, and completely inactive employees.
 * We keep rows where either Worked > 0 OR (Unexcused|Excused|Late > 0) so that
 * employees on leave still appear in the 6-month rolling totals.
 */
function isActiveTechnician(row) {
  const lastName  = String(row[COL.lastName]  || '').trim();
  const firstName = String(row[COL.firstName] || '').trim();

  // Skip header row
  if (lastName === 'Last name') return false;

  // Skip known non-technician accounts
  const nonTechKeywords = ['accounting', 'dispatch', 'payroll', 'media', 'strategies',
                            'supporting', 'center', 'larison', 'social', 'nineteen'];
  const fullLower = `${lastName} ${firstName}`.toLowerCase();
  if (nonTechKeywords.some(kw => fullLower.includes(kw))) return false;

  // Skip completely blank rows
  if (!lastName && !firstName) return false;

  return true;
}

/**
 * Parse a report (weekly OR 6-month) from a 2D row array.
 * Returns an array of structured employee objects.
 */
function parseReport(rows) {
  const employees = [];

  // Skip header row (index 0)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    if (!isActiveTechnician(row)) continue;

    const lastName  = String(row[COL.lastName]  || '').trim();
    const firstName = String(row[COL.firstName] || '').trim().replace(/\s+$/, '');

    employees.push({
      lastName,
      firstName,
      fullName:     `${firstName} ${lastName}`.trim(),
      nameKey:      nameKey(lastName, firstName),

      // Attendance
      worked:       toInt(row[COL.worked]),
      excused:      toInt(row[COL.excused]),
      unexcused:    toInt(row[COL.unexcused]),   // ← unplanned absences
      late:         toInt(row[COL.late]),
      off:          toInt(row[COL.off]),

      // Performance scores
      qualityScore:  roundScore(row[COL.score]),         // L: Score (0-100)
      responseRate:  roundScore(row[COL.responseRate]),  // AA: Response Rate %
      efficiencyScore: roundScore(row[COL.efficiency]),  // AE: Efficiency %
      avgSurveyScore:  roundScore(row[COL.avgSurvey]),   // Z: Avg survey (productivity proxy)

      // Volume
      jobs:         toInt(row[COL.jobs]),
      totalSurveys: toInt(row[COL.totalSurveys]),
      revenue:      toFloat(row[COL.revenue]),
      jobHours:     toFloat(row[COL.jobHours]),
      clockHours:   toFloat(row[COL.clockHours]),
    });
  }

  return employees;
}

/**
 * Merge weekly report + 6-month rolling report by employee name.
 * The weekly file = current week performance.
 * The 6-month file = rolling period totals (used for rolling absence count).
 *
 * Returns the final scorecard array for the frontend.
 */
function mergeReports(weeklyEmployees, sixMonthEmployees) {
  // Build a lookup from the 6-month data by nameKey
  const sixMonthMap = {};
  for (const emp of sixMonthEmployees) {
    sixMonthMap[emp.nameKey] = emp;
  }

  const scorecards = [];

  for (let i = 0; i < weeklyEmployees.length; i++) {
    const w = weeklyEmployees[i];
    const s = sixMonthMap[w.nameKey] || null;

    const scorecard = {
      id:            i + 1,
      firstName:     w.firstName,
      lastName:      w.lastName,
      fullName:      w.fullName,

      // Weekly metrics (from the weekly report)
      qualityScore:   w.qualityScore,
      responseRate:   w.responseRate,
      efficiencyScore: w.efficiencyScore,
      avgSurveyScore:  w.avgSurveyScore,   // productivity proxy

      // Absences
      weeklyUnexcused: w.unexcused,        // unplanned absences this week
      weeklyLate:      w.late,
      weeklyExcused:   w.excused,
      weeklyWorked:    w.worked,

      // 6-month rolling (from 6-month report) — null if no match found
      rollingUnexcused: s ? s.unexcused : null,
      rollingLate:      s ? s.late      : null,
      rollingExcused:   s ? s.excused   : null,
      rollingWorked:    s ? s.worked    : null,

      // Volume stats (weekly)
      jobs:         w.jobs,
      totalSurveys: w.totalSurveys,
      revenue:      w.revenue,
      jobHours:     w.jobHours,
      clockHours:   w.clockHours,

      // Computed overall score
      overallScore: computeOverallScore(w),

      // Flag if employee had no match in 6-month report
      hasRollingData: s !== null,
    };

    scorecards.push(scorecard);
  }

  // Sort alphabetically by last name
  scorecards.sort((a, b) => a.lastName.localeCompare(b.lastName));

  return scorecards;
}

/**
 * Compute overall weighted score from the four key metrics.
 * Only uses metrics that have data; skips nulls.
 *
 * Weights (adjustable):
 *   Quality Score    35%
 *   Response Rate    20%
 *   Avg Survey Score 25%  (productivity proxy — survey avg from customers)
 *   Efficiency       20%
 */
function computeOverallScore(emp) {
  const metrics = [
    { value: emp.qualityScore,    weight: 0.35 },
    { value: emp.responseRate,    weight: 0.20 },
    { value: emp.avgSurveyScore,  weight: 0.25 },
    { value: emp.efficiencyScore, weight: 0.20 },
  ];

  let weightedSum  = 0;
  let totalWeight  = 0;

  for (const { value, weight } of metrics) {
    if (value !== null && value !== undefined && value > 0) {
      weightedSum += value * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return null;
  return Math.round(weightedSum / totalWeight);
}

/**
 * Build summary stats across all scorecards.
 */
function buildStats(scorecards) {
  const active = scorecards.filter(s => s.weeklyWorked > 0);

  return {
    totalTechnicians:  scorecards.length,
    activeTechnicians: active.length,
    avgQuality:        avgOf(active, 'qualityScore'),
    avgResponseRate:   avgOf(active, 'responseRate'),
    avgEfficiency:     avgOf(active, 'efficiencyScore'),
    avgSurveyScore:    avgOf(active, 'avgSurveyScore'),
    avgOverall:        avgOf(active, 'overallScore'),
    totalAbsences:     active.reduce((sum, s) => sum + (s.weeklyUnexcused || 0), 0),
  };
}

function avgOf(arr, field) {
  const vals = arr.map(r => r[field]).filter(v => v !== null && v !== undefined && v > 0);
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

/**
 * Return the header row from a parsed 2D array (for debugging).
 */
function getHeaders(rows) {
  return rows[0] || [];
}

module.exports = {
  parseFileBuffer,
  parseReport,
  mergeReports,
  buildStats,
  getHeaders,
  // Legacy exports kept for compatibility
  parseWeeklyReport:   parseReport,
  parseSixMonthReport: parseReport,
};

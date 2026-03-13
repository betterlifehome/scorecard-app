const express = require('express');
const router = express.Router();
const db = require('../lib/db');

const BENEFIT_THRESHOLD = 130;

// GET /api/history/scorecards?weekOf=2026-03-10
// Returns scorecards for a week (latest if no weekOf param)
router.get('/scorecards', async (req, res) => {
  try {
    const { weekOf } = req.query;
    const rows = await db.getScorecardsByWeek(weekOf || null);

    if (!rows.length) return res.json({ scorecards: [], weekOf: null });

    // Map DB rows back to scorecard shape the frontend expects
    const scorecards = rows.map((r, i) => ({
      id:              i + 1,
      firstName:       r.first_name,
      lastName:        r.last_name,
      fullName:        `${r.first_name} ${r.last_name}`.trim(),
      nameKey:         r.name_key,
      weekOf:          r.week_of,

      // Scores — DB stores avg_survey_score as quality display
      avgSurveyScore:   r.avg_survey_score  != null ? parseFloat(r.avg_survey_score)  : null,
      qualityScore:     r.quality_score     != null ? parseFloat(r.quality_score)     : null,
      responseRate:     r.response_rate     != null ? parseFloat(r.response_rate)     : null,
      efficiencyScore:  r.efficiency_score  != null ? parseFloat(r.efficiency_score)  : null,
      overallScore:     r.overall_score     != null ? parseFloat(r.overall_score)     : null,

      // Attendance
      weeklyWorked:    r.days_worked   || 0,
      weeklyUnexcused: r.unexcused     || 0,
      weeklyExcused:   r.excused       || 0,
      weeklyLate:      r.late          || 0,
      rollingUnexcused: null, // not stored per-week in DB
      rollingLate:      null,
      hasRollingData:   false,

      // Volume
      jobs:        r.jobs                                    || 0,
      jobHours:    r.job_hours   != null ? parseFloat(r.job_hours)   : null,
      clockHours:  r.clock_hours != null ? parseFloat(r.clock_hours) : null,
      revenue:     r.revenue     != null ? parseFloat(r.revenue)     : null,
    }));

    const weekOfStr = rows[0].week_of instanceof Date
      ? rows[0].week_of.toISOString().split('T')[0]
      : String(rows[0].week_of).split('T')[0];

    res.json({ scorecards, weekOf: weekOfStr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/months', async (req, res) => {
  try {
    const months = await db.getAvailableMonths();
    res.json(months);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history/weeks — list all weeks with data
router.get('/weeks', async (req, res) => {
  try {
    const weeks = await db.getAvailableWeeks();
    res.json(weeks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history/monthly?year=2026&month=3
// Returns monthly hours summary with benefit eligibility flags
router.get('/monthly', async (req, res) => {
  try {
    const { year, month } = req.query;
    const rows = await db.getMonthlyHours(
      year  ? parseInt(year)  : null,
      month ? parseInt(month) : null,
    );

    // Group by employee, then by year+month
    const byEmployee = {};
    for (const row of rows) {
      const key = row.name_key;
      if (!byEmployee[key]) {
        byEmployee[key] = {
          nameKey:   key,
          firstName: row.first_name,
          lastName:  row.last_name,
          months: [],
        };
      }
      byEmployee[key].months.push({
        year:            row.year,
        month:           row.month,
        clockHours:      parseFloat(row.total_clock_hours || 0),
        jobHours:        parseFloat(row.total_job_hours   || 0),
        daysWorked:      parseInt(row.total_days          || 0),
        jobs:            parseInt(row.total_jobs          || 0),
        benefitEligible: parseFloat(row.total_clock_hours || 0) >= BENEFIT_THRESHOLD,
      });
    }

    const employees = Object.values(byEmployee).sort((a, b) =>
      a.lastName.localeCompare(b.lastName)
    );

    res.json({ employees, threshold: BENEFIT_THRESHOLD });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history/employee/:nameKey
router.get('/employee/:nameKey', async (req, res) => {
  try {
    const rows = await db.getEmployeeHistory(req.params.nameKey);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

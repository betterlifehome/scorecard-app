const express = require('express');
const router = express.Router();
const db = require('../lib/db');

const BENEFIT_THRESHOLD = 130;

// GET /api/history/months — list all months with data
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

const express = require('express');
const multer = require('multer');
const {
  parseFileBuffer,
  parseReport,
  mergeReports,
  buildStats,
  getHeaders,
} = require('../lib/reportParser');
const db = require('../lib/db');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (['xlsx', 'xls', 'csv'].includes(ext)) cb(null, true);
    else cb(new Error('Only .xlsx, .xls, and .csv files are accepted.'));
  },
});

router.post('/process', upload.fields([
  { name: 'weeklyReport', maxCount: 1 },
  { name: 'sixMonthReport', maxCount: 1 },
]), async (req, res) => {
  try {
    if (!req.files?.weeklyReport)   return res.status(400).json({ error: 'Weekly report file is required.' });
    if (!req.files?.sixMonthReport) return res.status(400).json({ error: '6-month report file is required.' });

    const weeklyFile   = req.files.weeklyReport[0];
    const sixMonthFile = req.files.sixMonthReport[0];

    const weeklyRaw   = parseFileBuffer(weeklyFile.buffer,   weeklyFile.originalname);
    const sixMonthRaw = parseFileBuffer(sixMonthFile.buffer, sixMonthFile.originalname);

    const weeklyData   = parseReport(weeklyRaw);
    const sixMonthData = parseReport(sixMonthRaw);

    const scorecards = mergeReports(weeklyData, sixMonthData);
    const stats      = buildStats(scorecards);

    let weekOf = req.body.weekOf || getThisMonday();

    let saved = false;
    try {
      await db.saveWeeklySnapshot(weekOf, scorecards);
      saved = true;
      console.log(`✅ Saved ${scorecards.length} scorecards for week ${weekOf}`);
    } catch (dbErr) {
      console.error('❌ DB save error:', dbErr.message, dbErr.stack);
    }

    res.json({
      success: true,
      weekOf,
      savedToHistory: saved,
      stats,
      scorecards,
      _debug: {
        weeklyHeaders:   getHeaders(weeklyRaw),
        sixMonthHeaders: getHeaders(sixMonthRaw),
        weeklyCount:     weeklyData.length,
        sixMonthCount:   sixMonthData.length,
      },
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(400).json({ error: err.message || 'Failed to process reports.' });
  }
});

function getThisMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

module.exports = router;

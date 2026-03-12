const express = require('express');
const multer = require('multer');
const {
  parseFileBuffer,
  parseReport,
  mergeReports,
  buildStats,
  getHeaders,
} = require('../lib/reportParser');

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

/**
 * POST /api/upload/process
 * Both files use the same CRM export format.
 * weeklyReport   = current week (shorter date range)
 * sixMonthReport = rolling 6-month period (longer date range)
 */
router.post('/process', upload.fields([
  { name: 'weeklyReport', maxCount: 1 },
  { name: 'sixMonthReport', maxCount: 1 },
]), (req, res) => {
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

    res.json({
      success: true,
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

module.exports = router;

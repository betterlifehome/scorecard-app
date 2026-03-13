const express = require('express');
const multer  = require('multer');
const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');
const db   = require('../lib/db');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

function nameKey(first, last) {
  const normalize = s => String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  return `${normalize(last)}${normalize(first)}`;
}

// GET all employees
router.get('/', async (req, res) => {
  try {
    const employees = await db.getEmployees();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST upload Excel or CSV roster
router.post('/upload', upload.single('roster'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = (req.file.originalname || '').split('.').pop().toLowerCase();
    let records = [];

    if (ext === 'csv') {
      records = parse(req.file.buffer.toString(), { columns: true, skip_empty_lines: true, trim: true });
    } else if (['xlsx', 'xls'].includes(ext)) {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      records = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    } else {
      return res.status(400).json({ error: 'Only .xlsx, .xls, or .csv files are accepted.' });
    }

    const employees = records.map(r => {
      const firstName = r.first_name || r.firstName || r['First Name'] || r['FIRST NAME'] || '';
      const lastName  = r.last_name  || r.lastName  || r['Last Name']  || r['LAST NAME']  || '';
      return {
        firstName,
        lastName,
        email:   r.email || r.Email || r['Email'] || r['EMAIL'] || '',
        phone:   r.phone || r.Phone || r.mobile   || r['Phone'] || r['Mobile'] || '',
        nameKey: nameKey(firstName, lastName),
      };
    }).filter(e => e.firstName && e.lastName);

    await db.upsertEmployees(employees);
    res.json({ success: true, count: employees.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add or update single employee
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    if (!firstName || !lastName) return res.status(400).json({ error: 'firstName and lastName required' });
    const key = nameKey(firstName, lastName);
    await db.upsertEmployee({ nameKey: key, firstName, lastName, email, phone });
    res.json({ success: true, employee: { nameKey: key, firstName, lastName, email, phone } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update employee (edit in place)
router.put('/:nameKey', async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    if (!firstName || !lastName) return res.status(400).json({ error: 'firstName and lastName required' });
    // If name changed, delete old and insert new
    const newKey = nameKey(firstName, lastName);
    if (newKey !== req.params.nameKey) {
      await db.deleteEmployee(req.params.nameKey);
    }
    await db.upsertEmployee({ nameKey: newKey, firstName, lastName, email, phone });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE employee
router.delete('/:nameKey', async (req, res) => {
  try {
    await db.deleteEmployee(req.params.nameKey);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

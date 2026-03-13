const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Simple file-based storage for employees (no DB needed)
const DATA_FILE = path.join(__dirname, '../data/employees.json');

function loadEmployees() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch { return []; }
}

function saveEmployees(employees) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(employees, null, 2));
}

function nameKey(first, last) {
  const normalize = s => String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  return `${normalize(last)}${normalize(first)}`;
}

// GET all employees
router.get('/', (req, res) => {
  res.json(loadEmployees());
});

// POST upload CSV or Excel roster
// Expected columns: first_name, last_name, email, phone
router.post('/upload', upload.single('roster'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = (req.file.originalname || '').split('.').pop().toLowerCase();
    let records = [];

    if (ext === 'csv') {
      records = parse(req.file.buffer.toString(), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } else if (['xlsx', 'xls'].includes(ext)) {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      records = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    } else {
      return res.status(400).json({ error: 'Only .xlsx, .xls, or .csv files are accepted.' });
    }

    const employees = records.map(r => ({
      firstName: r.first_name || r.firstName || r['First Name'] || r['FIRST NAME'] || '',
      lastName:  r.last_name  || r.lastName  || r['Last Name']  || r['LAST NAME']  || '',
      email:     r.email      || r.Email     || r['Email']      || r['EMAIL']      || '',
      phone:     r.phone      || r.Phone     || r.mobile        || r['Phone']      || r['Mobile'] || '',
    }))
    .map(e => ({ ...e, nameKey: nameKey(e.firstName, e.lastName) }))
    .filter(e => e.firstName && e.lastName);

    saveEmployees(employees);
    res.json({ success: true, count: employees.length, employees });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add/update single employee
router.post('/', (req, res) => {
  const { firstName, lastName, email, phone } = req.body;
  if (!firstName || !lastName) return res.status(400).json({ error: 'firstName and lastName required' });

  const employees = loadEmployees();
  const key = nameKey(firstName, lastName);
  const idx = employees.findIndex(e => e.nameKey === key);
  const employee = { firstName, lastName, email: email || '', phone: phone || '', nameKey: key };

  if (idx >= 0) employees[idx] = employee;
  else employees.push(employee);

  saveEmployees(employees);
  res.json({ success: true, employee });
});

// DELETE employee
router.delete('/:nameKey', (req, res) => {
  const employees = loadEmployees().filter(e => e.nameKey !== req.params.nameKey);
  saveEmployees(employees);
  res.json({ success: true });
});

module.exports = router;
module.exports.loadEmployees = loadEmployees;
module.exports.nameKey = nameKey;

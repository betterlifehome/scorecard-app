# Tech Scorecard App

A weekly scorecard system for cleaning technicians. Upload two reports from your CRM/ERP, generate individual scorecards showing quality, productivity, efficiency, response rate, and absence data, then send them directly via SMS through Twilio.

---

## Project Structure

```
scorecard-app/
├── backend/                  # Node.js/Express API server
│   ├── lib/
│   │   └── reportParser.js   # Parses XLSX/CSV, merges reports
│   ├── routes/
│   │   ├── upload.js         # File upload & processing endpoints
│   │   └── sms.js            # Twilio SMS endpoints
│   ├── sample-data/          # Sample CSVs for testing
│   ├── server.js             # Express entry point
│   └── .env.example          # Environment variable template
│
├── frontend/                 # React + Vite app
│   └── src/
│       ├── components/       # Layout, BulkSMSModal
│       ├── pages/            # Upload, Scorecards, TechDetail
│       └── lib/              # API client, scorecard utilities
│
└── package.json              # Root scripts (dev/build)
```

---

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo-url>
cd scorecard-app
npm run install:all
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM_NUMBER=+15551234567
```

**Getting Twilio credentials:**
1. Sign up at https://www.twilio.com
2. From the Console Dashboard, copy your Account SID and Auth Token
3. Buy a phone number (or use your trial number) — this is your FROM number
4. Costs ~$1/month per number + $0.0079/SMS

### 3. Run in development

```bash
npm run dev
```

This starts both servers:
- **Backend:** http://localhost:3001
- **Frontend:** http://localhost:5173 (opens in browser)

---

## Report Format

The app auto-detects column names from your CRM/ERP export. You don't need to rename columns — it looks for common variations.

### Weekly Performance Report (required columns)
| Data | Recognised column names |
|------|-------------------------|
| Employee ID | `employee_id`, `emp_id`, `id`, `tech_id` |
| Employee Name | `employee_name`, `name`, `technician` |
| Quality Score | `quality_score`, `quality`, `audit_score` |
| Response Rate | `response_rate`, `survey_response_rate` |
| Productivity | `productivity_score`, `productivity` |
| Efficiency | `efficiency_score`, `efficiency` |
| Absences (weekly) | `unplanned_absences`, `absences`, `callouts` |
| Phone | `phone`, `mobile`, `cell` |
| Week Of | `week_of`, `week`, `period`, `date` |

Scores can be entered as `85`, `85%`, or `0.85` — all are handled.

### 6-Month Absence Report (required columns)
| Data | Recognised column names |
|------|-------------------------|
| Employee ID | `employee_id`, `emp_id`, `id` |
| Employee Name | `employee_name`, `name`, `technician` |
| Rolling Absences | `unplanned_absences`, `rolling_absences`, `ytd_absences` |

Records are matched by Employee ID first, then by name.

---

## Score Weights

Overall score is a weighted average:

| Metric | Weight |
|--------|--------|
| Quality | 35% |
| Productivity | 25% |
| Response Rate | 20% |
| Efficiency | 20% |

To change weights, edit `backend/lib/reportParser.js` → `computeOverallScore()`.

---

## SMS Setup

After configuring Twilio in `.env`, SMS sends automatically from the app.

Phone numbers are normalised to E.164 format:
- `5551234567` → `+15551234567`
- `15551234567` → `+15551234567`
- `+15551234567` → unchanged

The default SMS message is auto-generated but fully editable before sending.

---

## Deployment (Production)

### Simple VPS (DigitalOcean, Linode, AWS EC2)

1. Upload code to your server
2. Install Node.js 18+
3. Set up your `.env` with `NODE_ENV=production`
4. Build the frontend:
   ```bash
   npm run build
   ```
5. Start the server (which serves the built frontend):
   ```bash
   npm start
   ```
6. Use **PM2** to keep it running:
   ```bash
   npm install -g pm2
   pm2 start backend/server.js --name scorecard
   pm2 save
   pm2 startup
   ```
7. Set up Nginx as a reverse proxy on port 80/443 (optional but recommended for HTTPS)

### Nginx config example

```nginx
server {
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Testing with Sample Data

Sample files are in `backend/sample-data/`:
- `weekly_report_sample.csv`
- `sixmonth_absences_sample.csv`

Upload both on the Upload page to see scorecards generated immediately.

---

## Adding More Features

The codebase is structured to grow:
- **Dashboards:** Add new pages in `frontend/src/pages/` — data is already in context
- **History:** Store processed results in a SQLite or Postgres DB (add a `db/` module to backend)
- **Auth:** Add express-session or JWT middleware on the API routes
- **Custom score weights:** Expose weight config via the UI, store in `.env` or DB

---

## Support

For Twilio issues, check the [Twilio Console](https://console.twilio.com) → Monitor → Logs → Errors.
For column mapping issues, check the browser console — the API returns `_debug.weeklyHeaders` showing what columns were detected.

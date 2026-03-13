const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false,
});

/**
 * Initialize database tables on startup
 */
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS weekly_snapshots (
        id          SERIAL PRIMARY KEY,
        week_of     DATE NOT NULL,
        name_key    TEXT NOT NULL,
        first_name  TEXT,
        last_name   TEXT,
        -- Hours & days
        days_worked     INTEGER DEFAULT 0,
        job_hours       NUMERIC(8,2),
        clock_hours     NUMERIC(8,2),
        jobs            INTEGER DEFAULT 0,
        -- Scores
        quality_score     NUMERIC(5,1),
        response_rate     NUMERIC(5,1),
        efficiency_score  NUMERIC(5,1),
        avg_survey_score  NUMERIC(5,1),
        overall_score     NUMERIC(5,1),
        -- Absences
        unexcused   INTEGER DEFAULT 0,
        excused     INTEGER DEFAULT 0,
        late        INTEGER DEFAULT 0,
        -- Revenue
        revenue     NUMERIC(10,2),
        -- Metadata
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(week_of, name_key)
      );

      CREATE INDEX IF NOT EXISTS idx_snapshots_name_key ON weekly_snapshots(name_key);
      CREATE INDEX IF NOT EXISTS idx_snapshots_week_of  ON weekly_snapshots(week_of);

      CREATE TABLE IF NOT EXISTS employees (
        name_key    TEXT PRIMARY KEY,
        first_name  TEXT NOT NULL,
        last_name   TEXT NOT NULL,
        email       TEXT DEFAULT '',
        phone       TEXT DEFAULT '',
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Database initialized');
  } catch (err) {
    console.error('❌ DB init error:', err.message);
  } finally {
    client.release();
  }
}

/**
 * Get all employees
 */
async function getEmployees() {
  const res = await pool.query(`SELECT * FROM employees ORDER BY last_name, first_name`);
  return res.rows.map(r => ({
    nameKey:   r.name_key,
    firstName: r.first_name,
    lastName:  r.last_name,
    email:     r.email || '',
    phone:     r.phone || '',
  }));
}

/**
 * Upsert a single employee
 */
async function upsertEmployee({ nameKey, firstName, lastName, email, phone }) {
  await pool.query(`
    INSERT INTO employees (name_key, first_name, last_name, email, phone, updated_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    ON CONFLICT (name_key) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name  = EXCLUDED.last_name,
      email      = EXCLUDED.email,
      phone      = EXCLUDED.phone,
      updated_at = NOW()
  `, [nameKey, firstName, lastName, email || '', phone || '']);
}

/**
 * Upsert many employees (bulk import)
 */
async function upsertEmployees(employees) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const emp of employees) {
      await client.query(`
        INSERT INTO employees (name_key, first_name, last_name, email, phone, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (name_key) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name  = EXCLUDED.last_name,
          email      = EXCLUDED.email,
          phone      = EXCLUDED.phone,
          updated_at = NOW()
      `, [emp.nameKey, emp.firstName, emp.lastName, emp.email || '', emp.phone || '']);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Delete an employee by nameKey
 */
async function deleteEmployee(nameKey) {
  await pool.query(`DELETE FROM employees WHERE name_key = $1`, [nameKey]);
}


 * weekOf: 'YYYY-MM-DD' string (Monday of the week)
 */
async function saveWeeklySnapshot(weekOf, scorecards) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const sc of scorecards) {
      await client.query(`
        INSERT INTO weekly_snapshots (
          week_of, name_key, first_name, last_name,
          days_worked, job_hours, clock_hours, jobs,
          quality_score, response_rate, efficiency_score, avg_survey_score, overall_score,
          unexcused, excused, late, revenue
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        ON CONFLICT (week_of, name_key) DO UPDATE SET
          first_name       = EXCLUDED.first_name,
          last_name        = EXCLUDED.last_name,
          days_worked      = EXCLUDED.days_worked,
          job_hours        = EXCLUDED.job_hours,
          clock_hours      = EXCLUDED.clock_hours,
          jobs             = EXCLUDED.jobs,
          quality_score    = EXCLUDED.quality_score,
          response_rate    = EXCLUDED.response_rate,
          efficiency_score = EXCLUDED.efficiency_score,
          avg_survey_score = EXCLUDED.avg_survey_score,
          overall_score    = EXCLUDED.overall_score,
          unexcused        = EXCLUDED.unexcused,
          excused          = EXCLUDED.excused,
          late             = EXCLUDED.late,
          revenue          = EXCLUDED.revenue
      `, [
        weekOf,
        sc.nameKey,
        sc.firstName,
        sc.lastName,
        sc.weeklyWorked   || 0,
        sc.jobHours       || null,
        sc.clockHours     || null,
        sc.jobs           || 0,
        sc.qualityScore   || null,
        sc.responseRate   || null,
        sc.efficiencyScore || null,
        sc.avgSurveyScore  || null,
        sc.overallScore   || null,
        sc.weeklyUnexcused || 0,
        sc.weeklyExcused   || 0,
        sc.weeklyLate      || 0,
        sc.revenue         || null,
      ]);
    }

    await client.query('COMMIT');
    return { success: true, count: scorecards.length };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get monthly clock hours summary for all employees.
 * Returns rows: { name_key, first_name, last_name, year, month, total_clock_hours, total_job_hours, total_days, total_jobs }
 */
async function getMonthlyHours(year, month) {
  const res = await pool.query(`
    SELECT
      name_key,
      MAX(first_name) AS first_name,
      MAX(last_name)  AS last_name,
      EXTRACT(YEAR  FROM week_of)::int AS year,
      EXTRACT(MONTH FROM week_of)::int AS month,
      SUM(clock_hours) AS total_clock_hours,
      SUM(job_hours)   AS total_job_hours,
      SUM(days_worked) AS total_days,
      SUM(jobs)        AS total_jobs
    FROM weekly_snapshots
    WHERE
      ($1::int IS NULL OR EXTRACT(YEAR  FROM week_of) = $1)
      AND ($2::int IS NULL OR EXTRACT(MONTH FROM week_of) = $2)
    GROUP BY name_key, year, month
    ORDER BY last_name, year, month
  `, [year || null, month || null]);
  return res.rows;
}

/**
 * Get all months that have data
 */
async function getAvailableMonths() {
  const res = await pool.query(`
    SELECT DISTINCT
      EXTRACT(YEAR  FROM week_of)::int AS year,
      EXTRACT(MONTH FROM week_of)::int AS month
    FROM weekly_snapshots
    ORDER BY year DESC, month DESC
  `);
  return res.rows;
}

/**
 * Get weekly history for a single employee
 */
async function getEmployeeHistory(nameKey) {
  const res = await pool.query(`
    SELECT *
    FROM weekly_snapshots
    WHERE name_key = $1
    ORDER BY week_of DESC
    LIMIT 52
  `, [nameKey]);
  return res.rows;
}

/**
 * Get all weeks that have been uploaded
 */
async function getAvailableWeeks() {
  const res = await pool.query(`
    SELECT DISTINCT week_of
    FROM weekly_snapshots
    ORDER BY week_of DESC
  `);
  return res.rows.map(r => r.week_of);
}

/**
 * Get scorecards for a specific week (or latest if weekOf is null)
 */
async function getScorecardsByWeek(weekOf) {
  let res;
  if (weekOf) {
    res = await pool.query(`
      SELECT * FROM weekly_snapshots
      WHERE week_of = $1
      ORDER BY last_name, first_name
    `, [weekOf]);
  } else {
    res = await pool.query(`
      SELECT * FROM weekly_snapshots
      WHERE week_of = (SELECT MAX(week_of) FROM weekly_snapshots)
      ORDER BY last_name, first_name
    `);
  }
  return res.rows;
}

module.exports = {
  pool,
  initDB,
  saveWeeklySnapshot,
  getMonthlyHours,
  getAvailableMonths,
  getEmployeeHistory,
  getAvailableWeeks,
  getScorecardsByWeek,
  getEmployees,
  upsertEmployee,
  upsertEmployees,
  deleteEmployee,
};

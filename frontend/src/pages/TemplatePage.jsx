import { useState, useEffect } from 'react';
import { FileText, Save, RotateCcw, Eye } from 'lucide-react';

const DEFAULT_TEMPLATE = `Hi {firstName}! Here's your Better Life scorecard for {week}:

⭐ Quality Score: {qualityScore}%
📋 Customer Response Rate: {responseRate}%
⚡ Efficiency: {efficiencyScore}%
📈 Productivity: {productivityScore}%

📅 Unplanned Absences:
   This week: {weeklyUnexcused}
   Rolling 6 months: {rollingUnexcused}

Keep up the great work! Questions? Reply to this message.`;

const SAMPLE = {
  firstName: 'Stephanie',
  week: 'this week',
  qualityScore: '97.4',
  responseRate: '88.9',
  efficiencyScore: '85.7',
  productivityScore: '96.0',
  weeklyUnexcused: '0',
  rollingUnexcused: '0',
};

const VARIABLES = [
  { token: '{firstName}',        desc: "Tech's first name" },
  { token: '{week}',             desc: 'Week label (e.g. "this week")' },
  { token: '{qualityScore}',     desc: 'Quality / Avg. score (col Z)' },
  { token: '{responseRate}',     desc: 'Customer response rate (col AA)' },
  { token: '{efficiencyScore}',  desc: 'Efficiency score (col AE)' },
  { token: '{productivityScore}',desc: 'Productivity score (col L)' },
  { token: '{weeklyUnexcused}',  desc: 'Unexcused absences this week' },
  { token: '{rollingUnexcused}', desc: 'Unexcused absences rolling 6mo' },
  { token: '{weeklyLate}',       desc: 'Late count this week' },
];

function renderTemplate(template, data) {
  return template.replace(/\{(\w+)\}/g, (_, key) => data[key] ?? `{${key}}`);
}

export default function TemplatePage() {
  const [template, setTemplate] = useState('');
  const [saved, setSaved]       = useState(false);
  const [preview, setPreview]   = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('scorecard_template');
    setTemplate(stored || DEFAULT_TEMPLATE);
  }, []);

  function handleSave() {
    localStorage.setItem('scorecard_template', template);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    if (window.confirm('Reset to the default template?')) {
      setTemplate(DEFAULT_TEMPLATE);
      localStorage.removeItem('scorecard_template');
    }
  }

  function insertToken(token) {
    setTemplate(t => t + token);
  }

  const previewText = renderTemplate(template, SAMPLE);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FileText size={24} color="var(--brand)" />
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>SMS Template Editor</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-400)', margin: 0 }}>
              Customize the scorecard message sent to technicians
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setPreview(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', background: preview ? 'var(--brand-light)' : 'var(--ink-050)', border: '1px solid var(--ink-100)', borderRadius: 8, fontSize: '0.875rem', cursor: 'pointer', color: preview ? 'var(--brand)' : 'var(--ink-600)', fontWeight: 500 }}
          >
            <Eye size={14} /> {preview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={handleReset}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', background: 'none', border: '1px solid var(--ink-100)', borderRadius: 8, fontSize: '0.875rem', cursor: 'pointer', color: 'var(--ink-500)' }}
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            onClick={handleSave}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', background: saved ? '#16a34a' : 'var(--brand)', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <Save size={14} /> {saved ? 'Saved!' : 'Save Template'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '1.25rem', alignItems: 'start' }}>
        {/* Editor / Preview */}
        <div>
          {preview ? (
            <div style={{ background: 'var(--white)', border: '1px solid var(--ink-100)', borderRadius: 12, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Preview — sample data
              </div>
              {/* SMS bubble */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ background: '#0b93f6', color: '#fff', borderRadius: '18px 18px 4px 18px', padding: '12px 16px', maxWidth: '80%', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: '-apple-system, sans-serif' }}>
                  {previewText}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--ink-300)', marginTop: 6 }}>
                {previewText.length} characters
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--white)', border: '1px solid var(--ink-100)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '0.6rem 1rem', background: 'var(--ink-050)', borderBottom: '1px solid var(--ink-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--ink-400)', fontWeight: 500 }}>Template</span>
                <span style={{ fontSize: 11, color: 'var(--ink-300)' }}>{template.length} chars</span>
              </div>
              <textarea
                value={template}
                onChange={e => setTemplate(e.target.value)}
                rows={18}
                style={{ width: '100%', padding: '1rem', border: 'none', outline: 'none', fontSize: '0.9rem', fontFamily: 'var(--font-mono, monospace)', lineHeight: 1.7, color: 'var(--ink-700)', resize: 'vertical', background: 'var(--white)', boxSizing: 'border-box' }}
              />
            </div>
          )}
        </div>

        {/* Variables sidebar */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--ink-100)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '0.75rem 1rem', background: 'var(--ink-050)', borderBottom: '1px solid var(--ink-100)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Available Variables
            </span>
          </div>
          <div style={{ padding: '0.5rem' }}>
            {VARIABLES.map(v => (
              <button
                key={v.token}
                onClick={() => insertToken(v.token)}
                title={`Click to insert ${v.token}`}
                style={{ width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', background: 'none', border: 'none', borderRadius: 6, cursor: 'pointer', marginBottom: 2 }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--brand-light)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand)', fontFamily: 'monospace' }}>{v.token}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 1 }}>{v.desc}</div>
              </button>
            ))}
          </div>
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--ink-100)', fontSize: 11, color: 'var(--ink-400)', lineHeight: 1.5 }}>
            Click any variable to insert it. Changes apply to all future scorecards sent from this browser.
          </div>
        </div>
      </div>
    </div>
  );
}

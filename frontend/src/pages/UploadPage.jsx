import { useState, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader, X, ChevronRight } from 'lucide-react';
import { processReports } from '../lib/api';
import { useApp } from '../components/Layout';

export default function UploadPage() {
  const { loadResults } = useApp();
  const [weeklyFile, setWeeklyFile] = useState(null);
  const [sixMonthFile, setSixMonthFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleProcess() {
    if (!weeklyFile || !sixMonthFile) return;
    setLoading(true);
    setError('');
    try {
      const data = await processReports(weeklyFile, sixMonthFile);
      loadResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 740, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: 'var(--ink-900)', letterSpacing: '-0.03em', marginBottom: 8 }}>
          Upload Reports
        </h1>
        <p style={{ color: 'var(--ink-500)', fontSize: 15 }}>
          Drop your weekly performance report and the 6-month absence report to generate scorecards.
        </p>
      </div>

      {/* Drop zones */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <DropZone
          label="Weekly Performance Report"
          hint="Quality · Productivity · Efficiency · Response Rate"
          file={weeklyFile}
          onFile={setWeeklyFile}
          accent="var(--brand)"
          accentBg="var(--brand-light)"
        />
        <DropZone
          label="6-Month Absence Report"
          hint="Rolling unplanned absences per technician"
          file={sixMonthFile}
          onFile={setSixMonthFile}
          accent="#1a4fa0"
          accentBg="#e8f0fc"
        />
      </div>

      {/* Column mapping hint */}
      <div style={{
        background: 'var(--white)',
        border: '1px solid var(--ink-100)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 18px',
        marginBottom: 24,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}>
        <AlertCircle size={16} color="var(--info)" style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--ink-700)' }}>Column auto-detection:</strong> The system recognises common CRM/ERP column names automatically.
          Required columns: employee name or ID, quality score, productivity, efficiency, response rate, absences, and phone number.
          Column headers don't need to match exactly.
        </div>
      </div>

      {error && (
        <div style={{
          background: 'var(--danger-bg)',
          border: '1px solid #f5c6c2',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: 20,
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          color: 'var(--danger)',
          fontSize: 14,
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      <button
        onClick={handleProcess}
        disabled={!weeklyFile || !sixMonthFile || loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 28px',
          background: weeklyFile && sixMonthFile ? 'var(--brand)' : 'var(--ink-100)',
          color: weeklyFile && sixMonthFile ? '#fff' : 'var(--ink-300)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontSize: 15,
          fontWeight: 600,
          cursor: weeklyFile && sixMonthFile && !loading ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s',
          width: '100%',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing reports…</>
        ) : (
          <>Generate Scorecards <ChevronRight size={16} /></>
        )}
      </button>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function DropZone({ label, hint, file, onFile, accent, accentBg }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFile(dropped);
  }, [onFile]);

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const containerStyle = {
    border: `2px dashed ${dragging ? accent : file ? accent : 'var(--ink-200, #d8dbe3)'}`,
    borderRadius: 'var(--radius-lg)',
    padding: '28px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s',
    background: dragging ? accentBg : file ? accentBg : 'var(--white)',
    position: 'relative',
  };

  return (
    <div
      style={containerStyle}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !file && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
      />

      {file ? (
        <>
          <CheckCircle size={28} color={accent} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: accent, marginBottom: 4 }}>
            {file.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-400, #8b909e)' }}>
            {(file.size / 1024).toFixed(1)} KB
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onFile(null); }}
            style={{
              position: 'absolute', top: 10, right: 10,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--ink-300)', padding: 4, borderRadius: 4,
            }}
            title="Remove file"
          >
            <X size={14} />
          </button>
        </>
      ) : (
        <>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: accentBg, display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 14px',
          }}>
            <FileSpreadsheet size={22} color={accent} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>
            {label}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-400, #8b909e)', marginBottom: 12, lineHeight: 1.5 }}>
            {hint}
          </div>
          <div style={{ fontSize: 12, color: accent, fontWeight: 500 }}>
            Drop file here or click to browse
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-300)', marginTop: 4 }}>
            .xlsx · .xls · .csv
          </div>
        </>
      )}
    </div>
  );
}

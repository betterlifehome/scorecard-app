import { useState, useEffect, useRef } from 'react';
import { Users, Upload, Plus, Trash2, Check, AlertCircle } from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const fileRef = useRef();

  useEffect(() => { fetchEmployees(); }, []);

  async function fetchEmployees() {
    try {
      const res = await fetch('/api/employees');
      setEmployees(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    const fd = new FormData();
    fd.append('roster', file);
    try {
      const res = await fetch('/api/employees/upload', { method: 'POST', body: fd });
      const data = await res.json();
      setUploadResult(data);
      if (data.success) fetchEmployees();
    } catch (err) {
      setUploadResult({ error: err.message });
    }
    setUploading(false);
    e.target.value = '';
  }

  async function handleAdd(e) {
    e.preventDefault();
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ firstName: '', lastName: '', email: '', phone: '' });
      setShowAdd(false);
      fetchEmployees();
    }
  }

  async function handleDelete(nameKey) {
    if (!confirm('Remove this employee?')) return;
    await fetch(`/api/employees/${nameKey}`, { method: 'DELETE' });
    fetchEmployees();
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Users size={24} color="var(--color-primary)" />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Employee Roster</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleCSV} style={{ display: 'none' }} />
          <button
            onClick={() => fileRef.current.click()}
            disabled={uploading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem' }}
          >
            <Upload size={15} /> {uploading ? 'Uploading...' : 'Upload CSV'}
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem' }}
          >
            <Plus size={15} /> Add Employee
          </button>
        </div>
      </div>

      {/* CSV format hint */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        CSV format: <code>first_name, last_name, email, phone</code> — phone optional, can add later
      </div>

      {uploadResult && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', background: uploadResult.success ? '#f0fdf4' : '#fef2f2', color: uploadResult.success ? '#166534' : '#991b1b', border: `1px solid ${uploadResult.success ? '#bbf7d0' : '#fecaca'}` }}>
          {uploadResult.success ? <Check size={16} /> : <AlertCircle size={16} />}
          {uploadResult.success ? `Imported ${uploadResult.count} employees` : uploadResult.error}
        </div>
      )}

      {showAdd && (
        <form onSubmit={handleAdd} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '1rem', marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {['firstName', 'lastName', 'email', 'phone'].map(field => (
            <input
              key={field}
              placeholder={field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
              value={form[field]}
              onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
              required={field === 'firstName' || field === 'lastName'}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.875rem' }}
            />
          ))}
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Save</button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>Loading...</p>
      ) : employees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          <Users size={40} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
          <p>No employees yet. Upload a CSV or add manually.</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
              {['Name', 'Email', 'Phone', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.nameKey} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '0.75rem' }}>{emp.firstName} {emp.lastName}</td>
                <td style={{ padding: '0.75rem', color: emp.email ? 'inherit' : 'var(--color-text-muted)' }}>{emp.email || '—'}</td>
                <td style={{ padding: '0.75rem', color: emp.phone ? 'inherit' : 'var(--color-text-muted)' }}>{emp.phone || '—'}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  <button onClick={() => handleDelete(emp.nameKey)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

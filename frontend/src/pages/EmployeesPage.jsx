import { useState, useEffect, useRef } from 'react';
import { Users, Upload, Plus, Trash2, Check, AlertCircle, Pencil, X, Save } from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [uploading, setUploading]     = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [showAdd, setShowAdd]         = useState(false);
  const [editKey, setEditKey]         = useState(null);
  const [form, setForm]               = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [editForm, setEditForm]       = useState({});
  const [search, setSearch]           = useState('');
  const fileRef = useRef();

  useEffect(() => { fetchEmployees(); }, []);

  async function fetchEmployees() {
    setLoading(true);
    try {
      const res = await fetch('/api/employees');
      setEmployees(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    const fd = new FormData();
    fd.append('roster', file);
    try {
      const res  = await fetch('/api/employees/upload', { method: 'POST', body: fd });
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

  async function handleEdit(emp) {
    setEditKey(emp.nameKey);
    setEditForm({ firstName: emp.firstName, lastName: emp.lastName, email: emp.email, phone: emp.phone });
  }

  async function handleSaveEdit(nameKey) {
    const res = await fetch(`/api/employees/${nameKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      setEditKey(null);
      fetchEmployees();
    }
  }

  async function handleDelete(nameKey, name) {
    if (!confirm(`Remove ${name} from the roster?`)) return;
    await fetch(`/api/employees/${nameKey}`, { method: 'DELETE' });
    fetchEmployees();
  }

  const filtered = employees.filter(e =>
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const inputStyle = {
    padding: '0.35rem 0.6rem',
    border: '1px solid var(--ink-100)',
    borderRadius: 6,
    fontSize: '0.82rem',
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Users size={24} color="var(--brand)" />
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Employee Roster</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-400)', margin: 0 }}>{employees.length} employees · stored in database</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleUpload} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current.click()} disabled={uploading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--white)', border: '1px solid var(--ink-100)', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
            <Upload size={15} /> {uploading ? 'Uploading...' : 'Import Excel / CSV'}
          </button>
          <button onClick={() => { setShowAdd(!showAdd); setEditKey(null); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
            <Plus size={15} /> Add Employee
          </button>
        </div>
      </div>

      {/* Format hint */}
      <div style={{ background: 'var(--ink-050)', border: '1px solid var(--ink-100)', borderRadius: 8, padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--ink-400)' }}>
        Import columns: <code>first_name, last_name, email, phone</code> — imports merge with existing roster, won't delete existing employees
      </div>

      {uploadResult && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', background: uploadResult.success ? '#f0fdf4' : '#fef2f2', color: uploadResult.success ? '#166534' : '#991b1b', border: `1px solid ${uploadResult.success ? '#bbf7d0' : '#fecaca'}`, fontSize: '0.875rem' }}>
          {uploadResult.success ? <Check size={16} /> : <AlertCircle size={16} />}
          {uploadResult.success ? `✅ Imported ${uploadResult.count} employees into database` : uploadResult.error}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} style={{ background: 'var(--white)', border: '1px solid var(--ink-100)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--ink-700)' }}>New Employee</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.6rem', marginBottom: '0.75rem' }}>
            {[['firstName','First Name'],['lastName','Last Name'],['email','Email'],['phone','Phone']].map(([field, label]) => (
              <div key={field}>
                <label style={{ fontSize: '0.75rem', color: 'var(--ink-400)', display: 'block', marginBottom: 3 }}>{label}</label>
                <input
                  placeholder={label}
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  required={field === 'firstName' || field === 'lastName'}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '0.4rem 1rem', background: 'none', border: '1px solid var(--ink-100)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
            <button type="submit" style={{ padding: '0.4rem 1rem', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
              <Save size={13} style={{ marginRight: 4 }} />Save
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      {employees.length > 5 && (
        <input
          type="text"
          placeholder="Search employees…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, marginBottom: '1rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
        />
      )}

      {/* Table */}
      {loading ? (
        <p style={{ color: 'var(--ink-400)', textAlign: 'center', padding: '2rem' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-400)' }}>
          <Users size={40} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
          <p>{employees.length === 0 ? 'No employees yet. Import a file or add manually.' : 'No employees match your search.'}</p>
        </div>
      ) : (
        <div style={{ background: 'var(--white)', border: '1px solid var(--ink-100)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--ink-050)', borderBottom: '1px solid var(--ink-100)' }}>
                {['Name', 'Email', 'Phone', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: h === 'Actions' ? 'right' : 'left', padding: '0.6rem 1rem', fontWeight: 600, color: 'var(--ink-500)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <tr key={emp.nameKey} style={{ borderBottom: '1px solid var(--ink-100)' }}>
                  {editKey === emp.nameKey ? (
                    // ── Edit row ──
                    <>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} placeholder="First" style={{ ...inputStyle, width: 90 }} />
                          <input value={editForm.lastName}  onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}  placeholder="Last"  style={{ ...inputStyle, width: 100 }} />
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" style={inputStyle} />
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" style={inputStyle} />
                      </td>
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => handleSaveEdit(emp.nameKey)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.3rem 0.75rem', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                            <Check size={13} /> Save
                          </button>
                          <button onClick={() => setEditKey(null)} style={{ display: 'flex', alignItems: 'center', padding: '0.3rem 0.6rem', background: 'none', border: '1px solid var(--ink-100)', borderRadius: 6, cursor: 'pointer' }}>
                            <X size={13} color="var(--ink-400)" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    // ── Display row ──
                    <>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{emp.firstName} {emp.lastName}</td>
                      <td style={{ padding: '0.75rem 1rem', color: emp.email ? 'var(--ink-700)' : 'var(--ink-300)' }}>{emp.email || '—'}</td>
                      <td style={{ padding: '0.75rem 1rem', color: emp.phone ? 'var(--ink-700)' : 'var(--ink-300)' }}>{emp.phone || '—'}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => handleEdit(emp)} title="Edit" style={{ background: 'none', border: '1px solid var(--ink-100)', borderRadius: 6, cursor: 'pointer', padding: '0.3rem 0.5rem', color: 'var(--ink-400)' }}>
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(emp.nameKey, `${emp.firstName} ${emp.lastName}`)} title="Delete" style={{ background: 'none', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', padding: '0.3rem 0.5rem', color: '#ef4444' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

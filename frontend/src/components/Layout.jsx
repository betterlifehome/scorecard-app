import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { createContext, useContext, useState, useEffect } from 'react';
import { ClipboardList, Upload, LayoutGrid, Users, Send, Clock, FileText } from 'lucide-react';

export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export default function Layout() {
  const navigate = useNavigate();
  const [scorecards, setScorecards] = useState([]);
  const [stats, setStats]           = useState(null);
  const [weekOf, setWeekOf]         = useState('');
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [loadingDB, setLoadingDB]   = useState(true);

  // On mount — load latest scorecards from DB so navigation never shows blank
  useEffect(() => {
    fetch('/api/history/scorecards')
      .then(r => r.json())
      .then(data => {
        if (data.scorecards?.length) {
          setScorecards(data.scorecards);
          setWeekOf(data.weekOf || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDB(false));

    fetch('/api/history/weeks')
      .then(r => r.json())
      .then(weeks => setAvailableWeeks(weeks.map(w => String(w).split('T')[0])))
      .catch(() => {});
  }, []);

  async function switchWeek(week) {
    const res = await fetch(`/api/history/scorecards?weekOf=${week}`);
    const data = await res.json();
    if (data.scorecards?.length) {
      setScorecards(data.scorecards);
      setWeekOf(data.weekOf || week);
    }
  }

  function loadResults(data) {
    setScorecards(data.scorecards || []);
    setStats(data.stats || null);
    setWeekOf(data.weekOf || '');
    // Refresh available weeks
    fetch('/api/history/weeks')
      .then(r => r.json())
      .then(weeks => setAvailableWeeks(weeks.map(w => String(w).split('T')[0])))
      .catch(() => {});
    navigate('/scorecards');
  }

  return (
    <AppContext.Provider value={{ scorecards, setScorecards, stats, setStats, weekOf, loadResults, availableWeeks, switchWeek, loadingDB }}>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{
          background: 'var(--brand-dark)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          height: 56,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClipboardList size={20} color="#6be8a8" strokeWidth={1.8} />
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 16, letterSpacing: '-0.02em' }}>
              Tech Scorecard
            </span>
          </div>

          <nav style={{ display: 'flex', gap: 4, marginLeft: 8, flexWrap: 'wrap' }}>
            <NavItem to="/"           icon={<Upload size={15} />}      label="Upload" />
            <NavItem to="/scorecards" icon={<LayoutGrid size={15} />}  label="Scorecards" />
            <NavItem to="/employees"  icon={<Users size={15} />}       label="Employees" />
            <NavItem to="/send"       icon={<Send size={15} />}        label="Send" />
            <NavItem to="/benefits"   icon={<Clock size={15} />}       label="Hours" />
            <NavItem to="/template"   icon={<FileText size={15} />}    label="Template" />
          </nav>
        </header>

        <main style={{ flex: 1, padding: '32px 24px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
          <Outlet />
        </main>

        <footer style={{ padding: '16px 24px', borderTop: '1px solid var(--ink-100)', textAlign: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--ink-300)' }}>Tech Scorecard — Internal tool</span>
        </footer>
      </div>
    </AppContext.Provider>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 12px',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 500,
        color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
        background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
        transition: 'all 0.15s',
        textDecoration: 'none',
      })}
    >
      {icon}
      {label}
    </NavLink>
  );
}

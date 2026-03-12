import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { createContext, useContext, useState } from 'react';
import { ClipboardList, Upload, LayoutGrid } from 'lucide-react';

// Global app state context
const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export default function Layout() {
  const navigate = useNavigate();
  const [scorecards, setScorecards] = useState([]);
  const [stats, setStats] = useState(null);
  const [weekOf, setWeekOf] = useState('');

  function loadResults(data) {
    setScorecards(data.scorecards || []);
    setStats(data.stats || null);
    setWeekOf(data.stats?.weekOf || '');
    navigate('/scorecards');
  }

  return (
    <AppContext.Provider value={{ scorecards, setScorecards, stats, setStats, weekOf, loadResults }}>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Top nav */}
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

          <nav style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
            <NavItem to="/" icon={<Upload size={15} />} label="Upload" />
            <NavItem to="/scorecards" icon={<LayoutGrid size={15} />} label="Scorecards" />
          </nav>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '32px 24px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
          <Outlet />
        </main>

        <footer style={{ padding: '16px 24px', borderTop: `1px solid var(--ink-100)`, textAlign: 'center' }}>
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

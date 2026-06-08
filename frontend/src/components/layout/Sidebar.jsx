import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Stethoscope, Bed, Package,
  CalendarClock, BrainCircuit, PhoneCall, Bell,
  Settings, LogOut, Hospital, ChevronRight,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { disconnectSocket } from '../../services/socket';

const navItems = [
  { to: '/dashboard',    label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/patients',     label: 'Patients',         icon: Users },
  { to: '/doctors',      label: 'Doctors',          icon: Stethoscope },
  { to: '/beds',         label: 'Beds',             icon: Bed },
  { to: '/resources',    label: 'Resources',        icon: Package },
  { to: '/appointments', label: 'Appointments',     icon: CalendarClock },
];

const agentItems = [
  { to: '/agent-activity', label: 'Agent Activity', icon: BrainCircuit },
  { to: '/call-logs',      label: 'Call Logs',       icon: PhoneCall },
  { to: '/notifications',  label: 'Notifications',   icon: Bell },
];

const NavGroup = ({ label, items }) => (
  <div style={{ marginBottom: '0.5rem' }}>
    <p style={{
      color: 'var(--color-text-muted)',
      fontSize: '0.68rem',
      fontWeight: 600,
      letterSpacing: '0.1em',
      margin: '1rem 1.5rem 0.4rem',
      textTransform: 'uppercase',
    }}>
      {label}
    </p>
    {items.map(({ to, label, icon: Icon }) => (
      <NavLink key={to} to={to} className={({ isActive }) =>
        `sidebar-link ${isActive ? 'active' : ''}`
      }>
        <Icon size={17} strokeWidth={1.75} />
        <span style={{ flex: 1 }}>{label}</span>
        <ChevronRight size={13} style={{ opacity: 0.3 }} />
      </NavLink>
    ))}
  </div>
);

export default function Sidebar() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    disconnectSocket();
    clearAuth();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          borderRadius: '10px',
          padding: '7px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Hospital size={18} color="#fff" strokeWidth={2} />
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
            MediAgent
          </p>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>AI Platform</p>
        </div>
      </div>

      {/* Hospital badge */}
      {user?.hospital && (
        <div style={{
          margin: '0.75rem',
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: '8px',
          padding: '0.6rem 0.875rem',
        }}>
          <p style={{ fontSize: '0.68rem', color: 'var(--color-brand-400)', marginBottom: 2, fontWeight: 600 }}>
            ACTIVE HOSPITAL
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
            {user.hospital.name}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, paddingTop: '0.5rem' }}>
        <NavGroup label="Operations" items={navItems} />
        <NavGroup label="AI Command" items={agentItems} />
      </nav>

      {/* Bottom — User + Settings */}
      <div style={{ borderTop: '1px solid var(--color-border)', padding: '0.75rem' }}>
        <NavLink to="/settings" className={({ isActive }) =>
          `sidebar-link ${isActive ? 'active' : ''}`
        }>
          <Settings size={17} strokeWidth={1.75} />
          <span style={{ flex: 1 }}>Settings</span>
        </NavLink>

        {/* User info */}
        <div style={{
          alignItems: 'center',
          background: 'var(--color-surface-3)',
          border: '1px solid var(--color-border)',
          borderRadius: '10px',
          display: 'flex',
          gap: '0.625rem',
          margin: '0.5rem 0.75rem 0',
          padding: '0.625rem 0.875rem',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: '50%',
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name ?? 'User'}
            </p>
            <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
              {user?.role ?? ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '2px',
              borderRadius: '4px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

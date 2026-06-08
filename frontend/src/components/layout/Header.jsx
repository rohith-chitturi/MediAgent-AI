import { Bell, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useNotificationStore from '../../store/notificationStore';
import useAuthStore from '../../store/authStore';

export default function Header({ title, subtitle }) {
  const { unreadCount } = useNotificationStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const roleBadgeColor = {
    SUPER_ADMIN: { bg: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: 'rgba(139,92,246,0.3)' },
    HOSPITAL_ADMIN: { bg: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: 'rgba(59,130,246,0.3)' },
    DOCTOR: { bg: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
    RECEPTIONIST: { bg: 'rgba(249,115,22,0.15)', color: '#fdba74', border: 'rgba(249,115,22,0.3)' },
  }[user?.role] ?? { bg: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'rgba(255,255,255,0.1)' };

  return (
    <header style={{
      alignItems: 'center',
      background: 'rgba(4,7,19,0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      gap: '1rem',
      justifyContent: 'space-between',
      padding: '0.875rem 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      {/* Left: page title */}
      <div>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }}>{title}</h1>
        {subtitle && (
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Right: search + bell + role */}
      <div style={{ alignItems: 'center', display: 'flex', gap: '0.75rem' }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search
            size={15}
            style={{
              color: 'var(--color-text-muted)',
              position: 'absolute',
              left: '0.625rem',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          <input
            placeholder="Search..."
            style={{
              background: 'var(--color-surface-3)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-text-primary)',
              fontSize: '0.82rem',
              outline: 'none',
              padding: '0.45rem 0.75rem 0.45rem 2rem',
              width: '200px',
              transition: 'border-color 0.2s',
              fontFamily: 'inherit',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-brand-500)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
          />
        </div>

        {/* Notifications bell */}
        <button
          onClick={() => navigate('/notifications')}
          style={{
            background: 'var(--color-surface-3)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            padding: '0.45rem 0.6rem',
            position: 'relative',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-brand-500)';
            e.currentTarget.style.color = 'var(--color-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span style={{
              background: '#ef4444',
              borderRadius: '50%',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 700,
              lineHeight: 1,
              minWidth: '16px',
              padding: '2px 4px',
              position: 'absolute',
              right: '-5px',
              top: '-5px',
              textAlign: 'center',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Role badge */}
        <span style={{
          background: roleBadgeColor.bg,
          border: `1px solid ${roleBadgeColor.border}`,
          borderRadius: '99px',
          color: roleBadgeColor.color,
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.04em',
          padding: '3px 10px',
        }}>
          {user?.role?.replace('_', ' ')}
        </span>
      </div>
    </header>
  );
}

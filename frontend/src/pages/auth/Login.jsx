import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hospital, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { connectSocket } from '../../services/socket';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.data);
      connectSocket();
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(59,130,246,0.15) 0%, transparent 60%), var(--color-bg)',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: `linear-gradient(var(--color-border) 1px, transparent 1px),
                          linear-gradient(90deg, var(--color-border) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* Ambient orbs */}
      <div style={{
        position: 'absolute', top: '20%', left: '15%',
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(40px)',
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '15%',
        width: 250, height: 250,
        background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(40px)',
      }} />

      {/* Card */}
      <div className="glass-heavy" style={{
        borderRadius: 'var(--radius-xl)',
        maxWidth: 420,
        padding: '2.5rem',
        width: '100%',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: '16px',
            display: 'inline-flex',
            padding: '14px',
            marginBottom: '1rem',
            boxShadow: '0 8px 32px rgba(59,130,246,0.3)',
          }}>
            <Hospital size={28} color="#fff" strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            <span className="gradient-text">MediAgent AI</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Autonomous Hospital Operations Platform
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px',
            color: '#fca5a5',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            padding: '0.75rem 1rem',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '0.4rem',
            }}>
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              className="input"
              placeholder="admin@hospital.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '0.4rem',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ marginTop: '0.5rem', padding: '0.75rem', fontSize: '0.9rem', width: '100%' }}
          >
            {isLoading ? (
              <>
                <Loader2 size={17} style={{ animation: 'spin 0.7s linear infinite' }} />
                Authenticating...
              </>
            ) : (
              <>
                <ShieldCheck size={17} />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div style={{
          background: 'rgba(59,130,246,0.06)',
          border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: '8px',
          fontSize: '0.78rem',
          color: 'var(--color-text-muted)',
          marginTop: '1.5rem',
          padding: '0.75rem',
          textAlign: 'center',
        }}>
          <span style={{ color: 'var(--color-brand-400)', fontWeight: 600 }}>Demo: </span>
          admin@cityhospital.com / password123
        </div>
      </div>
    </div>
  );
}

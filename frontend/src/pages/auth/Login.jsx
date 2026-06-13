import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hospital, ShieldCheck, UserPlus, Stethoscope, Loader2, Lock } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { connectSocket } from '../../services/socket';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleDemoSelect = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  const demoAccounts = [
    { label: 'Admin', email: 'admin@cityhospital.com', pass: 'password123', icon: ShieldCheck },
    { label: 'Doctor', email: 'dr.sharma@cityhospital.com', pass: 'password123', icon: Stethoscope },
    { label: 'Intake', email: 'reception@cityhospital.com', pass: 'password123', icon: UserPlus },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#050505',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      padding: '1rem'
    }}>
      
      {/* Background Ambient Glows */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 60%)',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'absolute', top: '-10%', right: '-10%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(147,51,234,0.1) 0%, transparent 60%)',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />

      {/* Main Container */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        position: 'relative',
        zIndex: 10
      }}>

        {/* The Card */}
        <div style={{
          backgroundColor: 'rgba(15, 15, 15, 0.8)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
        }}>
          
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              width: '56px', height: '56px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 0 20px rgba(79, 70, 229, 0.4)',
              border: '1px solid rgba(165, 180, 252, 0.2)'
            }}>
              <Hospital size={28} color="#fff" strokeWidth={2} />
            </div>
            <h1 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.25rem 0', letterSpacing: '-0.02em' }}>
              MediAgent AI
            </h1>
            <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: 0, fontWeight: 500 }}>
              Autonomous Operations Platform
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', color: '#d4d4d8', fontSize: '0.875rem', fontWeight: 500, margin: '0 0 0.5rem 0.25rem' }}>
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hospital.com"
                style={{
                  width: '100%',
                  backgroundColor: '#18181b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '1rem',
                  color: '#fff',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#d4d4d8', fontSize: '0.875rem', fontWeight: 500, margin: '0 0 0.5rem 0.25rem' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  backgroundColor: '#18181b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '1rem',
                  color: '#fff',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
            </div>

            {error && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                color: '#f87171',
                fontSize: '0.875rem',
                fontWeight: 500
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                backgroundColor: '#fff',
                color: '#000',
                border: 'none',
                borderRadius: '12px',
                padding: '1rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                marginTop: '0.5rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => { if (!isLoading) e.target.style.backgroundColor = '#e4e4e7'; }}
              onMouseOut={(e) => { if (!isLoading) e.target.style.backgroundColor = '#fff'; }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Sign In to Command Center
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo Roles Below Card */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
            Quick Access Demo Roles
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
            {demoAccounts.map((demo) => (
              <button
                key={demo.label}
                type="button"
                onClick={() => handleDemoSelect(demo.email, demo.pass)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '99px',
                  padding: '0.5rem 1rem',
                  color: '#d4d4d8',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = '#d4d4d8';
                }}
              >
                <demo.icon size={14} color="#818cf8" />
                {demo.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

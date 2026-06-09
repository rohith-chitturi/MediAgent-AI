
import Layout from '../../components/layout/Layout';
import { Users, UserPlus, Clock, CalendarClock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ReceptionDashboard() {
  const navigate = useNavigate();
  
  return (
    <Layout title="Reception Desk" subtitle="Patient registration & appointments">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => navigate('/patients')}
          style={{ 
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
            color: 'white', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '8px',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            fontWeight: 600
          }}>
          <UserPlus size={18} />
          Register New Patient
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ borderTop: '2px solid #3b82f640' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Patients Waiting</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <Users color="#3b82f6" size={28} />
            <h2 style={{ fontSize: '2rem' }}>4</h2>
          </div>
        </div>
        
        <div className="stat-card" style={{ borderTop: '2px solid #10b98140' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Scheduled Today</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <CalendarClock color="#10b981" size={28} />
            <h2 style={{ fontSize: '2rem' }}>12</h2>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '2px solid #8b5cf640' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Avg Wait Time</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <Clock color="#8b5cf6" size={28} />
            <h2 style={{ fontSize: '1.5rem' }}>12 mins</h2>
          </div>
        </div>
      </div>
    </Layout>
  );
}

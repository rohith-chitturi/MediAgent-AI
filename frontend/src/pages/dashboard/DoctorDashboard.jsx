import Layout from '../../components/layout/Layout';
import { Calendar, Clock, UserCheck } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function DoctorDashboard() {
  const { user } = useAuthStore();
  
  return (
    <Layout title={`Welcome, ${user?.name}`} subtitle="My Clinical Dashboard">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ borderTop: '2px solid #3b82f640' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>My Assigned Patients</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <UserCheck color="#3b82f6" size={28} />
            <h2 style={{ fontSize: '2rem' }}>3</h2>
          </div>
        </div>
        
        <div className="stat-card" style={{ borderTop: '2px solid #10b98140' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Today's Appointments</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <Calendar color="#10b981" size={28} />
            <h2 style={{ fontSize: '2rem' }}>5</h2>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '2px solid #8b5cf640' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Next Patient In</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <Clock color="#8b5cf6" size={28} />
            <h2 style={{ fontSize: '1.5rem' }}>15 mins</h2>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3>My Recent Patients</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Select a patient from the "Patients" tab to begin treatment.</p>
      </div>
    </Layout>
  );
}

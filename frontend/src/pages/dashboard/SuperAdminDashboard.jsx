
import Layout from '../../components/layout/Layout';
import { BrainCircuit, Hospital, Users, Activity } from 'lucide-react';

export default function SuperAdminDashboard() {
  return (
    <Layout title="Platform Overview" subtitle="Super Admin global metrics">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ borderTop: '2px solid #3b82f640' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Total Hospitals</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <Hospital color="#3b82f6" size={28} />
            <h2 style={{ fontSize: '2rem' }}>2</h2>
          </div>
        </div>
        
        <div className="stat-card" style={{ borderTop: '2px solid #10b98140' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Total Platform Users</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <Users color="#10b981" size={28} />
            <h2 style={{ fontSize: '2rem' }}>7</h2>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '2px solid #8b5cf640' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Total Agent Runs</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <BrainCircuit color="#8b5cf6" size={28} />
            <h2 style={{ fontSize: '2rem' }}>1,204</h2>
          </div>
        </div>
        
        <div className="stat-card" style={{ borderTop: '2px solid #f59e0b40' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Platform Health</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <Activity color="#f59e0b" size={28} />
            <h2 style={{ fontSize: '2rem', color: '#10b981' }}>99.9%</h2>
          </div>
        </div>
      </div>
    </Layout>
  );
}

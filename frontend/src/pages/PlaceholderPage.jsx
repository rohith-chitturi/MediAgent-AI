import Layout from '../components/layout/Layout';
import { Construction } from 'lucide-react';

// Generic placeholder used by pages not yet built (Phase 2)
export default function PlaceholderPage({ title, subtitle, icon: Icon = Construction }) {
  return (
    <Layout title={title} subtitle={subtitle}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        gap: '1rem',
      }}>
        <div style={{
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: '16px',
          padding: '1.25rem',
          color: 'var(--color-brand-400)',
        }}>
          <Icon size={36} strokeWidth={1.5} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{title}</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', maxWidth: 360 }}>
          This module is being built in <strong style={{ color: 'var(--color-brand-400)' }}>Phase 2</strong>.
          The API, UI components, and agent integrations will be wired here.
        </p>
      </div>
    </Layout>
  );
}

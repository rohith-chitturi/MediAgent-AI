import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, FileSpreadsheet, Search, RefreshCw, X,
  Activity, AlertTriangle, UserCheck, PhoneCall, Lock, Cpu, Clock, CheckCircle2
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import EmptyState from '../../components/ui/EmptyState';
import { auditApi } from '../../services/modules';

export default function ComplianceDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState('ALL');
  const [selectedAudit, setSelectedAudit] = useState(null);

  const { data: auditData, refetch } = useQuery({
    queryKey: ['audit-logs', selectedOutcome, searchTerm],
    queryFn: () => auditApi.list({
      outcome: selectedOutcome === 'ALL' ? undefined : selectedOutcome,
      search: searchTerm || undefined
    }).then(r => r.data.data),
    refetchInterval: 10000,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['audit-analytics'],
    queryFn: () => auditApi.analytics().then(r => r.data.data),
    refetchInterval: 10000,
  });

  const logs = auditData?.data || [];
  const stats = analyticsData || {
    totalToday: 0, aiDecisionsToday: 0, humanOverridesToday: 0, failedWorkflowsToday: 0, voiceInteractionsToday: 0, sensitiveAccessToday: 0
  };

  const handleExportCSV = async () => {
    try {
      const res = await auditApi.exportCSV();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_trail_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('Failed to export CSV:', e);
    }
  };

  return (
    <Layout>
      <div style={{ padding: '1.5rem', maxWidth: 1400, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #059669, #10b981)', borderRadius: 10, padding: 8, display: 'flex' }}>
                <ShieldCheck size={22} color="#fff" />
              </div>
              Governance & Compliance Audit Trail
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              HIPAA & Enterprise audit logging, correlation ID tracing, AI explainability & export capabilities
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => refetch()}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={15} /> Refresh Logs
            </button>

            <button
              onClick={handleExportCSV}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #059669, #10b981)',
                border: 'none',
                boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 600
              }}
            >
              <FileSpreadsheet size={16} /> Export CSV Audit Trail
            </button>
          </div>
        </div>

        {/* Analytics Header Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard title="Audit Events Today" value={stats.totalToday} icon={Activity} color="#10b981" />
          <StatCard title="AI Explainability Events" value={stats.aiDecisionsToday} icon={Cpu} color="#3b82f6" />
          <StatCard title="Human Overrides" value={stats.humanOverridesToday} icon={UserCheck} color="#f59e0b" />
          <StatCard title="Failed Workflows" value={stats.failedWorkflowsToday} icon={AlertTriangle} color="#ef4444" />
          <StatCard title="Voice Interactions" value={stats.voiceInteractionsToday} icon={PhoneCall} color="#8b5cf6" />
          <StatCard title="Sensitive Access" value={stats.sensitiveAccessToday} icon={Lock} color="#06b6d4" />
        </div>

        {/* Search & Outcome Filter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['ALL', 'SUCCESS', 'WARNING', 'FAILURE'].map(out => (
              <button
                key={out}
                onClick={() => setSelectedOutcome(out)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: '1px solid',
                  cursor: 'pointer',
                  background: selectedOutcome === out ? '#059669' : 'transparent',
                  color: selectedOutcome === out ? '#fff' : 'var(--color-text-muted)',
                  borderColor: selectedOutcome === out ? '#059669' : 'var(--color-border)',
                  transition: 'all 0.2s'
                }}
              >
                {out}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: 320 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search Correlation ID (RUN-2026-X), action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: 36, height: 36, fontSize: '0.82rem' }}
            />
          </div>
        </div>

        {/* Audit Trail Table */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          overflow: 'hidden'
        }}>
          {logs.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No Audit Records Found"
              description="No audit logs match your search criteria. Every user action and AI decision is automatically logged here."
            />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '10px 16px' }}>Timestamp</th>
                  <th style={{ padding: '10px 16px' }}>Outcome</th>
                  <th style={{ padding: '10px 16px' }}>Actor (User / Agent)</th>
                  <th style={{ padding: '10px 16px' }}>Action & Entity</th>
                  <th style={{ padding: '10px 16px' }}>Correlation ID</th>
                  <th style={{ padding: '10px 16px' }}>IP Address</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right' }}>Inspection</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="table-row-hover">
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <OutcomeBadge outcome={log.outcome} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {log.user ? (
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{log.user.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{log.user.role?.name}</div>
                        </div>
                      ) : (
                        <div style={{ fontWeight: 700, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Cpu size={14} /> {log.agentName || 'AI Agent'}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-text-primary)' }}>{log.action}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Entity: {log.entity} (#{log.entityId})</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {log.correlationId ? (
                        <span style={{
                          background: 'rgba(59,130,246,0.1)',
                          color: '#3b82f6',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          fontWeight: 700
                        }}>
                          {log.correlationId}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedAudit(log)}
                        style={{
                          background: 'rgba(5,150,105,0.1)',
                          color: '#059669',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Inspect Diff & Evidence
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal: Audit Log Evidence & Diff Inspection */}
        <AnimatePresence>
          {selectedAudit && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
              zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 16,
                  width: '90%',
                  maxWidth: 700,
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  padding: '1.5rem',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <OutcomeBadge outcome={selectedAudit.outcome} />
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: 6, color: 'var(--color-text-primary)' }}>
                      Audit Evidence — {selectedAudit.action}
                    </h2>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      Correlation ID: {selectedAudit.correlationId || 'N/A'} • Event ID: {selectedAudit.id}
                    </p>
                  </div>
                  <button onClick={() => setSelectedAudit(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
                </div>

                {/* Audit Context Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <MetaPill label="Entity Type" value={`${selectedAudit.entity} (#${selectedAudit.entityId})`} />
                  <MetaPill label="Actor" value={selectedAudit.user?.name ? `${selectedAudit.user.name} (User)` : `${selectedAudit.agentName || 'AI Agent'} (AI)`} />
                  <MetaPill label="IP Address" value={selectedAudit.ipAddress || '127.0.0.1'} />
                  <MetaPill label="Retention Expiry" value={new Date(selectedAudit.retentionExpiry || Date.now()).toLocaleDateString()} />
                </div>

                {/* Before / After JSON Diff Inspection */}
                <div style={{ display: 'grid', gridTemplateColumns: selectedAudit.before ? '1fr 1fr' : '1fr', gap: '0.75rem' }}>
                  {selectedAudit.before && (
                    <div>
                      <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Before State Snapshot</h4>
                      <pre style={codeBlockStyle}>{JSON.stringify(selectedAudit.before, null, 2)}</pre>
                    </div>
                  )}
                  <div>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', marginBottom: 4 }}>After / Action Evidence Payload</h4>
                    <pre style={codeBlockStyle}>{JSON.stringify(selectedAudit.after || { action: selectedAudit.action, entity: selectedAudit.entity }, null, 2)}</pre>
                  </div>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{title}</span>
        <div style={{ background: `${color}15`, color, borderRadius: 8, padding: 6, display: 'flex' }}>
          <Icon size={16} />
        </div>
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{value}</div>
    </div>
  );
}

function OutcomeBadge({ outcome }) {
  const colors = {
    SUCCESS: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
    WARNING: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    FAILURE: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' }
  };
  const cfg = colors[outcome] || colors.SUCCESS;
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700 }}>
      {outcome}
    </span>
  );
}

function MetaPill({ label, value }) {
  return (
    <div style={{ background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 10px' }}>
      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 2 }}>{value}</div>
    </div>
  );
}

const codeBlockStyle = {
  background: 'var(--color-background)', padding: '0.8rem', borderRadius: 8, fontSize: '0.75rem',
  fontFamily: 'monospace', color: 'var(--color-text-secondary)', overflowX: 'auto', maxHeight: 220
};

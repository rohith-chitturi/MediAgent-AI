import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Database, Sparkles, Search, RefreshCw, X,
  Layers, Cpu, Activity, TrendingUp, Shield, Clock, Award
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import EmptyState from '../../components/ui/EmptyState';
import { memoryApi } from '../../services/modules';

export default function AgentMemoryDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedMemory, setSelectedMemory] = useState(null);

  const { data: memoryData, refetch } = useQuery({
    queryKey: ['agent-memories', selectedCategory, searchTerm],
    queryFn: () => memoryApi.list({
      memoryCategory: selectedCategory === 'ALL' ? undefined : selectedCategory,
      search: searchTerm || undefined
    }).then(r => r.data.data),
    refetchInterval: 10000,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['agent-memory-analytics'],
    queryFn: () => memoryApi.analytics().then(r => r.data.data),
    refetchInterval: 10000,
  });

  const memories = memoryData?.data || [];
  const stats = analyticsData || { totalMemories: 0, categoryBreakdown: {}, agentBreakdown: {}, mostInfluentialMemories: [] };

  return (
    <Layout>
      <div style={{ padding: '1.5rem', maxWidth: 1400, margin: '0 auto' }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)', borderRadius: 10, padding: 8, display: 'flex' }}>
                <Brain size={22} color="#fff" />
              </div>
              Enterprise Agent Memory (pgvector)
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              Shared knowledge layer & vector embeddings across Triage, Doctor, Resource, Discharge, and Voice Agents
            </p>
          </div>

          <button
            onClick={() => refetch()}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={15} /> Refresh Store
          </button>
        </div>

        {/* Analytics Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard title="Total Knowledge Base" value={stats.totalMemories} icon={Database} color="#10b981" />
          <StatCard title="Active Categories" value={Object.keys(stats.categoryBreakdown || {}).length} icon={Layers} color="#3b82f6" />
          <StatCard title="Contributing Agents" value={Object.keys(stats.agentBreakdown || {}).length} icon={Cpu} color="#8b5cf6" />
          <StatCard title="Most Influential Memory" value={stats.mostInfluentialMemories?.[0]?.retrievalCount ? `${stats.mostInfluentialMemories[0].retrievalCount} Reuses` : 'N/A'} icon={Award} color="#f59e0b" />
        </div>

        {/* Agent Memory Breakdown Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(59,130,246,0.06))',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 14,
          padding: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={16} color="#10b981" /> Category Breakdown across Autonomous Hospital Workforce
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[
              'PATIENT_HISTORY', 'CLINICAL_DECISION', 'VOICE_CONVERSATION',
              'DOCTOR_ASSIGNMENT', 'RESOURCE_EVENT', 'HUMAN_OVERRIDE', 'AI_FEEDBACK'
            ].map(cat => (
              <div key={cat} style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 600
              }}>
                <span style={{ color: 'var(--color-text-muted)' }}>{cat.replace('_', ' ')}: </span>
                <span style={{ color: '#10b981', fontWeight: 800 }}>{stats.categoryBreakdown?.[cat] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['ALL', 'PATIENT_HISTORY', 'CLINICAL_DECISION', 'VOICE_CONVERSATION', 'HUMAN_OVERRIDE', 'AI_FEEDBACK'].map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedCategory(tab)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: '1px solid',
                  cursor: 'pointer',
                  background: selectedCategory === tab ? '#10b981' : 'transparent',
                  color: selectedCategory === tab ? '#fff' : 'var(--color-text-muted)',
                  borderColor: selectedCategory === tab ? '#10b981' : 'var(--color-border)',
                  transition: 'all 0.2s'
                }}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: 280 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Hybrid vector search memory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: 36, height: 36, fontSize: '0.82rem' }}
            />
          </div>
        </div>

        {/* Memory Data Table */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          overflow: 'hidden'
        }}>
          {memories.length === 0 ? (
            <EmptyState
              icon={Brain}
              title="No Memories Found"
              description="No knowledge items present. Trigger AI workflows or Voice calls to auto-populate shared agent memory."
            />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '10px 16px' }}>Category</th>
                  <th style={{ padding: '10px 16px' }}>Source Agent</th>
                  <th style={{ padding: '10px 16px' }}>Summary</th>
                  <th style={{ padding: '10px 16px' }}>Importance</th>
                  <th style={{ padding: '10px 16px' }}>Reuses</th>
                  <th style={{ padding: '10px 16px' }}>Created</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {memories.map(mem => (
                  <tr key={mem.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="table-row-hover">
                    <td style={{ padding: '12px 16px' }}>
                      <CategoryBadge category={mem.memoryCategory} />
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {mem.agentName}
                    </td>
                    <td style={{ padding: '12px 16px', maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {mem.summary}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: 700, color: mem.importanceScore > 0.7 ? '#ef4444' : '#10b981' }}>
                        {(mem.importanceScore * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>
                      {mem.retrievalCount || 0} times
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                      {new Date(mem.createdAt).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedMemory(mem)}
                        style={{
                          background: 'rgba(16,185,129,0.1)',
                          color: '#10b981',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        View Vector Data
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal: Memory Vector & Metadata Inspection */}
        <AnimatePresence>
          {selectedMemory && (
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
                  maxWidth: 650,
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  padding: '1.5rem',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <CategoryBadge category={selectedMemory.memoryCategory} />
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: 6, color: 'var(--color-text-primary)' }}>
                      Memory Details — {selectedMemory.agentName}
                    </h2>
                  </div>
                  <button onClick={() => setSelectedMemory(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
                </div>

                <div style={{ background: 'var(--color-surface-hover)', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', marginBottom: 4 }}>Summary</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', lineHeight: 1.5 }}>{selectedMemory.summary}</p>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Structured Metadata</h4>
                  <pre style={{
                    background: 'var(--color-background)', padding: '0.8rem', borderRadius: 8, fontSize: '0.78rem',
                    color: 'var(--color-text-secondary)', overflowX: 'auto'
                  }}>
                    {JSON.stringify(selectedMemory.metadata, null, 2)}
                  </pre>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                    768-Dim Vector Embedding Sample
                  </h4>
                  <div style={{ background: 'var(--color-background)', padding: '0.8rem', borderRadius: 8, fontSize: '0.75rem', fontFamily: 'monospace', color: '#10b981' }}>
                    [{(Array.isArray(selectedMemory.vectorData) ? selectedMemory.vectorData.slice(0, 10) : []).join(', ')} ... +{(selectedMemory.vectorData?.length || 64) - 10} dimensions]
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

function CategoryBadge({ category }) {
  const colors = {
    PATIENT_HISTORY: '#3b82f6',
    CLINICAL_DECISION: '#10b981',
    VOICE_CONVERSATION: '#8b5cf6',
    DOCTOR_ASSIGNMENT: '#06b6d4',
    HUMAN_OVERRIDE: '#ef4444',
    AI_FEEDBACK: '#f59e0b'
  };
  const c = colors[category] || '#6b7280';
  return (
    <span style={{ background: `${c}15`, color: c, padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700 }}>
      {category}
    </span>
  );
}

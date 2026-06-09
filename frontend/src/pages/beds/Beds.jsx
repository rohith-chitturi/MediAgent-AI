import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bed, Unlock, Loader2, AlertTriangle, X } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { bedsApi } from '../../services/modules';

const TYPE_CONFIG = {
  ICU:       { color: '#ef4444', label: 'ICU',       bg: 'rgba(239,68,68,0.1)'   },
  EMERGENCY: { color: '#f97316', label: 'Emergency', bg: 'rgba(249,115,22,0.1)'  },
  GENERAL:   { color: '#3b82f6', label: 'General',   bg: 'rgba(59,130,246,0.1)'  },
};

const STATUS_CONFIG = {
  AVAILABLE:   { color: '#10b981', label: 'Available',   bg: 'rgba(16,185,129,0.1)'  },
  OCCUPIED:    { color: '#ef4444', label: 'Occupied',    bg: 'rgba(239,68,68,0.1)'   },
  MAINTENANCE: { color: '#f59e0b', label: 'Maintenance', bg: 'rgba(245,158,11,0.1)'  },
};

function BedCard({ bed, onRelease, isReleasing }) {
  const type   = TYPE_CONFIG[bed.type]   ?? TYPE_CONFIG.GENERAL;
  const status = STATUS_CONFIG[bed.status] ?? STATUS_CONFIG.AVAILABLE;
  const patient = bed.assignment?.patient;

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: `1px solid ${bed.status === 'AVAILABLE' ? 'rgba(16,185,129,0.2)' : bed.status === 'OCCUPIED' ? 'rgba(239,68,68,0.2)' : 'var(--color-border)'}`,
      borderRadius: '10px', padding: '0.875rem', transition: 'all 0.2s',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Color stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: type.color }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', marginTop: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{bed.number}</span>
          <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '1px 7px', borderRadius: '99px', background: type.bg, color: type.color }}>{type.label}</span>
        </div>
        <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '1px 7px', borderRadius: '99px', background: status.bg, color: status.color }}>
          {status.label}
        </span>
      </div>

      <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{bed.ward} · {bed.floor}</p>

      {patient && (
        <div style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0.5rem 0.625rem', marginBottom: '0.5rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '1px' }}>{patient.name}</p>
          <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{patient.status} · {patient.priority ?? 'No priority'}</p>
        </div>
      )}

      {bed.status === 'OCCUPIED' && (
        <button
          className="btn btn-secondary"
          style={{ width: '100%', fontSize: '0.72rem', padding: '0.35rem', gap: '0.375rem' }}
          onClick={() => onRelease(bed.id)}
          disabled={isReleasing}
        >
          <Unlock size={12} /> Release Bed
        </button>
      )}
    </div>
  );
}

const SummaryCard = ({ label, value, color }) => (
  <div className="stat-card" style={{ padding: '1rem', borderTop: `2px solid ${color}40` }}>
    <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>{label}</p>
    <p style={{ fontSize: '1.8rem', fontWeight: 800, color }}>{value ?? '—'}</p>
  </div>
);

const FilterBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    background: active ? 'rgba(59,130,246,0.15)' : 'var(--color-surface-3)',
    border: `1px solid ${active ? 'rgba(59,130,246,0.4)' : 'var(--color-border)'}`,
    borderRadius: '7px', color: active ? '#93c5fd' : 'var(--color-text-secondary)',
    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, padding: '0.4rem 0.875rem',
    transition: 'all 0.15s', fontFamily: 'inherit',
  }}>{children}</button>
);

export default function Beds() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [releaseError, setReleaseError] = useState('');

  const { data: summaryData } = useQuery({
    queryKey: ['beds-summary'],
    queryFn: () => bedsApi.summary().then((r) => r.data.data),
    refetchInterval: 30_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['beds', typeFilter, statusFilter],
    queryFn: () => bedsApi.list({ type: typeFilter || undefined, status: statusFilter || undefined, limit: 100 }).then((r) => r.data),
  });

  const releaseMut = useMutation({
    mutationFn: (id) => bedsApi.release(id),
    onSuccess: () => {
      setReleaseError('');
      qc.invalidateQueries({ queryKey: ['beds'] });
      qc.invalidateQueries({ queryKey: ['beds-summary'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (e) => {
      setReleaseError(e.response?.data?.message ?? 'Failed to release bed.');
    },
  });

  const beds = data?.data ?? [];

  return (
    <Layout title="Beds" subtitle="Bed occupancy management & allocation">
      {/* Error banner */}
      {releaseError && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.625rem', justifyContent: 'space-between',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={15} color="#ef4444" />
            <span style={{ fontSize: '0.85rem', color: '#fca5a5' }}>{releaseError}</span>
          </div>
          <button onClick={() => setReleaseError('')} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: 2 }}><X size={15} /></button>
        </div>
      )}
      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.875rem', marginBottom: '1.25rem' }}>
        <SummaryCard label="Total Beds"  value={summaryData?.total}     color="#94a3b8" />
        <SummaryCard label="Available"   value={summaryData?.available} color="#10b981" />
        <SummaryCard label="Occupied"    value={summaryData?.occupied}  color="#ef4444" />
        <SummaryCard label="ICU Occupied" value={summaryData?.byType?.ICU?.find?.(b => b.status === 'OCCUPIED')?._count ?? 0} color="#f97316" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <FilterBtn active={!typeFilter} onClick={() => setTypeFilter('')}>All Types</FilterBtn>
        {['ICU', 'EMERGENCY', 'GENERAL'].map((t) => <FilterBtn key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>{t}</FilterBtn>)}
        <div style={{ width: 1, background: 'var(--color-border)', margin: '0 0.25rem' }} />
        <FilterBtn active={!statusFilter} onClick={() => setStatusFilter('')}>All Status</FilterBtn>
        {['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'].map((s) => <FilterBtn key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>{s}</FilterBtn>)}
      </div>

      {/* Bed Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
          <Loader2 size={24} style={{ animation: 'spin 0.7s linear infinite', display: 'inline-block', marginBottom: '0.75rem' }} />
          <p>Loading beds...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {beds.map((bed) => (
            <BedCard
              key={bed.id} bed={bed}
              onRelease={(id) => releaseMut.mutate(id)}
              isReleasing={releaseMut.isPending}
            />
          ))}
          {beds.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
              <Bed size={28} style={{ opacity: 0.3, display: 'block', margin: '0 auto 0.75rem' }} />
              <p>No beds found matching the filter.</p>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

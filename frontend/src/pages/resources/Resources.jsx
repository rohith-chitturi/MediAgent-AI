import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, AlertTriangle, TrendingDown, RefreshCw, X, Loader2 } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { resourcesApi } from '../../services/modules';

const TYPE_CONFIG = {
  MEDICINE:  { color: '#3b82f6', icon: '💊' },
  OXYGEN:    { color: '#06b6d4', icon: '🫁' },
  VENTILATOR:{ color: '#8b5cf6', icon: '⚙️' },
  EQUIPMENT: { color: '#f59e0b', icon: '🔧' },
  BLOOD:     { color: '#ef4444', icon: '🩸' },
};

function StockBar({ quantity, threshold }) {
  const max   = Math.max(threshold * 3, quantity, 1);
  const pct   = Math.min(100, Math.round((quantity / max) * 100));
  const isLow = quantity <= threshold;
  const isCrit= quantity <= Math.floor(threshold / 2);
  const color = isCrit ? '#ef4444' : isLow ? '#f97316' : '#10b981';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
          {quantity} / min {threshold} {isCrit ? '⚠️ Critical' : isLow ? '⚠️ Low' : '✓ Adequate'}
        </span>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color }}>{pct}%</span>
      </div>
      <div style={{ background: 'var(--color-surface-3)', borderRadius: '99px', height: 6, overflow: 'hidden' }}>
        <div style={{ background: color, height: '100%', width: `${pct}%`, borderRadius: '99px', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

function RestockModal({ resource, onClose }) {
  const qc = useQueryClient();
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');

  const mut = useMutation({
    mutationFn: () => resourcesApi.restock(resource.id, parseInt(qty, 10), notes),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['resources'] }); onClose(); },
    onError: (e) => setErr(e.response?.data?.message ?? 'Restock failed.'),
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-heavy" style={{ borderRadius: 'var(--radius-xl)', padding: '2rem', width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Restock: {resource.name}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        {err && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.82rem', marginBottom: '1rem', padding: '0.5rem 0.75rem' }}>{err}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>
              Quantity to add ({resource.unit}) *
            </label>
            <input className="input" type="number" min="1" placeholder="e.g. 50" value={qty} onChange={(e) => setQty(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>Notes</label>
            <input className="input" placeholder="Purchase order, supplier..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 1 }} disabled={!qty || mut.isPending} onClick={() => mut.mutate()}>
              {mut.isPending ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : <RefreshCw size={15} />}
              Restock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Resources() {
  const [typeFilter, setTypeFilter] = useState('');
  const [lowOnly, setLowOnly]       = useState(false);
  const [restocking, setRestocking] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['resources', typeFilter, lowOnly],
    queryFn: () => resourcesApi.list({ type: typeFilter || undefined, lowStock: lowOnly, limit: 100 }).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const resources = data?.data ?? [];
  const lowCount  = resources.filter((r) => r.isLow).length;

  const FilterBtn = ({ active, onClick, children }) => (
    <button onClick={onClick} style={{
      background: active ? 'rgba(59,130,246,0.15)' : 'var(--color-surface-3)',
      border: `1px solid ${active ? 'rgba(59,130,246,0.4)' : 'var(--color-border)'}`,
      borderRadius: '7px', color: active ? '#93c5fd' : 'var(--color-text-secondary)',
      cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, padding: '0.4rem 0.875rem',
      transition: 'all 0.15s', fontFamily: 'inherit',
    }}>{children}</button>
  );

  return (
    <Layout title="Resources" subtitle="Medical resource inventory & alerts">
      {restocking && <RestockModal resource={restocking} onClose={() => setRestocking(null)} />}

      {/* Low stock alert banner */}
      {lowCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.625rem',
          background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)',
          borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem',
        }}>
          <AlertTriangle size={16} color="#f97316" />
          <span style={{ fontSize: '0.85rem', color: '#fdba74' }}>
            <strong>{lowCount} resource{lowCount > 1 ? 's' : ''}</strong> below minimum threshold — immediate restocking required.
          </span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <FilterBtn active={!typeFilter} onClick={() => setTypeFilter('')}>All Types</FilterBtn>
        {['MEDICINE', 'OXYGEN', 'VENTILATOR', 'EQUIPMENT', 'BLOOD'].map((t) => (
          <FilterBtn key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>
            {TYPE_CONFIG[t]?.icon} {t}
          </FilterBtn>
        ))}
        <div style={{ width: 1, background: 'var(--color-border)', margin: '0 0.25rem' }} />
        <FilterBtn active={lowOnly} onClick={() => setLowOnly(!lowOnly)}>
          <TrendingDown size={13} style={{ display: 'inline', marginRight: 4 }} />
          Low Stock Only
        </FilterBtn>
      </div>

      {/* Resource cards */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
          <Loader2 size={24} style={{ animation: 'spin 0.7s linear infinite', display: 'inline-block', marginBottom: '0.75rem' }} />
          <p>Loading resources...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {resources.map((r) => {
            const cfg = TYPE_CONFIG[r.type] ?? TYPE_CONFIG.EQUIPMENT;
            return (
              <div key={r.id} className="card card-hover" style={{
                borderTop: `2px solid ${r.isCritical ? '#ef4444' : r.isLow ? '#f97316' : cfg.color}40`,
                padding: '1.125rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{ fontSize: '1.3rem', lineHeight: 1 }}>{cfg.icon}</div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2 }}>{r.name}</p>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 600, padding: '1px 7px', borderRadius: '99px',
                        background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30`,
                      }}>{r.type}</span>
                    </div>
                  </div>
                  {r.isCritical && <AlertTriangle size={16} color="#ef4444" />}
                </div>

                <StockBar quantity={r.quantity} threshold={r.threshold} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.875rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Threshold: {r.threshold} {r.unit}</span>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '0.3rem 0.75rem', gap: '0.3rem' }}
                    onClick={() => setRestocking(r)}
                  >
                    <Plus size={12} /> Restock
                  </button>
                </div>
              </div>
            );
          })}
          {resources.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
              <Package size={28} style={{ opacity: 0.3, display: 'block', margin: '0 auto 0.75rem' }} />
              <p>No resources found.</p>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

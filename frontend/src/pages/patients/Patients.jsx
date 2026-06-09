import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Search, AlertTriangle, X, Loader2, RefreshCw } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { patientsApi } from '../../services/modules';
import useAuthStore from '../../store/authStore';

const PRIORITY_MAP = {
  CRITICAL: { label: 'CRITICAL', cls: 'badge badge-critical', dot: '#ef4444' },
  HIGH:     { label: 'HIGH',     cls: 'badge badge-high',     dot: '#f97316' },
  MEDIUM:   { label: 'MEDIUM',   cls: 'badge badge-medium',   dot: '#eab308' },
  LOW:      { label: 'LOW',      cls: 'badge badge-low',       dot: '#22c55e' },
};

const STATUS_MAP = {
  WAITING:    { label: 'Waiting',   cls: 'badge badge-medium' },
  TRIAGED:    { label: 'Triaged',   cls: 'badge badge-high'   },
  ADMITTED:   { label: 'Admitted',  cls: 'badge badge-info'   },
  DISCHARGED: { label: 'Discharged', cls: 'badge badge-success' },
};

// ─── Register Patient Modal ───────────────────────────────────
function RegisterModal({ onClose, onSuccess }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '', age: '', gender: 'MALE', phone: '', symptoms: '', emergencyContact: '',
  });
  const [err, setErr] = useState('');

  const mutation = useMutation({
    mutationFn: (data) => patientsApi.register(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      onSuccess();
      onClose();
    },
    onError: (e) => setErr(e.response?.data?.message ?? 'Registration failed.'),
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setErr('');
    mutation.mutate({ ...form, age: parseInt(form.age, 10) });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem',
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-heavy" style={{ borderRadius: 'var(--radius-xl)', padding: '2rem', width: '100%', maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Register Patient</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 3 }}>
              AI agents will auto-triage and assign resources
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {err && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.82rem', marginBottom: '1rem', padding: '0.625rem 0.875rem' }}>
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>Full Name *</label>
              <input className="input" placeholder="John Doe" value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>Age *</label>
              <input className="input" type="number" placeholder="35" min="0" max="150" value={form.age} onChange={(e) => set('age', e.target.value)} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>Gender *</label>
              <select className="input" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>Phone *</label>
              <input className="input" placeholder="+1-555-0000" value={form.phone} onChange={(e) => set('phone', e.target.value)} required />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>
              Symptoms / Chief Complaint *
            </label>
            <textarea
              className="input"
              placeholder="Describe symptoms in detail... e.g., chest pain radiating to left arm, shortness of breath"
              value={form.symptoms}
              onChange={(e) => set('symptoms', e.target.value)}
              rows={3} required
              style={{ resize: 'vertical', minHeight: 80 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>Emergency Contact</label>
            <input className="input" placeholder="+1-555-0001" value={form.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)} />
          </div>

          <div style={{
            background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '8px', padding: '0.625rem 0.875rem', fontSize: '0.78rem', color: '#c4b5fd',
          }}>
            🤖 After registration, the <strong>Triage Agent</strong> will automatically assess priority, the <strong>Bed Agent</strong> will assign a bed, and the <strong>Doctor Agent</strong> will match an available physician.
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={mutation.isPending}>
              {mutation.isPending ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} />Registering...</> : <><UserPlus size={15} />Register & Trigger AI</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const FilterBtn = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? 'rgba(59,130,246,0.15)' : 'var(--color-surface-3)',
      border: `1px solid ${active ? 'rgba(59,130,246,0.4)' : 'var(--color-border)'}`,
      borderRadius: '7px', color: active ? '#93c5fd' : 'var(--color-text-secondary)',
      cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, padding: '0.4rem 0.875rem',
      transition: 'all 0.15s', fontFamily: 'inherit',
    }}
  >{children}</button>
);

// ─── Main Patients Page ───────────────────────────────────────
export default function Patients() {
  const qc = useQueryClient();
  const { hasPermission } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['patients', { search, statusFilter, priorityFilter, page }],
    queryFn: () => patientsApi.list({ search, status: statusFilter, priority: priorityFilter, page, limit: 15 }).then((r) => r.data),
    keepPreviousData: true,
  });

  const patients  = data?.data ?? [];
  const meta      = data?.meta ?? {};

  const dischargeM = useMutation({
    mutationFn: (id) => patientsApi.update(id, { status: 'DISCHARGED' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });

  return (
    <Layout title="Patients" subtitle="Patient management & registration">
      {showModal && <RegisterModal onClose={() => setShowModal(false)} onSuccess={() => {}} />}

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: '2rem' }}
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <button className="btn btn-secondary" style={{ gap: '0.375rem' }} onClick={() => qc.invalidateQueries({ queryKey: ['patients'] })}>
          <RefreshCw size={14} className={isFetching ? 'spin' : ''} />
        </button>
        {hasPermission('PATIENT_CREATE') && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <UserPlus size={15} />
            Register Patient
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <FilterBtn active={!statusFilter} onClick={() => { setStatusFilter(''); setPage(1); }}>All Status</FilterBtn>
        {['WAITING', 'TRIAGED', 'ADMITTED', 'DISCHARGED'].map((s) => (
          <FilterBtn key={s} active={statusFilter === s} onClick={() => { setStatusFilter(s); setPage(1); }}>{s}</FilterBtn>
        ))}
        <div style={{ width: 1, background: 'var(--color-border)', margin: '0 0.25rem' }} />
        <FilterBtn active={!priorityFilter} onClick={() => { setPriorityFilter(''); setPage(1); }}>All Priority</FilterBtn>
        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
          <FilterBtn key={p} active={priorityFilter === p} onClick={() => { setPriorityFilter(p); setPage(1); }}>{p}</FilterBtn>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Age / Gender</th>
                <th>Symptoms</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Doctor</th>
                <th>Bed</th>
                <th>Registered</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  <Loader2 size={20} style={{ animation: 'spin 0.7s linear infinite', display: 'inline-block', marginBottom: '0.5rem' }} />
                  <p>Loading patients...</p>
                </td></tr>
              ) : patients.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  <UserPlus size={28} style={{ opacity: 0.3, margin: '0 auto 0.75rem', display: 'block' }} />
                  <p style={{ fontSize: '0.9rem' }}>No patients found.</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Click "Register Patient" to add the first patient.</p>
                </td></tr>
              ) : patients.map((p) => {
                const priority = p.priority ? PRIORITY_MAP[p.priority] : null;
                const status   = STATUS_MAP[p.status];
                const isCrit   = p.priority === 'CRITICAL';
                return (
                  <tr key={p.id} className={isCrit ? 'pulse-critical' : ''}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        {isCrit && <AlertTriangle size={13} color="#ef4444" />}
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</p>
                          <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{p.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{p.age} / {p.gender}</td>
                    <td style={{ maxWidth: 180 }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.symptoms}
                      </p>
                    </td>
                    <td>
                      {priority
                        ? <span className={priority.cls}><span style={{ width: 6, height: 6, borderRadius: '50%', background: priority.dot, display: 'inline-block' }} />{priority.label}</span>
                        : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>Pending</span>}
                    </td>
                    <td>{status && <span className={status.cls}>{status.label}</span>}</td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {p.doctor ? p.doctor.user?.name : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {p.bedAssignment ? (
                        <span style={{ color: '#93c5fd' }}>{p.bedAssignment.bed?.number}</span>
                      ) : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      {p.status !== 'DISCHARGED' && (hasPermission('PATIENT_UPDATE_OWN') || hasPermission('HOSPITAL_MANAGE')) && (
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                          onClick={() => dischargeM.mutate(p.id)}
                        >
                          Discharge
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {meta.total} patients · Page {meta.page} of {meta.totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

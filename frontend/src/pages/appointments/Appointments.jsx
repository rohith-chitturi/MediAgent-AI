import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock, Plus, X, Loader2, CheckCircle, XCircle,
  Clock, User, Stethoscope, ChevronLeft, ChevronRight,
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { appointmentsApi, patientsApi, doctorsApi } from '../../services/modules';

// ─── Status config ────────────────────────────────────────────
const STATUS_CONFIG = {
  SCHEDULED:  { label: 'Scheduled',  cls: 'badge badge-info',    color: '#93c5fd' },
  COMPLETED:  { label: 'Completed',  cls: 'badge badge-success', color: '#6ee7b7' },
  CANCELLED:  { label: 'Cancelled',  cls: 'badge badge-critical', color: '#fca5a5' },
  NO_SHOW:    { label: 'No Show',    cls: 'badge badge-high',    color: '#fdba74' },
};

// ─── Helper: format date/time ─────────────────────────────────
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const fmtDateTime = (iso) => `${fmtDate(iso)} · ${fmtTime(iso)}`;

// ─── Today's Schedule Strip ───────────────────────────────────
function TodayStrip() {
  const { data, isLoading } = useQuery({
    queryKey: ['appointments-today'],
    queryFn: () => appointmentsApi.today().then((r) => r.data.data),
    refetchInterval: 60_000,
  });

  if (isLoading) return null;

  const appts = data ?? [];

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(59,130,246,0.07) 0%, rgba(139,92,246,0.07) 100%)',
      border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-lg)',
      padding: '1rem 1.25rem', marginBottom: '1.25rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Clock size={15} color="#93c5fd" />
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#93c5fd' }}>
          Today's Schedule
        </span>
        <span style={{ marginLeft: 'auto', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '99px', color: '#93c5fd', fontSize: '0.72rem', fontWeight: 700, padding: '1px 8px' }}>
          {appts.length} appointment{appts.length !== 1 ? 's' : ''}
        </span>
      </div>
      {appts.length === 0 ? (
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>No appointments scheduled for today.</p>
      ) : (
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {appts.map((a) => (
            <div key={a.id} style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', padding: '0.625rem 0.875rem',
              minWidth: 200, flexShrink: 0,
            }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#93c5fd', marginBottom: '0.2rem' }}>{fmtTime(a.scheduledAt)}</p>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.2rem' }}>{a.patient?.name}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Dr. {a.doctor?.user?.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Book Appointment Modal ───────────────────────────────────
function BookModal({ onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ patientId: '', doctorId: '', scheduledAt: '', notes: '' });
  const [err, setErr] = useState('');

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Load patients & doctors for selects
  const { data: pData } = useQuery({
    queryKey: ['patients-select'],
    queryFn: () => patientsApi.list({ limit: 100, status: 'WAITING' }).then((r) => r.data.data),
  });
  const { data: dData } = useQuery({
    queryKey: ['doctors-select'],
    queryFn: () => doctorsApi.list({ isAvailable: 'true', limit: 50 }).then((r) => r.data.data),
  });

  const mut = useMutation({
    mutationFn: () => {
      // datetime-local gives "2026-06-15T10:00" — we need a full ISO string
      const isoDate = form.scheduledAt
        ? new Date(form.scheduledAt + ':00').toISOString()
        : null;
      if (!isoDate || isNaN(new Date(isoDate))) {
        throw new Error('Please select a valid date and time.');
      }
      return appointmentsApi.create({
        patientId:   form.patientId,
        doctorId:    form.doctorId,
        scheduledAt: isoDate,
        notes:       form.notes,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointments-today'] });
      onClose();
    },
    onError: (e) => setErr(e.response?.data?.message ?? 'Booking failed. Check for time conflicts.'),
  });

  const patients = pData ?? [];
  const doctors  = dData ?? [];

  // Min datetime = now
  const minDt = new Date(Date.now() + 5 * 60_000).toISOString().slice(0, 16);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-heavy" style={{ borderRadius: 'var(--radius-xl)', padding: '2rem', width: '100%', maxWidth: 520 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Schedule Appointment</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 3 }}>Conflicts within 30 min are detected automatically</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}><X size={18} /></button>
        </div>

        {err && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.82rem', marginBottom: '1rem', padding: '0.625rem 0.875rem' }}>
            {err}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); setErr(''); mut.mutate(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Patient */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>
              <User size={12} style={{ display: 'inline', marginRight: 4 }} />Patient *
            </label>
            <select className="input" value={form.patientId} onChange={(e) => set('patientId', e.target.value)} required>
              <option value="">Select patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.age}y · {p.gender})</option>
              ))}
            </select>
            {patients.length === 0 && (
              <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                No waiting patients. Register a patient first.
              </p>
            )}
          </div>

          {/* Doctor */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>
              <Stethoscope size={12} style={{ display: 'inline', marginRight: 4 }} />Doctor *
            </label>
            <select className="input" value={form.doctorId} onChange={(e) => set('doctorId', e.target.value)} required>
              <option value="">Select available doctor...</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>Dr. {d.user?.name} · {d.department?.name} ({d.currentLoad}/{d.maxWorkload} patients)</option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>
              <CalendarClock size={12} style={{ display: 'inline', marginRight: 4 }} />Date & Time *
            </label>
            <input
              className="input"
              type="datetime-local"
              min={minDt}
              value={form.scheduledAt}
              onChange={(e) => set('scheduledAt', e.target.value)}
              required
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>Notes</label>
            <textarea
              className="input"
              placeholder="Pre-appointment notes, reason for visit..."
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              style={{ resize: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={mut.isPending}>
              {mut.isPending
                ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} />Booking...</>
                : <><Plus size={15} />Book Appointment</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Appointments Page ───────────────────────────────────
export default function Appointments() {
  const qc = useQueryClient();
  const [showModal, setShowModal]       = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]                 = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['appointments', statusFilter, page],
    queryFn: () => appointmentsApi.list({ status: statusFilter || undefined, page, limit: 15 }).then((r) => r.data),
    keepPreviousData: true,
  });

  const appointments = data?.data ?? [];
  const meta         = data?.meta ?? {};

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => appointmentsApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointments-today'] });
    },
  });

  const FilterBtn = ({ active, onClick, children }) => (
    <button onClick={onClick} style={{
      background: active ? 'rgba(59,130,246,0.15)' : 'var(--color-surface-3)',
      border: `1px solid ${active ? 'rgba(59,130,246,0.4)' : 'var(--color-border)'}`,
      borderRadius: '7px', color: active ? '#93c5fd' : 'var(--color-text-secondary)',
      cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, padding: '0.4rem 0.875rem',
      transition: 'all 0.15s', fontFamily: 'inherit',
    }}>{children}</button>
  );

  // Check if appointment is upcoming (can still be cancelled)
  const isUpcoming = (iso) => new Date(iso) > new Date();

  return (
    <Layout title="Appointments" subtitle="Schedule and manage patient-doctor appointments">
      {showModal && <BookModal onClose={() => setShowModal(false)} />}

      {/* Today's strip */}
      <TodayStrip />

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flex: 1, flexWrap: 'wrap' }}>
          <FilterBtn active={!statusFilter} onClick={() => { setStatusFilter(''); setPage(1); }}>All</FilterBtn>
          {['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map((s) => (
            <FilterBtn key={s} active={statusFilter === s} onClick={() => { setStatusFilter(s); setPage(1); }}>
              {STATUS_CONFIG[s].label}
            </FilterBtn>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} />
          Book Appointment
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Department</th>
                <th>Notes</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  <Loader2 size={20} style={{ animation: 'spin 0.7s linear infinite', display: 'inline-block', marginBottom: '0.5rem' }} />
                  <p style={{ marginTop: '0.5rem' }}>Loading appointments...</p>
                </td></tr>
              ) : appointments.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--color-text-muted)' }}>
                  <CalendarClock size={32} style={{ opacity: 0.25, display: 'block', margin: '0 auto 0.75rem' }} />
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>No appointments found.</p>
                  <p style={{ fontSize: '0.8rem' }}>Click "Book Appointment" to schedule the first one.</p>
                </td></tr>
              ) : appointments.map((a) => {
                const st = STATUS_CONFIG[a.status];
                const upcoming = isUpcoming(a.scheduledAt);
                return (
                  <tr key={a.id}>
                    {/* Date/Time */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{fmtDate(a.scheduledAt)}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#93c5fd' }}>
                          <Clock size={11} />{fmtTime(a.scheduledAt)}
                        </span>
                      </div>
                    </td>

                    {/* Patient */}
                    <td>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.patient?.name}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{a.patient?.phone}</p>
                      </div>
                    </td>

                    {/* Doctor */}
                    <td>
                      <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>Dr. {a.doctor?.user?.name}</p>
                    </td>

                    {/* Department */}
                    <td>
                      <span style={{ fontSize: '0.78rem', color: '#a78bfa', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '6px', padding: '2px 8px' }}>
                        {a.doctor?.department?.name ?? '—'}
                      </span>
                    </td>

                    {/* Notes */}
                    <td style={{ maxWidth: 180 }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.notes || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                      </p>
                    </td>

                    {/* Status */}
                    <td>
                      {st && <span className={st.cls}>{st.label}</span>}
                    </td>

                    {/* Actions */}
                    <td>
                      {a.status === 'SCHEDULED' && (
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', gap: '0.3rem', color: '#6ee7b7', borderColor: 'rgba(16,185,129,0.3)' }}
                            onClick={() => updateStatus.mutate({ id: a.id, status: 'COMPLETED' })}
                            disabled={updateStatus.isPending}
                            title="Mark as completed"
                          >
                            <CheckCircle size={12} /> Done
                          </button>
                          {upcoming && (
                            <button
                              className="btn btn-secondary"
                              style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', gap: '0.3rem', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.3)' }}
                              onClick={() => updateStatus.mutate({ id: a.id, status: 'CANCELLED' })}
                              disabled={updateStatus.isPending}
                              title="Cancel appointment"
                            >
                              <XCircle size={12} /> Cancel
                            </button>
                          )}
                          {!upcoming && (
                            <button
                              className="btn btn-secondary"
                              style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', gap: '0.3rem', color: '#fdba74', borderColor: 'rgba(249,115,22,0.3)' }}
                              onClick={() => updateStatus.mutate({ id: a.id, status: 'NO_SHOW' })}
                              disabled={updateStatus.isPending}
                              title="Mark as no-show"
                            >
                              <XCircle size={12} /> No Show
                            </button>
                          )}
                        </div>
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
              {meta.total} appointments · Page {meta.page} of {meta.totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.3rem' }} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft size={14} />Prev
              </button>
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.3rem' }} disabled={page === meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next<ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

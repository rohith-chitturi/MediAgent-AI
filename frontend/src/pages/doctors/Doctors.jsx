import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stethoscope, CheckCircle, XCircle, Loader2, Building2, Search } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { doctorsApi } from '../../services/modules';

const DEPT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

function LoadBar({ current, max }) {
  const pct = Math.min(100, Math.round((current / max) * 100));
  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f97316' : pct >= 50 ? '#eab308' : '#10b981';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Workload</span>
        <span style={{ fontSize: '0.72rem', color, fontWeight: 600 }}>{current}/{max} patients</span>
      </div>
      <div style={{ background: 'var(--color-surface-3)', borderRadius: '99px', height: 5, overflow: 'hidden' }}>
        <div style={{ background: color, height: '100%', width: `${pct}%`, borderRadius: '99px', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

function DoctorCard({ doctor, onToggle, isToggling }) {
  const initials = doctor.user?.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const deptColor = DEPT_COLORS[doctor.departmentId?.charCodeAt(0) % DEPT_COLORS.length] ?? '#94a3b8';

  return (
    <div className="card card-hover" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', marginBottom: '0.875rem' }}>
        {/* Avatar */}
        <div style={{
          width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
          background: `linear-gradient(135deg, ${deptColor}40, ${deptColor}20)`,
          border: `1px solid ${deptColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.9rem', fontWeight: 700, color: deptColor,
        }}>
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {doctor.user?.name}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>
            {doctor.specialization}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Building2 size={11} color={deptColor} />
            <span style={{ fontSize: '0.72rem', color: deptColor }}>{doctor.department?.name}</span>
          </div>
        </div>

        {/* Availability toggle */}
        <button
          onClick={() => onToggle(doctor.id)}
          disabled={isToggling}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.72rem', fontWeight: 600,
            background: doctor.isAvailable ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${doctor.isAvailable ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            borderRadius: '99px', color: doctor.isAvailable ? '#6ee7b7' : '#fca5a5',
            cursor: 'pointer', padding: '3px 10px', transition: 'all 0.2s', fontFamily: 'inherit',
            opacity: isToggling ? 0.6 : 1,
          }}
        >
          {doctor.isAvailable ? <CheckCircle size={11} /> : <XCircle size={11} />}
          {doctor.isAvailable ? 'Available' : 'Unavailable'}
        </button>
      </div>

      <LoadBar current={doctor.currentLoad} max={doctor.maxWorkload} />

      {/* Active patients */}
      {doctor.patients?.length > 0 && (
        <div style={{ marginTop: '0.875rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
            Active Patients ({doctor.patients.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {doctor.patients.map((pt) => (
              <span key={pt.id} style={{
                fontSize: '0.7rem', background: 'var(--color-surface-3)', border: '1px solid var(--color-border)',
                borderRadius: '6px', color: 'var(--color-text-secondary)', padding: '2px 7px',
              }}>
                {pt.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const FilterBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    background: active ? 'rgba(59,130,246,0.15)' : 'var(--color-surface-3)',
    border: `1px solid ${active ? 'rgba(59,130,246,0.4)' : 'var(--color-border)'}`,
    borderRadius: '7px', color: active ? '#93c5fd' : 'var(--color-text-secondary)',
    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, padding: '0.4rem 0.875rem',
    transition: 'all 0.15s', fontFamily: 'inherit',
  }}>{children}</button>
);

export default function Doctors() {
  const qc = useQueryClient();
  const [deptFilter, setDeptFilter] = useState('');
  const [availFilter, setAvailFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => doctorsApi.departments().then((r) => r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', deptFilter, availFilter, searchQuery],
    queryFn: () => doctorsApi.list({
      search: searchQuery || undefined,
      departmentId: deptFilter || undefined,
      isAvailable:  availFilter || undefined,
      limit: 50,
    }).then((r) => r.data),
  });

  const toggleMut = useMutation({
    mutationFn: (id) => doctorsApi.toggleAvailable(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctors'] }),
  });

  const doctors = data?.data ?? [];

  return (
    <Layout title="Doctors" subtitle="Medical staff profiles & workload management">
      {/* Filters & Search */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', borderRadius: '7px', padding: '0.4rem 0.6rem' }}>
          <Search size={14} color="var(--color-text-muted)" style={{ marginRight: '0.4rem' }} />
          <input 
            type="text" 
            placeholder="Search doctors..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--color-text)', fontSize: '0.8rem', outline: 'none', width: '140px', fontFamily: 'inherit' }}
          />
        </div>
        <div style={{ width: 1, height: '1.2rem', background: 'var(--color-border)', margin: '0 0.25rem' }} />
        <FilterBtn active={!availFilter} onClick={() => setAvailFilter('')}>All</FilterBtn>
        <FilterBtn active={availFilter === 'true'} onClick={() => setAvailFilter('true')}>✓ Available</FilterBtn>
        <FilterBtn active={availFilter === 'false'} onClick={() => setAvailFilter('false')}>✗ Unavailable</FilterBtn>
        <div style={{ width: 1, background: 'var(--color-border)', margin: '0 0.25rem' }} />
        <FilterBtn active={!deptFilter} onClick={() => setDeptFilter('')}>All Departments</FilterBtn>
        {(deptsData ?? []).map((d) => (
          <FilterBtn key={d.id} active={deptFilter === d.id} onClick={() => setDeptFilter(d.id)}>
            {d.name} ({d._count?.doctors ?? 0})
          </FilterBtn>
        ))}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
          <Loader2 size={24} style={{ animation: 'spin 0.7s linear infinite', display: 'inline-block', marginBottom: '0.75rem' }} />
          <p>Loading doctors...</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {doctors.map((d) => (
              <DoctorCard key={d.id} doctor={d} onToggle={(id) => toggleMut.mutate(id)} isToggling={toggleMut.isPending} />
            ))}
          </div>
          {doctors.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
              <Stethoscope size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 0.75rem' }} />
              <p>No doctors found.</p>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

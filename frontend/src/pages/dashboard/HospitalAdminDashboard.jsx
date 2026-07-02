import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Stethoscope, Bed, Activity, BrainCircuit,
  AlertTriangle, CheckCircle, Package, CalendarClock,
  Wifi, WifiOff,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import Layout from '../../components/layout/Layout';
import { dashboardApi } from '../../services/modules';
import { getSocket } from '../../services/socket';

const CONFIDENCE_STYLE = {
  HIGH:   { color: '#6ee7b7', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)' },
  MEDIUM: { color: '#fde047', bg: 'rgba(234,179,8,0.12)',   border: 'rgba(234,179,8,0.25)'  },
  LOW:    { color: '#fca5a5', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)'  },
};

const AGENT_COLORS = {
  TriageAgent: '#8b5cf6', BedAllocationAgent: '#3b82f6', DoctorAssignAgent: '#10b981',
  ResourceAgent: '#f59e0b', NotificationAgent: '#ec4899', VoiceCallAgent: '#06b6d4', ManagerAgent: '#6366f1',
};

const PRIORITY_COLORS = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e' };

function StatCard({ label, value, icon: Icon, color, sub, pulse }) {
  return (
    <div className="stat-card" style={{ borderTop: `2px solid ${color}40` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
        <div style={{ background: `${color}20`, border: `1px solid ${color}30`, borderRadius: '8px', padding: '6px', color, position: 'relative' }}>
          <Icon size={15} strokeWidth={2} />
          {pulse && <span style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, background: color, borderRadius: '50%', boxShadow: `0 0 0 2px ${color}40` }} />}
        </div>
      </div>
      <p style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>{value ?? '—'}</p>
      {sub && <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>{sub}</p>}
    </div>
  );
}

function AgentFeedItem({ action }) {
  const agentColor = AGENT_COLORS[action.agentName] ?? '#94a3b8';
  const confStyle  = action.confidenceLevel ? CONFIDENCE_STYLE[action.confidenceLevel] : null;
  return (
    <div className="agent-feed-item" style={{
      background: 'var(--color-surface-3)', border: '1px solid var(--color-border)',
      borderLeft: `3px solid ${agentColor}`, borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
        <div style={{ background: `${agentColor}20`, border: `1px solid ${agentColor}40`, borderRadius: '6px', padding: '4px', color: agentColor, flexShrink: 0 }}>
          <BrainCircuit size={13} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: agentColor }}>{action.agentName}</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '1px 5px' }}>{action.actionType}</span>
            {confStyle && (
              <span style={{ background: confStyle.bg, border: `1px solid ${confStyle.border}`, borderRadius: '99px', color: confStyle.color, fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px' }}>
                {action.confidenceLevel}
              </span>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
              {new Date(action.createdAt).toLocaleTimeString()}
            </span>
          </div>
          {action.decisionSummary && <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '0.2rem' }}>{action.decisionSummary}</p>}
          {action.recommendedAction && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <CheckCircle size={11} color="#10b981" />
              <span style={{ fontSize: '0.72rem', color: '#6ee7b7', fontStyle: 'italic' }}>{action.recommendedAction}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-2)', borderRadius: '8px', padding: '0.6rem 0.875rem', fontSize: '0.8rem' }}>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{label}</p>
      {payload.map((p) => <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function Dashboard() {
  const [liveActions, setLiveActions] = useState([]);
  const [isConnected, setIsConnected] = useState(() => getSocket()?.connected ?? false);

  const { data: statsData, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats().then((r) => r.data.data),
    refetchInterval: 30_000,
  });

  const stats = statsData;

  // Socket.io real-time agent feed
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on('connect',    () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('agent:action', (action) => {
      setLiveActions((prev) => [action, ...prev].slice(0, 20));
      refetch();
    });
    socket.on('dashboard:stats', () => refetch());
    return () => {
      socket.off('connect'); socket.off('disconnect');
      socket.off('agent:action'); socket.off('dashboard:stats');
    };
  }, [refetch]);

  const agentFeed = [...liveActions, ...(stats?.recentAgentActions ?? [])].slice(0, 15);

  const priorityData = Object.entries(stats?.priorityBreakdown ?? {}).map(([k, v]) => ({
    name: k, value: v, color: PRIORITY_COLORS[k] ?? '#94a3b8',
  }));

  const bedData = [
    { name: 'ICU',       Available: 0, Occupied: stats?.beds?.icuOccupied ?? 0 },
    { name: 'Emergency', Available: 0, Occupied: 0 },
    { name: 'General',   Available: stats?.beds?.available ?? 0, Occupied: stats?.beds?.occupied ?? 0 },
  ];

  return (
    <Layout title="Command Center" subtitle="Real-time hospital operations overview">
      {/* Live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {isConnected
          ? <><Wifi size={14} color="#10b981" /><span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Live</span></>
          : <><WifiOff size={14} color="var(--color-text-muted)" /><span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Offline mode</span></>
        }
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <StatCard label="Total Patients"   value={stats?.patients?.total}     icon={Users}        color="#3b82f6" sub={`${stats?.patients?.waiting ?? 0} waiting`} />
        <StatCard label="Critical"         value={stats?.patients?.critical}   icon={Activity}     color="#ef4444" sub="Immediate care" pulse={stats?.patients?.critical > 0} />
        <StatCard label="Doctors Available" value={stats?.doctors?.available}  icon={Stethoscope}  color="#10b981" sub={`${stats?.doctors?.total ?? 0} total on staff`} />
        <StatCard label="Beds Available"   value={stats?.beds?.available}      icon={Bed}          color="#8b5cf6" sub={`${stats?.beds?.occupancyRate ?? 0}% occupied`} />
        <StatCard label="Low Stock"        value={stats?.resources?.lowStock}  icon={Package}      color="#f59e0b" sub="Resources below threshold" pulse={stats?.resources?.lowStock > 0} />
        <StatCard label="Today's Appts"    value={stats?.appointments?.today}  icon={CalendarClock} color="#06b6d4" sub="Scheduled" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 370px', gap: '1.25rem' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Bed occupancy chart */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '7px', padding: '5px', color: '#93c5fd' }}>
                <Bed size={15} />
              </div>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Bed Occupancy</h2>
              <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                {stats?.beds?.occupancyRate ?? 0}% total occupancy
              </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={bedData} barSize={28}>
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="Occupied"  fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Available" fill="rgba(59,130,246,0.2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Priority breakdown */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '7px', padding: '5px', color: '#fca5a5' }}>
                <AlertTriangle size={15} />
              </div>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Patient Priority Breakdown</h2>
            </div>
            {priorityData.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={priorityData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                      {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1 }}>
                  {priorityData.map((p) => (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{p.name}</span>
                      </div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: p.color }}>{p.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                No active patients — register a patient to see the breakdown
              </div>
            )}
          </div>
        </div>

        {/* Agent Activity Feed */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '7px', padding: '5px', color: '#c4b5fd' }}>
              <BrainCircuit size={15} />
            </div>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Agent Activity</h2>
            <span style={{ marginLeft: 'auto', fontSize: '0.68rem', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '99px', color: '#c4b5fd', padding: '1px 7px', fontWeight: 600 }}>
              AI AGENTS
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '440px' }}>
            {agentFeed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)' }}>
                <BrainCircuit size={28} style={{ opacity: 0.25, margin: '0 auto 0.75rem', display: 'block' }} />
                <p style={{ fontSize: '0.82rem', marginBottom: '0.25rem' }}>No agent activity yet.</p>
                <p style={{ fontSize: '0.75rem' }}>Register a patient to trigger the agent workflow.</p>
              </div>
            ) : agentFeed.map((action, i) => <AgentFeedItem key={action.id ?? i} action={action} />)}
          </div>
        </div>
      </div>
    </Layout>
  );
}

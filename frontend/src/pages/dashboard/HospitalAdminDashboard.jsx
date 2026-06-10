import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Stethoscope, Bed, Activity, BrainCircuit,
  AlertTriangle, CheckCircle, Package, Wifi, WifiOff, Map
} from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from '../../components/layout/Layout';
import WelcomeHeader from '../../components/ui/WelcomeHeader';
import EmptyState from '../../components/ui/EmptyState';
import { dashboardApi } from '../../services/modules';
import { getSocket } from '../../services/socket';

function HealthHero({ stats, isConnected }) {
  const icuUtil = stats?.beds?.icuOccupied ? Math.round((stats.beds.icuOccupied / 5) * 100) : 0; // Assuming 5 ICU beds max for demo
  const critical = stats?.patients?.critical ?? 0;
  const healthScore = Math.max(0, 100 - (critical * 5) - (stats?.resources?.lowStock ?? 0 * 2));
  const isStable = healthScore > 80;

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-surface)] border border-[var(--color-border-2)] p-6 mb-8 shadow-2xl">
      {/* Background glow */}
      <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/3 pointer-events-none transition-colors duration-1000 ${isStable ? 'bg-emerald-500' : 'bg-rose-500'}`} />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="relative flex h-4 w-4">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isStable ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-4 w-4 ${isStable ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white uppercase tracking-wider">
              {isStable ? 'Stable Operations' : 'Attention Required'}
            </h2>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
            {isConnected ? (
              <><Wifi size={14} className="text-emerald-500" /> Live Data Stream Active</>
            ) : (
              <><WifiOff size={14} className="text-amber-500" /> Connecting to Hospital Network...</>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold mb-1">Health Score</span>
            <span className={`text-4xl font-black ${isStable ? 'text-emerald-400' : 'text-rose-400'}`}>{healthScore}</span>
          </div>
          <div className="h-12 w-px bg-[var(--color-border-2)] hidden sm:block"></div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold mb-1">ICU Utilization</span>
            <span className="text-2xl font-bold text-white">{icuUtil}%</span>
          </div>
          <div className="h-12 w-px bg-[var(--color-border-2)] hidden sm:block"></div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold mb-1">Critical Patients</span>
            <span className="text-2xl font-bold text-white">{critical}</span>
          </div>
          <div className="h-12 w-px bg-[var(--color-border-2)] hidden sm:block"></div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold mb-1">Agent Runs Today</span>
            <span className="text-2xl font-bold text-white">{stats?.agentRunsToday ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeatmapRow({ department, capacity, total, colorClass }) {
  const percentage = total > 0 ? Math.round((capacity / total) * 100) : 0;
  const blocks = 10;
  const filledBlocks = Math.round((percentage / 100) * blocks);

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-sm mb-1.5 font-medium">
        <span className="text-[var(--color-text-primary)]">{department}</span>
        <span className="text-[var(--color-text-secondary)]">{percentage}% Capacity</span>
      </div>
      <div className="flex gap-1 h-3">
        {Array.from({ length: blocks }).map((_, i) => (
          <div 
            key={i} 
            className={`flex-1 rounded-sm ${i < filledBlocks ? colorClass : 'bg-[var(--color-surface-3)] opacity-40'}`}
          />
        ))}
      </div>
    </div>
  );
}

function InterventionCard({ patient }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg bg-[var(--color-surface-2)] border border-rose-500/30 relative overflow-hidden group"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
      <div className="flex justify-between items-start mb-2 pl-2">
        <div>
          <h4 className="font-bold text-white text-sm">{patient.name}</h4>
          <p className="text-xs text-rose-400 font-medium">Critical Priority</p>
        </div>
        <span className="text-xs font-mono text-[var(--color-text-muted)] bg-[var(--color-surface)] px-2 py-1 rounded">
          {patient.id.split('-')[0]}
        </span>
      </div>
      <p className="text-xs text-[var(--color-text-secondary)] pl-2 line-clamp-2">
        {patient.triageNotes || "Immediate review required. AI agents have flagged this case."}
      </p>
      <div className="mt-3 pl-2 flex gap-2">
        <button className="text-xs bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded transition-colors font-medium">
          Review Case
        </button>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [isConnected, setIsConnected] = useState(() => getSocket()?.connected ?? false);

  const { data: statsData, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats().then((r) => r.data.data),
    refetchInterval: 30_000,
  });

  const stats = statsData;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('dashboard:stats', () => refetch());
    return () => {
      socket.off('connect'); socket.off('disconnect'); socket.off('dashboard:stats');
    };
  }, [refetch]);

  // Mock critical patients from stats or empty if none (since backend stats doesn't return full patient list)
  // In a real app we'd fetch these from a specific endpoint
  const criticalCount = stats?.patients?.critical ?? 0;
  const mockCriticalPatients = Array.from({ length: criticalCount }).map((_, i) => ({
    id: `PAT-${1000 + i}`,
    name: `Patient ${i + 1}`,
    triageNotes: "Awaiting immediate intervention based on vitals."
  }));

  const icuOccupied = stats?.beds?.icuOccupied ?? 0;
  const icuTotal = 5; // Fixed total for demo
  const genOccupied = stats?.beds?.occupied ?? 0;
  const genTotal = (stats?.beds?.available ?? 0) + genOccupied;

  return (
    <Layout title="Operations Center" subtitle="Hospital-wide command view">
      <WelcomeHeader 
        subtitle={`Hospital status is ${stats?.patients?.critical > 0 ? 'critical' : 'stable'}. ${criticalCount} patients require review.`} 
      />

      <HealthHero stats={stats} isConnected={isConnected} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: Heatmaps (60%) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass p-6 rounded-[var(--radius-lg)]">
            <div className="flex items-center gap-3 mb-6">
              <Map className="w-5 h-5 text-[var(--color-brand-400)]" />
              <h3 className="font-semibold text-white tracking-wide">Department Capacity Map</h3>
            </div>
            
            <div className="space-y-6">
              <HeatmapRow 
                department="Intensive Care Unit (ICU)" 
                capacity={icuOccupied} 
                total={icuTotal} 
                colorClass="bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" 
              />
              <HeatmapRow 
                department="Emergency Room (ER)" 
                capacity={Math.round(genTotal * 0.6)} 
                total={genTotal} 
                colorClass="bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
              />
              <HeatmapRow 
                department="General Ward" 
                capacity={genOccupied} 
                total={genTotal} 
                colorClass="bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
              />
              <HeatmapRow 
                department="Cardiology" 
                capacity={Math.round(genTotal * 0.3)} 
                total={genTotal} 
                colorClass="bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="glass p-5 rounded-[var(--radius-lg)] flex flex-col justify-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Doctors Available</span>
                <span className="text-3xl font-bold text-white">{stats?.doctors?.available ?? 0}</span>
             </div>
             <div className="glass p-5 rounded-[var(--radius-lg)] flex flex-col justify-center border-amber-500/20">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-500/80 mb-1">Low Stock Alerts</span>
                <span className="text-3xl font-bold text-amber-400">{stats?.resources?.lowStock ?? 0}</span>
             </div>
          </div>
        </div>

        {/* Right Column: Critical Interventions (40%) */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <div className="glass p-6 rounded-[var(--radius-lg)] flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  {criticalCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                  )}
                </div>
                <h3 className="font-semibold text-white tracking-wide">Critical Interventions</h3>
              </div>
              <span className="text-xs font-bold bg-rose-500/20 text-rose-400 px-2 py-1 rounded">
                {criticalCount} PENDING
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {mockCriticalPatients.length > 0 ? (
                mockCriticalPatients.map(p => <InterventionCard key={p.id} patient={p} />)
              ) : (
                <EmptyState 
                  icon={CheckCircle}
                  title="No Critical Interventions"
                  description="All patients are currently stable. No immediate human overrides required."
                />
              )}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}

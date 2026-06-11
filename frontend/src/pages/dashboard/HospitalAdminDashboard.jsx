import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, UserPlus, AlertTriangle, CheckCircle, 
  BrainCircuit, Bed, Activity, Network, HeartPulse, Stethoscope, 
  Package, Wifi, WifiOff, FileText, ArrowRight 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { dashboardApi } from '../../services/modules';
import { getSocket } from '../../services/socket';

// ─── 1. Hospital Hero Section ──────────────────────────────────────────
function HospitalHero({ stats, isConnected }) {
  const isStable = (stats?.patients?.critical ?? 0) === 0;

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-r from-blue-900 via-[var(--color-surface-2)] to-[var(--color-bg)] border border-[var(--color-border-2)] p-6 shadow-2xl col-span-12">
      {/* Background Healthcare SVG Illustration */}
      <svg className="absolute right-0 top-0 h-full w-1/3 opacity-10 text-white pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
      
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-2 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isStable ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isStable ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {isStable ? 'System Stable' : 'Action Required'}
            </h2>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Apollo Command Center</h1>
          <p className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
            {isConnected ? <><Wifi size={14} className="text-emerald-500" /> Live Data Stream Active</> : <><WifiOff size={14} className="text-amber-500" /> Connecting...</>}
          </p>
        </div>

        <div className="md:col-span-3 grid grid-cols-3 gap-4">
          <div className="glass p-4 rounded-xl border-[var(--color-border)] flex flex-col justify-center">
            <span className="text-[10px] uppercase text-[var(--color-text-muted)] font-bold mb-1">Admissions Today</span>
            <span className="text-3xl font-bold text-white">{stats?.patients?.total || 12}</span>
          </div>
          <div className="glass p-4 rounded-xl border-[var(--color-border)] flex flex-col justify-center relative overflow-hidden">
             {stats?.patients?.critical > 0 && <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500 blur-2xl opacity-30 rounded-full" />}
            <span className="text-[10px] uppercase text-[var(--color-text-muted)] font-bold mb-1">Critical Cases</span>
            <span className={`text-3xl font-bold ${stats?.patients?.critical > 0 ? 'text-rose-400' : 'text-white'}`}>{stats?.patients?.critical || 0}</span>
          </div>
          <div className="glass p-4 rounded-xl border-[var(--color-border)] flex flex-col justify-center">
            <span className="text-[10px] uppercase text-[var(--color-text-muted)] font-bold mb-1">AI Workflows</span>
            <span className="text-3xl font-bold text-purple-400">{stats?.agentRunsToday || 284}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 2. Quick Action Cards ─────────────────────────────────────────────
function QuickActionCard({ icon: Icon, title, description, color, onClick }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`glass p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] flex flex-col items-start text-left transition-colors hover:border-${color}-500/50 group`}
    >
      <div className={`p-3 rounded-lg bg-${color}-500/10 text-${color}-400 mb-3 group-hover:bg-${color}-500/20 transition-colors`}>
        <Icon size={20} />
      </div>
      <h3 className="font-bold text-white text-sm">{title}</h3>
      <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">{description}</p>
    </motion.button>
  );
}

// ─── 3. Visual Department Cards ─────────────────────────────────────────
function DepartmentCard({ name, icon: Icon, occupied, total, color }) {
  const percentage = total > 0 ? Math.round((occupied / total) * 100) : 0;
  
  return (
    <div className="glass p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)]">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 text-${color}-400`} />
          <span className="font-semibold text-white text-sm">{name}</span>
        </div>
        <span className="text-xs font-mono text-[var(--color-text-muted)]">{percentage}%</span>
      </div>
      
      {/* Visual Fill Indicator */}
      <div className="h-2 w-full bg-[var(--color-surface-3)] rounded-full overflow-hidden mb-2">
        <div className={`h-full bg-${color}-500 transition-all duration-1000`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="flex justify-between text-[10px] uppercase text-[var(--color-text-muted)] font-semibold">
        <span>{occupied} Occupied</span>
        <span>{total - occupied} Available</span>
      </div>
    </div>
  );
}

// ─── 4. Live Activity Feed ─────────────────────────────────────────────
function LiveFeedItem({ icon: Icon, color, title, time, children }) {
  return (
    <div className="flex gap-4 relative">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-${color}-500/10 text-${color}-400 z-10 border border-[var(--color-border)]`}>
          <Icon size={14} />
        </div>
        <div className="w-px h-full bg-[var(--color-border-2)] my-1" />
      </div>
      <div className="pb-6 pt-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-white">{title}</span>
          <span className="text-[10px] text-[var(--color-text-muted)]">{time}</span>
        </div>
        <div className="text-xs text-[var(--color-text-secondary)]">{children}</div>
      </div>
    </div>
  );
}

// ─── 5. AI Insights Widget ─────────────────────────────────────────────
function AIInsights() {
  return (
    <div className="glass rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-[var(--color-border-2)] bg-[var(--color-surface-2)]/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-purple-400" />
          <h3 className="font-semibold text-white text-sm">AI Insights Engine</h3>
        </div>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
        </span>
      </div>
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        <div className="p-3 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg relative overflow-hidden">
          <div className="absolute left-0 top-0 w-1 h-full bg-amber-500" />
          <div className="flex justify-between items-start mb-1">
            <span className="text-xs font-bold text-amber-400">RESOURCE ALERT</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 rounded">HIGH CONFIDENCE</span>
          </div>
          <p className="text-xs text-[var(--color-text-primary)] mt-1">
            Ventilator supply dropping in ICU. Recommend transferring 2 units from General Storage based on predicted admission rates.
          </p>
        </div>

        <div className="p-3 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg relative overflow-hidden">
          <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500" />
          <div className="flex justify-between items-start mb-1">
            <span className="text-xs font-bold text-emerald-400">TRIAGE OPTIMIZATION</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 rounded">MED CONFIDENCE</span>
          </div>
          <p className="text-xs text-[var(--color-text-primary)] mt-1">
            Current ER wait time is 45m. Diverting non-critical trauma to Ward B could reduce bottleneck by 20%.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard Component ──────────────────────────────────────────
export default function HospitalAdminDashboard() {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(() => getSocket()?.connected ?? false);

  const { data: statsData, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats().then(r => r.data.data),
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

  const icuOccupied = stats?.beds?.icuOccupied ?? 0;
  const genOccupied = stats?.beds?.occupied ?? 0;
  const genTotal = (stats?.beds?.available ?? 0) + genOccupied;

  return (
    <Layout title="Dashboard" subtitle="Hospital Operations Command Center">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Row 1: Hospital Hero */}
        <HospitalHero stats={stats} isConnected={isConnected} />

        {/* Row 2: Quick Action Cards */}
        <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard icon={UserPlus} title="Register Patient" description="Intake a new patient and trigger AI." color="blue" onClick={() => navigate('/patients')} />
          <QuickActionCard icon={AlertTriangle} title="Critical Cases" description="View patients needing immediate override." color="rose" onClick={() => navigate('/patients')} />
          <QuickActionCard icon={Package} title="Resource Management" description="Check stock and inventory levels." color="amber" onClick={() => navigate('/resources')} />
          <QuickActionCard icon={Network} title="Agent Activity" description="Watch live AI workflow traces." color="purple" onClick={() => navigate('/agent-activity')} />
        </div>

        {/* Row 3: Department Capacity & AI Preview (Left 8 cols) | Insights & Feed (Right 4 cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          
          {/* Visual Department Cards */}
          <div className="glass p-6 rounded-[var(--radius-lg)]">
            <h3 className="font-semibold text-white tracking-wide mb-4 text-sm">Department Capacity Map</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DepartmentCard name="Intensive Care (ICU)" icon={Activity} occupied={icuOccupied} total={5} color="rose" />
              <DepartmentCard name="Emergency Room" icon={AlertTriangle} occupied={Math.round(genTotal * 0.6)} total={genTotal} color="amber" />
              <DepartmentCard name="General Ward" icon={Bed} occupied={genOccupied} total={genTotal} color="emerald" />
              <DepartmentCard name="Cardiology" icon={HeartPulse} occupied={Math.round(genTotal * 0.3)} total={genTotal} color="blue" />
            </div>
          </div>

          {/* Live AI Workflow Preview Widget */}
          <div className="glass rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden flex-1 flex flex-col min-h-[250px]">
             <div className="p-4 border-b border-[var(--color-border-2)] bg-[var(--color-surface-2)]/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-blue-400" />
                  <h3 className="font-semibold text-white text-sm">Live AI Workflow Preview</h3>
                </div>
                <button onClick={() => navigate('/agent-activity')} className="text-xs flex items-center gap-1 text-[var(--color-text-secondary)] hover:text-white transition-colors">
                  Open Mission Control <ArrowRight size={12} />
                </button>
             </div>
             <div className="p-8 flex-1 flex items-center justify-center bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-2)] relative overflow-hidden">
                {/* Visual Nodes representing a mini workflow */}
                <div className="flex items-center w-full max-w-lg justify-between relative z-10">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[var(--color-border-2)] -z-10 -translate-y-1/2" />
                  <div className="absolute top-1/2 left-0 w-2/3 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] -z-10 -translate-y-1/2" />
                  
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]"><UserPlus size={16}/></div>
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]"><BrainCircuit size={16}/></div>
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]"><Bed size={16}/></div>
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse"><Stethoscope size={16}/></div>
                  <div className="w-10 h-10 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-border-2)] flex items-center justify-center"><CheckCircle size={16}/></div>
                </div>
                <div className="absolute bottom-4 text-xs text-[var(--color-text-muted)] font-mono">
                  LATEST RUN: PAT-1049 (Doctor Assigning...)
                </div>
             </div>
          </div>
        </div>

        {/* Right 4 cols: Insights & Feed */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="h-[280px]">
            <AIInsights />
          </div>

          <div className="glass p-6 rounded-[var(--radius-lg)] flex-1 overflow-hidden flex flex-col">
            <h3 className="font-semibold text-white tracking-wide mb-6 text-sm">Live Activity Feed</h3>
            <div className="flex-1 overflow-y-auto pr-2">
              <LiveFeedItem icon={UserPlus} color="blue" title="Patient Admitted" time="Just now">
                John Doe registered in ER. Symptoms: Chest pain.
              </LiveFeedItem>
              <LiveFeedItem icon={BrainCircuit} color="purple" title="AI Triage Complete" time="2 mins ago">
                Assigned CRITICAL priority. Confidence: 94%.
              </LiveFeedItem>
              <LiveFeedItem icon={Bed} color="emerald" title="Bed Assigned" time="2 mins ago">
                Allocated to ICU Bed A1.
              </LiveFeedItem>
              <LiveFeedItem icon={Package} color="amber" title="Resource Alert" time="15 mins ago">
                Defibrillator pads running low (2 remaining).
              </LiveFeedItem>
              <LiveFeedItem icon={Stethoscope} color="blue" title="Doctor Assigned" time="1 hour ago">
                Dr. Smith assigned to PAT-1042.
              </LiveFeedItem>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}

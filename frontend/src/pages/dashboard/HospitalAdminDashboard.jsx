import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  UserPlus, AlertTriangle, CheckCircle, 
  BrainCircuit, Bed, Activity, Network, HeartPulse, Stethoscope, 
  Package, Wifi, WifiOff
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { dashboardApi } from '../../services/modules';
import { getSocket } from '../../services/socket';

// ─── 1. Hospital Hero Section (Enterprise Redesign) ─────────────────────
function HospitalHero({ stats, isConnected }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 col-span-12 flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden shadow-sm">
      {/* Subtle AI Glow */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </div>
          <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">
            AI Workforce Active
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Apollo Hospital Operations</h1>
        <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
          {isConnected ? <><Wifi size={12} className="text-emerald-400" /> System Stream Connected</> : <><WifiOff size={12} className="text-amber-400" /> Reconnecting Stream...</>}
        </p>
      </div>

      <div className="relative z-10 flex gap-8 mt-6 md:mt-0">
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Active Workflows</span>
          <span className="text-2xl font-bold text-white">{stats?.agentRunsToday || 284}</span>
        </div>
        <div className="w-px h-12 bg-slate-800" />
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Critical Alerts</span>
          <span className={`text-2xl font-bold ${stats?.patients?.critical > 0 ? 'text-rose-400' : 'text-white'}`}>{stats?.patients?.critical || 0}</span>
        </div>
      </div>
    </div>
  );
}

// ─── 2. Quick Action Cards (Command Bar Style) ──────────────────────────
function QuickActionCard({ icon: Icon, title, description, onClick }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-5 text-left transition-all hover:border-indigo-300 hover:shadow-md shadow-sm group"
    >
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div>
        <h3 className="font-semibold text-slate-900 text-sm tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{description}</p>
      </div>
    </motion.button>
  );
}

// ─── 3. Visual Department Capacity (Slim Stripe Style) ──────────────────
function DepartmentCard({ name, icon: Icon, occupied, total }) {
  const percentage = total > 0 ? Math.round((occupied / total) * 100) : 0;
  
  let barColor = "bg-slate-800";
  let textColor = "text-slate-900";
  if (percentage >= 90) { barColor = "bg-rose-500"; textColor = "text-rose-600"; }
  else if (percentage >= 75) { barColor = "bg-amber-500"; textColor = "text-amber-600"; }

  return (
    <div className="py-3.5 border-b border-slate-100 last:border-0">
      <div className="flex justify-between items-center mb-2.5">
        <div className="flex items-center gap-2.5">
          <Icon className="w-[18px] h-[18px] text-slate-400" />
          <span className="font-medium text-slate-800 text-sm">{name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-slate-500">{occupied} / {total}</span>
          <span className={`text-xs font-bold w-10 text-right ${textColor}`}>{percentage}%</span>
        </div>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

// ─── 4. Today's AI Impact (Clean Enterprise Typography) ─────────────────
function AIImpactWidget() {
  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 flex flex-col h-full shadow-sm">
      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-widest mb-8">Autonomous Impact (24h)</h3>
      <div className="grid grid-cols-2 gap-x-8 gap-y-10 flex-1">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Patients Triaged</span>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-slate-900 tracking-tight">47</span>
            <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-100">↑ 12%</span>
          </div>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Dr. Assignments</span>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-slate-900 tracking-tight">23</span>
            <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-100">↑ 5%</span>
          </div>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Bed Allocations</span>
          <span className="text-3xl font-black text-slate-900 tracking-tight">18</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Alerts Prevented</span>
          <span className="text-3xl font-black text-indigo-600 tracking-tight">6</span>
        </div>
      </div>
    </div>
  );
}

// ─── 5. AI Mission Control (Signature Feature) ──────────────────────────
function MissionControl() {
  return (
    <div className="bg-[#0a0a0a] border border-slate-800 rounded-2xl flex flex-col h-full shadow-xl overflow-hidden relative">
      {/* Ambient background inside widget */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/5 blur-[60px] pointer-events-none" />

      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-[#0f0f0f] relative z-10">
        <div className="flex items-center gap-2.5">
          <BrainCircuit className="w-4 h-4 text-indigo-400" />
          <h3 className="font-bold text-white text-xs uppercase tracking-widest">AI Mission Control</h3>
        </div>
        <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" /> COORDINATING
        </span>
      </div>
      
      {/* Terminal Feed */}
      <div className="p-6 space-y-6 flex-1 relative z-10 overflow-hidden">
        
        {/* Past Event */}
        <div className="relative pl-5 border-l border-slate-800">
          <div className="absolute w-2.5 h-2.5 rounded-full bg-slate-700 border-2 border-[#0a0a0a] -left-[5.5px] top-1" />
          <div className="text-[10px] font-mono text-slate-500 mb-1.5 flex justify-between">
            <span>REQ-992A</span>
            <span>10:42:01 AM</span>
          </div>
          <p className="text-xs font-medium text-slate-300">Parsing emergency capacity metrics.</p>
        </div>

        {/* Action Taken */}
        <div className="relative pl-5 border-l border-slate-800">
          <div className="absolute w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-[#0a0a0a] -left-[5.5px] top-1" />
          <div className="text-[10px] font-mono text-indigo-400 mb-1.5 flex justify-between">
            <span>DECISION_EXECUTED</span>
            <span>10:42:05 AM</span>
          </div>
          <p className="text-xs font-medium text-white mb-2">Route patient PAT-1049 to General Ward B.</p>
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 text-[10px] text-indigo-200 font-mono leading-relaxed">
            Reasoning: ICU full. Vitals stable.
            <br />Action: Bed booked. Nurse notified.
          </div>
        </div>

        {/* Current Active Processing */}
        <div className="relative pl-5 border-l border-teal-500/30">
          <div className="absolute w-2.5 h-2.5 rounded-full bg-teal-400 border-2 border-[#0a0a0a] -left-[5.5px] top-1 shadow-[0_0_10px_rgba(45,212,191,0.8)] animate-pulse" />
          <div className="text-[10px] font-mono text-teal-400 mb-1.5 flex justify-between">
            <span>SYSTEM_SCAN</span>
            <span>ACTIVE</span>
          </div>
          <p className="text-xs font-medium text-white">Evaluating critical stock across 4 wards...</p>
        </div>

      </div>

      {/* Footer Metrics */}
      <div className="px-6 py-4 border-t border-slate-800 bg-[#0f0f0f] flex justify-between items-center relative z-10">
         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Model Confidence</span>
         <span className="text-xs font-bold text-emerald-400 font-mono">98.4%</span>
      </div>
    </div>
  );
}

// ─── Main Dashboard Component ───────────────────────────────────────────
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
    <Layout title="Operations Intelligence" subtitle="AI-driven hospital coordination">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto pb-10">
        
        {/* Row 1: Hospital Hero */}
        <HospitalHero stats={stats} isConnected={isConnected} />

        {/* Row 2: Quick Action Command Bar */}
        <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <QuickActionCard icon={UserPlus} title="Register Patient" description="Intake & trigger AI." onClick={() => navigate('/patients')} />
          <QuickActionCard icon={AlertTriangle} title="Critical Cases" description="Immediate overrides." onClick={() => navigate('/patients')} />
          <QuickActionCard icon={Package} title="Resource Alert" description="Inventory & stock." onClick={() => navigate('/resources')} />
          <QuickActionCard icon={Network} title="Mission Control" description="Live AI traces." onClick={() => navigate('/agent-activity')} />
        </div>

        {/* Row 3: Left (Capacity & Impact) | Right (Mission Control) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-widest mb-6">Department Capacity</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2">
              <DepartmentCard name="Intensive Care (ICU)" icon={Activity} occupied={icuOccupied} total={5} />
              <DepartmentCard name="Emergency Room" icon={AlertTriangle} occupied={Math.round(genTotal * 0.6)} total={genTotal} />
              <DepartmentCard name="General Ward" icon={Bed} occupied={genOccupied} total={genTotal} />
              <DepartmentCard name="Cardiology" icon={HeartPulse} occupied={Math.round(genTotal * 0.3)} total={genTotal} />
            </div>
          </div>

          <div className="flex-1">
            <AIImpactWidget />
          </div>

        </div>

        {/* Right Column: Mission Control */}
        <div className="col-span-12 lg:col-span-4 min-h-[500px]">
          <MissionControl />
        </div>

      </div>
    </Layout>
  );
}

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  UserPlus, AlertTriangle, CheckCircle, 
  BrainCircuit, Bed, Activity, Network, HeartPulse, Stethoscope, 
  Package, Wifi, WifiOff, FileText, ArrowRight, ShieldCheck, Zap
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
    <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-br from-indigo-900 via-slate-900 to-teal-900 border border-[var(--color-border-2)] p-8 shadow-2xl col-span-12">
      {/* Background Healthcare SVG Illustration */}
      <svg className="absolute right-0 top-0 h-full w-1/3 opacity-10 text-white pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        <circle cx="12" cy="12" r="10" />
      </svg>
      
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="md:col-span-2 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-teal-400"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
            </span>
            <h2 className="text-sm font-bold text-teal-300 uppercase tracking-wider">
              AI Coordinating Operations
            </h2>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">Apollo Hospital</h1>
          <p className="text-sm text-slate-400 flex items-center gap-2">
            {isConnected ? <><Wifi size={14} className="text-emerald-500" /> Live Agent Stream Active</> : <><WifiOff size={14} className="text-amber-500" /> Reconnecting Agents...</>}
          </p>
        </div>

        <div className="md:col-span-3 grid grid-cols-3 gap-4">
          <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10 flex flex-col justify-center">
            <span className="text-[10px] uppercase text-slate-400 font-bold mb-1 tracking-wider">Workflows Today</span>
            <span className="text-4xl font-black text-white">{stats?.agentRunsToday || 284}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10 flex flex-col justify-center relative overflow-hidden">
             {stats?.patients?.critical > 0 && <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500 blur-2xl opacity-30 rounded-full" />}
            <span className="text-[10px] uppercase text-slate-400 font-bold mb-1 tracking-wider">Critical Reviews</span>
            <span className={`text-4xl font-black ${stats?.patients?.critical > 0 ? 'text-rose-400' : 'text-white'}`}>{stats?.patients?.critical || 0}</span>
          </div>
          <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm p-5 rounded-2xl border border-indigo-500/30 flex flex-col justify-center">
            <span className="text-[10px] uppercase text-indigo-300 font-bold mb-1 tracking-wider">Last AI Decision</span>
            <span className="text-sm font-semibold text-white leading-tight mt-1">Doctor Assigned to ICU Patient (98% Conf)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 2. Quick Action Cards (Light Theme) ────────────────────────────────
function QuickActionCard({ icon: Icon, title, description, color, onClick }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100 border-blue-200 hover:border-blue-300',
    rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-100 border-rose-200 hover:border-rose-300',
    amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100 border-amber-200 hover:border-amber-300',
    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100 border-purple-200 hover:border-purple-300',
  };

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-white p-5 rounded-2xl border border-slate-200 flex flex-col items-start text-left transition-all shadow-sm hover:shadow-md group`}
    >
      <div className={`p-3 rounded-xl mb-4 transition-colors ${colorMap[color].split(' ')[0]} ${colorMap[color].split(' ')[1]} ${colorMap[color].split(' ')[2]}`}>
        <Icon size={22} strokeWidth={2.5} />
      </div>
      <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 line-clamp-2 font-medium">{description}</p>
    </motion.button>
  );
}

// ─── 3. Visual Department Cards (Light Theme) ───────────────────────────
function DepartmentCard({ name, icon: Icon, occupied, total, color }) {
  const percentage = total > 0 ? Math.round((occupied / total) * 100) : 0;
  
  const bgMap = {
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
  };
  const textMap = {
    rose: 'text-rose-500',
    amber: 'text-amber-500',
    emerald: 'text-emerald-500',
    blue: 'text-blue-500',
  };

  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${textMap[color]}`} />
          <span className="font-semibold text-slate-900 text-sm">{name}</span>
        </div>
        <span className="text-xs font-bold text-slate-500">{percentage}%</span>
      </div>
      
      {/* Visual Fill Indicator */}
      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-2">
        <div className={`h-full ${bgMap[color]} transition-all duration-1000`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="flex justify-between text-[10px] uppercase text-slate-400 font-bold tracking-wider">
        <span>{occupied} Occupied</span>
        <span>{total - occupied} Available</span>
      </div>
    </div>
  );
}

// ─── 4. Today's AI Impact (New Premium Widget) ─────────────────────────
function AIImpactWidget() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
      <h3 className="font-bold text-slate-900 tracking-tight mb-5 text-sm uppercase flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-500" /> Today's AI Impact
      </h3>
      <div className="grid grid-cols-2 gap-4 flex-1">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
          <span className="text-3xl font-black text-indigo-600">47</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Patients Triaged</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
          <span className="text-3xl font-black text-emerald-600">23</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Dr. Assignments</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
          <span className="text-3xl font-black text-blue-600">18</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Bed Allocations</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
          <span className="text-3xl font-black text-rose-600">6</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Alerts Prevented</span>
        </div>
      </div>
    </div>
  );
}

// ─── 5. Current AI Activity (Main Character Widget) ─────────────────────
function CurrentAIActivity() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-900 tracking-tight text-sm uppercase flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-indigo-600" /> MediAgent AI Status
        </h3>
        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> ACTIVE
        </span>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-4 h-4 text-indigo-500 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Monitoring ER Capacity</p>
            <p className="text-xs text-slate-500">Wait times optimal. No diversion needed.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="w-4 h-4 text-indigo-500 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Reviewing Resource Availability</p>
            <p className="text-xs text-slate-500">Evaluating critical stock across 4 wards.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="w-4 h-4 text-indigo-500 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Coordinating 3 Active Cases</p>
            <p className="text-xs text-slate-500">Awaiting lab results for PAT-1049.</p>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Overall Confidence</span>
          <span className="text-sm font-black text-indigo-600">HIGH (98%)</span>
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
    <Layout title="Operations Intelligence" subtitle="AI-driven hospital coordination">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Row 1: Hospital Hero */}
        <HospitalHero stats={stats} isConnected={isConnected} />

        {/* Row 2: Quick Action Cards */}
        <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickActionCard icon={UserPlus} title="Register Patient" description="Intake a new patient and trigger AI." color="blue" onClick={() => navigate('/patients')} />
          <QuickActionCard icon={AlertTriangle} title="Critical Cases" description="View patients needing immediate override." color="rose" onClick={() => navigate('/patients')} />
          <QuickActionCard icon={Package} title="Resource Alert" description="Check stock and inventory levels." color="amber" onClick={() => navigate('/resources')} />
          <QuickActionCard icon={Network} title="Mission Control" description="Watch live AI workflow traces." color="purple" onClick={() => navigate('/agent-activity')} />
        </div>

        {/* Row 3: Department Capacity & AI Impact (Left 8 cols) | Current AI Activity (Right 4 cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 tracking-tight mb-5 text-sm uppercase">Department Capacity Map</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DepartmentCard name="Intensive Care (ICU)" icon={Activity} occupied={icuOccupied} total={5} color="rose" />
              <DepartmentCard name="Emergency Room" icon={AlertTriangle} occupied={Math.round(genTotal * 0.6)} total={genTotal} color="amber" />
              <DepartmentCard name="General Ward" icon={Bed} occupied={genOccupied} total={genTotal} color="emerald" />
              <DepartmentCard name="Cardiology" icon={HeartPulse} occupied={Math.round(genTotal * 0.3)} total={genTotal} color="blue" />
            </div>
          </div>

          <div className="h-[250px]">
            <AIImpactWidget />
          </div>

        </div>

        {/* Right 4 cols: Current AI Activity */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="flex-1">
            <CurrentAIActivity />
          </div>
        </div>

      </div>
    </Layout>
  );
}

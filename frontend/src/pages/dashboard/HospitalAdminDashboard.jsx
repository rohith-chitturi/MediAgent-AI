import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CheckCircle2, AlertCircle, BrainCircuit, Activity, 
  Bed, ShieldAlert, ArrowUpRight, ArrowDownRight, Clock, Box
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { dashboardApi } from '../../services/modules';
import { getSocket } from '../../services/socket';

// ─── 1. Operations Context ──────────────────────────────────────────────
function OperationsContext({ stats }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm col-span-12 flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden">
      <div className="relative z-10 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse" />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            System Posture
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Autonomous Operations Active
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Actively balancing ER loads and preemptively managing supply chain bottlenecks.
        </p>
      </div>

      <div className="relative z-10 flex gap-8 mt-6 md:mt-0">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Live AI Agents</span>
          <span className="text-xl font-bold text-slate-900 flex items-center gap-2">
            24 <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase border border-emerald-100 tracking-wide">Nominal</span>
          </span>
        </div>
        <div className="w-px h-10 bg-slate-100" />
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Human Overrides Needed</span>
          <span className={`text-xl font-bold ${stats?.patients?.critical > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {stats?.patients?.critical || 0}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── 2. Supervisory Actions ─────────────────────────────────────────────
function SupervisoryAction({ icon: Icon, title, description, colorClass, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col text-left transition-all hover:border-indigo-300 hover:shadow-sm group"
    >
      <div className="flex items-center gap-3 mb-2">
        <Icon size={16} className={`text-slate-400 group-hover:${colorClass} transition-colors`} />
        <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed font-medium">{description}</p>
    </button>
  );
}

// ─── 3. Contextual Capacity ─────────────────────────────────────────────
function ContextualCapacity({ name, occupied, total, aiContext }) {
  const percentage = total > 0 ? Math.round((occupied / total) * 100) : 0;
  
  let barColor = "bg-slate-800";
  let statusText = "Stable";
  let statusColor = "text-slate-500";
  
  if (percentage >= 90) { 
    barColor = "bg-rose-500"; 
    statusText = "Critical"; 
    statusColor = "text-rose-600";
  } else if (percentage >= 75) { 
    barColor = "bg-amber-500"; 
    statusText = "Elevated"; 
    statusColor = "text-amber-600"; 
  }

  return (
    <div className="py-4 border-b border-slate-100 last:border-0">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-slate-900 text-sm">{name}</span>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${statusColor}`}>{statusText}</span>
          <span className="text-xs font-mono text-slate-500">{percentage}%</span>
        </div>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2.5">
        <div className={`h-full ${barColor} transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="flex items-start gap-2 bg-slate-50/50 p-2.5 rounded-md border border-slate-100">
        <BrainCircuit size={14} className="text-indigo-500 mt-0.5 flex-shrink-0" />
        <span className="text-xs font-medium text-slate-600 leading-snug">
          {aiContext}
        </span>
      </div>
    </div>
  );
}

// ─── 4. Storytelling Metrics ────────────────────────────────────────────
function StoryMetric({ label, primaryValue, impactReason, delta, isPositive }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</span>
      <div className="flex items-center gap-3 mb-1.5">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{primaryValue}</span>
        {delta && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 border ${isPositive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
            {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {delta}
          </span>
        )}
      </div>
      <span className="text-xs font-medium text-slate-500 leading-snug">
        {impactReason}
      </span>
    </div>
  );
}

// ─── 5. Autonomous Decision Feed (Mission Control) ──────────────────────
function MissionControl() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl flex flex-col h-full shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <BrainCircuit size={16} className="text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">Autonomous Decisions</h3>
        </div>
        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded flex items-center gap-1.5 tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> Live Stream
        </span>
      </div>
      
      <div className="p-5 space-y-7 flex-1 overflow-y-auto">
        
        {/* Decision Block 1 */}
        <div className="relative pl-5 border-l-2 border-indigo-100">
          <div className="absolute w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white -left-[6px] top-1" />
          <div className="text-[10px] font-mono text-slate-400 mb-2">10:42 AM • TRIAGE_AGENT</div>
          
          <div className="mb-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Decision Executed</span>
            <p className="text-sm font-semibold text-slate-900 leading-tight">Rerouted 3 incoming critical ambulances to Apex Medical.</p>
          </div>
          
          <div className="mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Reasoning Log</span>
            <p className="text-xs font-medium text-slate-600 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
              ICU occupancy hit 98% hard limit. Current staffing cannot safely accept new acute trauma.
            </p>
          </div>
          
          <div className="bg-emerald-50 border border-emerald-100 rounded-md p-2.5 flex items-start gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block mb-0.5">Outcome Value</span>
              <span className="text-xs text-emerald-700 font-medium leading-snug">Preserved final 2 ICU beds for internal crash events. Zero capacity breaches.</span>
            </div>
          </div>
        </div>

        {/* Decision Block 2 */}
        <div className="relative pl-5 border-l-2 border-slate-200">
          <div className="absolute w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white -left-[6px] top-1" />
          <div className="text-[10px] font-mono text-slate-400 mb-2">10:38 AM • RESOURCE_AGENT</div>
          
          <div className="mb-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Decision Executed</span>
            <p className="text-sm font-semibold text-slate-900 leading-tight">Auto-approved emergency PO for 500 Paracetamol units.</p>
          </div>
          
          <div className="mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Reasoning Log</span>
            <p className="text-xs font-medium text-slate-600 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
              Stock dropped below 48hr burn rate threshold. Supplier API confirmed immediate availability.
            </p>
          </div>
          
          <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 flex items-start gap-2.5">
            <CheckCircle2 size={16} className="text-slate-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest block mb-0.5">Outcome Value</span>
              <span className="text-xs text-slate-600 font-medium leading-snug">Prevented stockout delay. Delivery scheduled for 2:00 PM.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Main Dashboard Component ───────────────────────────────────────────
export default function HospitalAdminDashboard() {
  const navigate = useNavigate();
  const { data: statsData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats().then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const stats = statsData;
  const icuOccupied = stats?.beds?.icuOccupied ?? 0;
  const genOccupied = stats?.beds?.occupied ?? 0;
  const genTotal = (stats?.beds?.available ?? 0) + genOccupied;

  return (
    <Layout title="Operations Intelligence" subtitle="AI-driven hospital coordination">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1400px] mx-auto pb-10">
        
        {/* Row 1: Operations Context */}
        <OperationsContext stats={stats} />

        {/* Row 2: Supervisory Actions */}
        <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <SupervisoryAction icon={ShieldAlert} title="Review AI Approvals" description="3 edge-cases require human sign-off." colorClass="text-indigo-600" onClick={() => navigate('/agent-activity')} />
          <SupervisoryAction icon={Activity} title="Capacity Overrides" description="Adjust strict AI department thresholds." colorClass="text-rose-600" onClick={() => navigate('/beds')} />
          <SupervisoryAction icon={Box} title="System Diagnostics" description="View hardware & agent latency." colorClass="text-teal-600" onClick={() => navigate('/resources')} />
          <SupervisoryAction icon={AlertCircle} title="Global Broadcast" description="Halt AI routing for manual lockdown." colorClass="text-amber-600" onClick={() => navigate('/agent-activity')} />
        </div>

        {/* Row 3: Left (Capacity & Impact) | Right (Mission Control) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-widest mb-6">Department Context</h3>
            <div className="flex flex-col gap-2">
              <ContextualCapacity name="Intensive Care (ICU)" occupied={icuOccupied} total={5} aiContext="Halting non-critical inward transfers; prioritizing discharge reviews." />
              <ContextualCapacity name="Emergency Room" occupied={Math.round(genTotal * 0.6)} total={genTotal} aiContext="Routing minor trauma to local clinics. Wait time optimized." />
              <ContextualCapacity name="General Ward" occupied={genOccupied} total={genTotal} aiContext="Normal balancing operations." />
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
             <h3 className="font-bold text-slate-900 text-xs uppercase tracking-widest mb-6">AI Optimization (24h Impact)</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
               <StoryMetric 
                  label="Triage Efficiency" 
                  primaryValue="47 Patients" 
                  delta="18%" 
                  isPositive={true}
                  impactReason="Avg wait time reduced by 14 mins by preemptively ordering labs." 
               />
               <StoryMetric 
                  label="Resource Utilization" 
                  primaryValue="6 Stockouts Prevented" 
                  delta="100%" 
                  isPositive={true}
                  impactReason="Zero downtime across wards due to autonomous inventory ordering." 
               />
             </div>
          </div>

        </div>

        {/* Right Column: Mission Control */}
        <div className="col-span-12 lg:col-span-5 min-h-[600px]">
          <MissionControl />
        </div>

      </div>
    </Layout>
  );
}

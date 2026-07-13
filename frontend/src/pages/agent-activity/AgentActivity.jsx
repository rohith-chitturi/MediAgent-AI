import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BrainCircuit, CheckCircle, Clock, AlertTriangle, ArrowRight, UserPlus, Bed, Stethoscope, Bell, Search } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import EmptyState from '../../components/ui/EmptyState';
import { agentActivityApi } from '../../services/modules';
import { getSocket } from '../../services/socket';

const WORKFLOW_STEPS = [
  { id: 'intake', label: 'Patient Registered', icon: UserPlus },
  { id: 'TriageAgent', label: 'Triage Agent', icon: BrainCircuit },
  { id: 'BedAllocationAgent', label: 'Bed Assigned', icon: Bed },
  { id: 'DoctorAssignAgent', label: 'Doctor Assigned', icon: Stethoscope },
  { id: 'NotificationAgent', label: 'Notification Sent', icon: Bell }
];

function WorkflowNode({ step, action, isLast, isActive }) {
  const isCompleted = action?.status === 'COMPLETED';
  const isFailed = action?.status === 'FAILED';
  const Icon = step.icon;
  
  let nodeColor = 'border-slate-200 bg-white text-slate-400';
  if (isCompleted) nodeColor = 'border-blue-500 bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]';
  if (isFailed) nodeColor = 'border-rose-500 bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]';
  if (isActive && !isCompleted && !isFailed) nodeColor = 'border-amber-500 bg-amber-50 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse';
  
  // Intake is always completed if we have a run
  if (step.id === 'intake') nodeColor = 'border-emerald-500 bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]';

  return (
    <div className="flex flex-col items-center relative w-full mb-12">
      {/* Node */}
      <motion.div 
        layoutId={`node-${step.id}`}
        className={`w-14 h-14 rounded-full border-2 flex items-center justify-center relative z-10 transition-colors duration-500 ${nodeColor}`}
      >
        <Icon className="w-6 h-6" />
        {isCompleted && step.id !== 'intake' && (
          <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full text-white shadow-sm">
            <CheckCircle className="w-4 h-4" />
          </div>
        )}
      </motion.div>
      
      <span className={`mt-3 text-sm font-bold tracking-wide ${isCompleted || step.id === 'intake' ? 'text-slate-900' : 'text-slate-400'}`}>
        {step.label}
      </span>

      {/* Connection Line */}
      {!isLast && (
        <div className="absolute top-[3.5rem] w-0.5 h-12 bg-slate-200 -z-10" />
      )}

      {/* Decision Summary Card */}
      {action && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute left-1/2 ml-12 top-0 w-80 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-left hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Decision Summary</span>
            {action.confidenceLevel && (
               <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  action.confidenceLevel === 'HIGH' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                  action.confidenceLevel === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                  'bg-rose-50 text-rose-600 border border-rose-200'
               }`}>
                 {action.confidenceLevel} CONF
               </span>
            )}
          </div>
          <p className="text-sm text-slate-700 mb-3 leading-relaxed font-medium">
            {action.decisionSummary}
          </p>
          {action.recommendedAction && (
            <div className="flex gap-2 items-start bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <ArrowRight className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
              <span className="text-xs font-bold text-slate-600">{action.recommendedAction}</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function AgentActivity() {
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: runsData, refetch } = useQuery({
    queryKey: ['agent-runs'],
    queryFn: () => agentActivityApi.listRuns().then(r => r.data.data),
    refetchInterval: 15_000,
  });

  const runs = runsData?.data || [];
  const filteredRuns = runs.filter(run => run.displayRunId.toLowerCase().includes(searchTerm.toLowerCase()));

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    
    socket.on('agent:action', () => refetch());
    socket.on('agent:run_status', () => refetch());
    
    return () => {
      socket.off('agent:action');
      socket.off('agent:run_status');
    };
  }, [refetch]);

  useEffect(() => {
    if (!selectedRunId && runs.length > 0) {
      setSelectedRunId(runs[0].id);
    }
  }, [runs, selectedRunId]);

  const selectedRun = runs.find(r => r.id === selectedRunId);

  return (
    <Layout title="Mission Control" subtitle="Live autonomous workflow orchestration">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
        
        {/* Left Pane: Recent Runs */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-[var(--radius-lg)] overflow-hidden flex flex-col shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-900 tracking-wide flex items-center gap-2 text-sm uppercase">
              <Clock className="w-4 h-4 text-indigo-600" />
              Recent Workflows
            </h3>
            <div className="mt-3 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search workflows..." 
                className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 outline-none focus:border-indigo-500 transition-all font-mono"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
            {filteredRuns.length === 0 ? (
              <p className="text-center text-sm text-slate-400 mt-10 font-medium">No workflows found.</p>
            ) : (
              filteredRuns.map(run => (
                <button
                  key={run.id}
                  onClick={() => setSelectedRunId(run.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedRunId === run.id 
                      ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                      : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-mono text-xs font-bold ${selectedRunId === run.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                      {run.displayRunId}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${
                      run.workflowStatus === 'COMPLETED' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.3)]' : 
                      run.workflowStatus === 'FAILED' ? 'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.3)]' : 
                      'bg-amber-500 animate-pulse shadow-[0_0_5px_rgba(245,158,11,0.3)]'
                    }`} />
                  </div>
                  <div className={`text-[10px] uppercase tracking-wider font-bold ${selectedRunId === run.id ? 'text-indigo-400' : 'text-slate-400'}`}>
                    {new Date(run.startedAt).toLocaleTimeString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Pane: Workflow Visualization */}
        <div className="lg:col-span-9 bg-white border border-slate-200 rounded-[var(--radius-lg)] overflow-hidden flex flex-col relative shadow-sm">
          {/* Header */}
          {selectedRun && (
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold font-mono tracking-tight text-slate-900">{selectedRun.displayRunId}</h2>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-2 inline-block border ${
                  selectedRun.workflowStatus === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                  selectedRun.workflowStatus === 'FAILED' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                  'bg-amber-50 text-amber-600 border-amber-200'
                }`}>
                  STATUS: {selectedRun.workflowStatus}
                </span>
              </div>
              <div className="text-right text-sm font-bold text-slate-400">
                Duration: {selectedRun.durationMs ? `${(selectedRun.durationMs / 1000).toFixed(2)}s` : 'In progress...'}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50">
            {!selectedRun ? (
              <EmptyState 
                icon={BrainCircuit}
                title="Mission Control"
                description="Select an Agent Workflow from the sidebar to view its real-time orchestration trace."
              />
            ) : (
              <div className="max-w-2xl mx-auto flex flex-col items-center pt-8">
                {WORKFLOW_STEPS.map((step, idx) => {
                  const action = selectedRun.actions?.find(a => a.agentName === step.id);
                  const isLast = idx === WORKFLOW_STEPS.length - 1;
                  const prevAction = idx > 1 ? selectedRun.actions?.find(a => a.agentName === WORKFLOW_STEPS[idx-1].id) : null;
                  const isActive = !action && selectedRun.workflowStatus === 'RUNNING' && (idx === 1 || prevAction?.status === 'COMPLETED');

                  return (
                    <WorkflowNode 
                      key={step.id} 
                      step={step} 
                      action={action} 
                      isLast={isLast} 
                      isActive={isActive}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}

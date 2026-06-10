import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, CheckCircle, Clock, AlertTriangle, ArrowRight, UserPlus, Bed, Stethoscope, Bell } from 'lucide-react';
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
  
  let nodeColor = 'border-[var(--color-border-2)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)]';
  if (isCompleted) nodeColor = 'border-[var(--color-brand-500)] bg-[var(--color-brand-600)] text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]';
  if (isFailed) nodeColor = 'border-rose-500 bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]';
  if (isActive && !isCompleted && !isFailed) nodeColor = 'border-amber-500 bg-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse';
  
  // Intake is always completed if we have a run
  if (step.id === 'intake') nodeColor = 'border-emerald-500 bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]';

  return (
    <div className="flex flex-col items-center relative w-full mb-12">
      {/* Node */}
      <motion.div 
        layoutId={`node-${step.id}`}
        className={`w-14 h-14 rounded-full border-2 flex items-center justify-center relative z-10 transition-colors duration-500 ${nodeColor}`}
      >
        <Icon className="w-6 h-6" />
        {isCompleted && step.id !== 'intake' && (
          <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full text-white">
            <CheckCircle className="w-4 h-4" />
          </div>
        )}
      </motion.div>
      
      <span className={`mt-3 text-sm font-semibold tracking-wide ${isCompleted || step.id === 'intake' ? 'text-white' : 'text-[var(--color-text-muted)]'}`}>
        {step.label}
      </span>

      {/* Connection Line */}
      {!isLast && (
        <div className="absolute top-[3.5rem] w-0.5 h-12 bg-[var(--color-border-2)] -z-10" />
      )}

      {/* Decision Summary Card */}
      {action && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute left-1/2 ml-12 top-0 w-80 glass p-4 rounded-lg border border-[var(--color-border-2)] text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-400)]">Decision</span>
            {action.confidenceLevel && (
               <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  action.confidenceLevel === 'HIGH' ? 'bg-emerald-500/20 text-emerald-400' :
                  action.confidenceLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-rose-500/20 text-rose-400'
               }`}>
                 {action.confidenceLevel} CONFIDENCE
               </span>
            )}
          </div>
          <p className="text-sm text-[var(--color-text-primary)] mb-3 leading-relaxed">
            {action.decisionSummary}
          </p>
          {action.recommendedAction && (
            <div className="flex gap-2 items-start bg-[var(--color-surface-2)] p-2 rounded border border-[var(--color-border)]">
              <ArrowRight className="w-4 h-4 text-[var(--color-brand-400)] mt-0.5 shrink-0" />
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">{action.recommendedAction}</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function AgentActivity() {
  const [selectedRunId, setSelectedRunId] = useState(null);

  const { data: runsData, refetch } = useQuery({
    queryKey: ['agent-runs'],
    queryFn: () => agentActivityApi.listRuns().then(r => r.data.data),
    refetchInterval: 15_000,
  });

  const runs = runsData?.data || [];

  // WebSocket integration
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

  // Auto-select newest run if none selected
  useEffect(() => {
    if (!selectedRunId && runs.length > 0) {
      setSelectedRunId(runs[0].id);
    }
  }, [runs, selectedRunId]);

  const selectedRun = runs.find(r => r.id === selectedRunId);

  return (
    <Layout title="Mission Control" subtitle="Live AI workflow visualization">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
        
        {/* Left Pane: Recent Runs */}
        <div className="lg:col-span-3 glass rounded-[var(--radius-lg)] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[var(--color-border-2)] bg-[var(--color-surface-2)]/50">
            <h3 className="font-semibold text-white tracking-wide flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--color-brand-400)]" />
              Recent Workflows
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {runs.length === 0 ? (
              <p className="text-center text-sm text-[var(--color-text-muted)] mt-10">No workflows found.</p>
            ) : (
              runs.map(run => (
                <button
                  key={run.id}
                  onClick={() => setSelectedRunId(run.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedRunId === run.id 
                      ? 'bg-[var(--color-surface-2)] border-[var(--color-brand-500)] shadow-[0_0_10px_rgba(59,130,246,0.1)]' 
                      : 'bg-transparent border-transparent hover:bg-[var(--color-surface-3)] hover:border-[var(--color-border)]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-xs font-bold text-white">{run.displayRunId}</span>
                    <span className={`w-2 h-2 rounded-full ${
                      run.workflowStatus === 'COMPLETED' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 
                      run.workflowStatus === 'FAILED' ? 'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]' : 
                      'bg-amber-500 animate-pulse shadow-[0_0_5px_rgba(245,158,11,0.5)]'
                    }`} />
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
                    {new Date(run.startedAt).toLocaleTimeString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Pane: Workflow Visualization */}
        <div className="lg:col-span-9 glass rounded-[var(--radius-lg)] overflow-hidden flex flex-col relative">
          {/* Header */}
          {selectedRun && (
            <div className="px-6 py-5 border-b border-[var(--color-border-2)] bg-[var(--color-surface-2)] flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold font-mono tracking-tight text-white">{selectedRun.displayRunId}</h2>
                <span className={`text-xs font-bold px-2 py-0.5 rounded mt-1 inline-block ${
                  selectedRun.workflowStatus === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                  selectedRun.workflowStatus === 'FAILED' ? 'bg-rose-500/20 text-rose-400' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  STATUS: {selectedRun.workflowStatus}
                </span>
              </div>
              <div className="text-right text-sm text-[var(--color-text-muted)]">
                Duration: {selectedRun.durationMs ? `${(selectedRun.durationMs / 1000).toFixed(2)}s` : 'In progress...'}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-12 bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-bg)]">
            {!selectedRun ? (
              <EmptyState 
                icon={BrainCircuit}
                title="Mission Control"
                description="Select an Agent Workflow from the sidebar to view its real-time execution trace."
              />
            ) : (
              <div className="max-w-2xl mx-auto flex flex-col items-center pt-8">
                {WORKFLOW_STEPS.map((step, idx) => {
                  const action = selectedRun.actions?.find(a => a.agentName === step.id);
                  const isLast = idx === WORKFLOW_STEPS.length - 1;
                  // If we don't have an action, but the run is still RUNNING and the previous step completed, this is the ACTIVE step.
                  // For demo purposes, we will highlight it if it's the next logical step.
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

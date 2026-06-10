import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, UserPlus, Clock, Bed, Search, CalendarPlus, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../../components/layout/Layout';
import WelcomeHeader from '../../components/ui/WelcomeHeader';
import EmptyState from '../../components/ui/EmptyState';
import { patientsApi, dashboardApi } from '../../services/modules';

function ActionButton({ icon: Icon, label, color, onClick }) {
  return (
    <motion.button 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative overflow-hidden p-6 rounded-[var(--radius-lg)] border bg-[var(--color-surface-2)] flex flex-col items-center justify-center gap-3 transition-colors hover:bg-[var(--color-surface-3)] ${color.border} group`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/3 pointer-events-none transition-colors duration-500 ${color.bg}`} />
      <div className={`p-4 rounded-full ${color.iconBg} ${color.text} group-hover:scale-110 transition-transform`}>
        <Icon className="w-8 h-8" />
      </div>
      <span className="font-bold tracking-wide text-white">{label}</span>
    </motion.button>
  );
}

export default function ReceptionDashboard() {
  const navigate = useNavigate();

  const { data: statsData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats().then(r => r.data.data),
    refetchInterval: 15_000,
  });

  const { data: patientsData } = useQuery({
    queryKey: ['waiting-patients'],
    queryFn: () => patientsApi.list({ status: 'WAITING', limit: 50 }).then(r => r.data),
    refetchInterval: 15_000,
  });

  const waitingPatients = patientsData?.data || [];
  const waitingCount = waitingPatients.length;

  const triggerSearch = () => {
    // Trigger the global command palette search
    window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: 'k' }));
  };

  return (
    <Layout title="Front Desk" subtitle="Speed actions and patient intake queue">
      <WelcomeHeader 
        subtitle={`There are currently ${waitingCount} patients waiting to be triaged or admitted.`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Speed Action Pad (50%) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="glass p-6 rounded-[var(--radius-lg)]">
            <h3 className="font-semibold text-white tracking-wide mb-6 uppercase text-sm">Speed Action Pad</h3>
            <div className="grid grid-cols-2 gap-4">
              <ActionButton 
                icon={UserPlus} 
                label="Register Patient" 
                color={{ border: 'border-blue-500/30', bg: 'bg-blue-500', iconBg: 'bg-blue-500/20', text: 'text-blue-400' }} 
                onClick={() => navigate('/patients')}
              />
              <ActionButton 
                icon={Search} 
                label="Search Patient" 
                color={{ border: 'border-emerald-500/30', bg: 'bg-emerald-500', iconBg: 'bg-emerald-500/20', text: 'text-emerald-400' }} 
                onClick={triggerSearch}
              />
              <ActionButton 
                icon={Bed} 
                label="Check ICU Beds" 
                color={{ border: 'border-rose-500/30', bg: 'bg-rose-500', iconBg: 'bg-rose-500/20', text: 'text-rose-400' }} 
                onClick={() => navigate('/beds?status=AVAILABLE')}
              />
              <ActionButton 
                icon={Activity} 
                label="Agent Activity" 
                color={{ border: 'border-purple-500/30', bg: 'bg-purple-500', iconBg: 'bg-purple-500/20', text: 'text-purple-400' }} 
                onClick={() => navigate('/agent-activity')}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Waitlist (50%) */}
        <div className="lg:col-span-6 flex flex-col h-full">
          <div className="glass p-6 rounded-[var(--radius-lg)] flex-1 flex flex-col max-h-[600px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[var(--color-brand-400)]" />
                <h3 className="font-semibold text-white tracking-wide">Waiting Patients</h3>
              </div>
              <span className="text-xs font-bold bg-[var(--color-surface-3)] text-white px-2 py-1 rounded">
                {waitingCount} IN QUEUE
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
              {waitingPatients.length === 0 ? (
                <EmptyState 
                  icon={Users}
                  title="Queue is Empty"
                  description="There are no patients currently waiting. The reception is clear."
                />
              ) : (
                waitingPatients.map(p => {
                  const waitMinutes = Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 60000);
                  const isLongWait = waitMinutes > 30;
                  const isCrit = p.priority === 'CRITICAL';
                  
                  return (
                    <motion.div 
                      key={p.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center justify-between p-4 rounded-lg bg-[var(--color-surface-2)] border transition-colors ${
                        isCrit ? 'border-rose-500/50 bg-rose-500/10' : 
                        isLongWait ? 'border-amber-500/50 bg-amber-500/10' : 
                        'border-[var(--color-border-2)]'
                      }`}
                    >
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          {p.name}
                          {isCrit && <span className="flex w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                        </h4>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-1 max-w-xs">{p.symptoms}</p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          isCrit ? 'bg-rose-500/20 text-rose-400' :
                          p.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-[var(--color-surface-3)] text-[var(--color-text-muted)]'
                        }`}>
                          {p.priority || 'PENDING'}
                        </span>
                        <span className={`text-xs font-mono font-medium ${isLongWait ? 'text-amber-400' : 'text-[var(--color-text-secondary)]'}`}>
                          {waitMinutes} min ago
                        </span>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}

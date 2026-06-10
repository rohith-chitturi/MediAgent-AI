import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, UserCheck, AlertTriangle, CheckCircle, Activity, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from '../../components/layout/Layout';
import WelcomeHeader from '../../components/ui/WelcomeHeader';
import EmptyState from '../../components/ui/EmptyState';
import useAuthStore from '../../store/authStore';
import { patientsApi } from '../../services/modules';

function PatientRiskCard({ patient }) {
  const isCritical = patient.priority === 'CRITICAL';
  const isHigh = patient.priority === 'HIGH';

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className={`relative overflow-hidden p-5 rounded-[var(--radius-lg)] border bg-[var(--color-surface-2)] transition-shadow ${
        isCritical ? 'border-rose-500/50 shadow-[0_4px_20px_rgba(244,63,94,0.15)]' : 
        isHigh ? 'border-amber-500/30' : 
        'border-[var(--color-border-2)] hover:border-[var(--color-brand-500)]'
      }`}
    >
      {isCritical && <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]" />}
      
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-white tracking-wide">{patient.name}</h4>
          <p className="text-xs text-[var(--color-text-muted)]">{patient.age}y / {patient.gender}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
            isCritical ? 'bg-rose-500/20 text-rose-400' :
            isHigh ? 'bg-amber-500/20 text-amber-400' :
            'bg-emerald-500/20 text-emerald-400'
          }`}>
            {patient.priority || 'PENDING'}
          </span>
          <span className="text-[10px] bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] px-2 py-0.5 rounded">
            BED: {patient.bedAssignment?.bed?.number || 'WAITING'}
          </span>
        </div>
      </div>
      
      <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4 h-10">
        {patient.symptoms}
      </p>

      <div className="flex gap-2">
        <button className={`flex-1 text-xs py-1.5 rounded font-medium transition-colors ${
          isCritical ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white'
        }`}>
          View Chart
        </button>
      </div>
    </motion.div>
  );
}

function WorkloadGauge({ current, max }) {
  const percentage = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  
  // Create a curved SVG gauge
  const radius = 60;
  const circumference = Math.PI * radius; // Half circle
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  let colorClass = "text-emerald-500";
  if (percentage >= 80) colorClass = "text-rose-500";
  else if (percentage >= 60) colorClass = "text-amber-500";

  return (
    <div className="glass p-6 rounded-[var(--radius-lg)] flex flex-col items-center relative overflow-hidden">
      <div className="flex items-center gap-2 mb-4 self-start">
        <Activity className="w-5 h-5 text-[var(--color-brand-400)]" />
        <h3 className="font-semibold text-white tracking-wide">Current Capacity</h3>
      </div>
      
      <div className="relative w-40 h-24 flex items-end justify-center mt-4">
        {/* Background Arc */}
        <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 140 70">
          <path d="M 10 70 A 60 60 0 0 1 130 70" fill="none" stroke="var(--color-surface-3)" strokeWidth="12" strokeLinecap="round" />
        </svg>
        {/* Foreground Arc */}
        <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 140 70">
          <path 
            d="M 10 70 A 60 60 0 0 1 130 70" 
            fill="none" 
            className={`${colorClass} transition-all duration-1000 ease-out`}
            stroke="currentColor" 
            strokeWidth="12" 
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        
        <div className="text-center pb-2">
          <span className="text-3xl font-black text-white">{percentage}%</span>
        </div>
      </div>
      <div className="text-xs font-medium text-[var(--color-text-muted)] mt-2 uppercase tracking-wider">
        {current} / {max} Patients Assigned
      </div>
    </div>
  );
}

export default function DoctorDashboard() {
  const { user } = useAuthStore();
  
  // Fetch all patients for now, filter by doctor ID locally if the backend doesn't support it directly.
  // In a real app, the API would filter this via `?doctorId=${user.doctorId}`
  const { data: patientsData } = useQuery({
    queryKey: ['my-patients'],
    queryFn: () => patientsApi.list({ limit: 100 }).then(r => r.data),
  });

  const allPatients = patientsData?.data || [];
  // Fallback to all admitted patients for demo if user.doctorId is missing
  const myPatients = allPatients.filter(p => p.doctorId === user?.doctorId || (!user?.doctorId && p.status === 'ADMITTED'));
  
  const criticalCount = myPatients.filter(p => p.priority === 'CRITICAL').length;
  const maxLoad = 10; // Demo max load
  const currentLoad = myPatients.length;

  return (
    <Layout title="Clinical Dashboard" subtitle="Patient management & clinical overview">
      <WelcomeHeader 
        subtitle={`You have ${currentLoad} patients assigned today. ${criticalCount > 0 ? `${criticalCount} require immediate attention.` : 'No critical alerts.'}`} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Stats & Gauge (30%) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <WorkloadGauge current={currentLoad} max={maxLoad} />

          <div className="grid grid-cols-2 gap-4">
             <div className="glass p-5 rounded-[var(--radius-lg)] flex flex-col justify-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Today's Appts</span>
                <span className="text-3xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-emerald-500" /> 5
                </span>
             </div>
             <div className="glass p-5 rounded-[var(--radius-lg)] flex flex-col justify-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Pending Triage</span>
                <span className="text-3xl font-bold text-white flex items-center gap-2">
                  <ClipboardList className="w-6 h-6 text-amber-500" /> 2
                </span>
             </div>
          </div>
        </div>

        {/* Right Column: My Patients Grid (70%) */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="glass p-6 rounded-[var(--radius-lg)] flex-1">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-[var(--color-brand-400)]" />
                <h3 className="font-semibold text-white tracking-wide">My Active Patients</h3>
              </div>
            </div>

            {myPatients.length === 0 ? (
              <EmptyState 
                icon={CheckCircle}
                title="No Active Patients"
                description="You currently have no patients assigned to your care. Enjoy your break!"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[500px] pr-2">
                {myPatients.map(p => (
                  <PatientRiskCard key={p.id} patient={p} />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}

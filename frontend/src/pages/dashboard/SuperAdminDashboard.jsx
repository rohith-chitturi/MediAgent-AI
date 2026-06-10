import { Hospital, Users, Activity, BrainCircuit, Server, ShieldCheck, Database } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import WelcomeHeader from '../../components/ui/WelcomeHeader';

function MetricCard({ title, value, icon: Icon, color, trend }) {
  return (
    <div className={`glass p-6 rounded-[var(--radius-lg)] border-t-2 ${color.borderTop}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color.bg} ${color.text}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">{title}</p>
        <h3 className="text-3xl font-black text-white">{value}</h3>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  return (
    <Layout title="Platform Global Dashboard" subtitle="Super Admin command center">
      <WelcomeHeader 
        subtitle="Platform health is optimal. All 24 hospitals are online and processing patient workflows."
        customGreeting="Good Morning, Super Admin"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Total Hospitals" 
          value="24" 
          icon={Hospital} 
          color={{ bg: 'bg-blue-500/20', text: 'text-blue-400', borderTop: 'border-blue-500' }}
          trend={12}
        />
        <MetricCard 
          title="Active Users" 
          value="1,402" 
          icon={Users} 
          color={{ bg: 'bg-indigo-500/20', text: 'text-indigo-400', borderTop: 'border-indigo-500' }}
          trend={5}
        />
        <MetricCard 
          title="AI Workflows (24h)" 
          value="84,209" 
          icon={BrainCircuit} 
          color={{ bg: 'bg-purple-500/20', text: 'text-purple-400', borderTop: 'border-purple-500' }}
          trend={22}
        />
        <MetricCard 
          title="Platform Uptime" 
          value="99.99%" 
          icon={Activity} 
          color={{ bg: 'bg-emerald-500/20', text: 'text-emerald-400', borderTop: 'border-emerald-500' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="glass p-6 rounded-[var(--radius-lg)]">
          <div className="flex items-center gap-3 mb-6">
            <Server className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-white tracking-wide">Infrastructure Status</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <span className="text-sm font-medium text-white">PostgreSQL Primary DB</span>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">HEALTHY (12ms)</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <BrainCircuit className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <span className="text-sm font-medium text-white">FastAPI AI Engine</span>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">HEALTHY (45ms)</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <span className="text-sm font-medium text-white">Vapi Voice Gateway</span>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">HEALTHY</span>
            </div>
          </div>
        </div>

        {/* Global Security Log */}
        <div className="glass p-6 rounded-[var(--radius-lg)]">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-white tracking-wide">Recent Audit Logs</h3>
          </div>
          
          <div className="space-y-3">
            {[
              { action: "New hospital tenant provisioned", user: "system", time: "2 mins ago" },
              { action: "Role permissions updated for DOCTOR", user: "admin@mediagent.ai", time: "1 hour ago" },
              { action: "Failed login attempt (IP: 192.168.1.5)", user: "unknown", time: "3 hours ago" },
              { action: "API Key rotated for Vapi Integration", user: "system", time: "1 day ago" },
            ].map((log, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-[var(--color-border-2)] last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{log.action}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">by {log.user}</p>
                </div>
                <span className="text-[10px] uppercase text-[var(--color-text-muted)] font-mono">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

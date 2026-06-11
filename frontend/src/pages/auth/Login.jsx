import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Network, ArrowRight, ShieldCheck, Hospital, Stethoscope, UserPlus, 
  BrainCircuit, Bed, Activity, Bell, Shield, Workflow, Lock
} from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';

// ─── Neural Engine Visualization ─────────────────────────────────────────
function NeuralEngine() {
  const nodes = [
    { id: 1, label: 'Intake Registration', icon: UserPlus, status: 'Active', pulse: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]', color: 'text-blue-400' },
    { id: 2, label: 'Autonomous Triage', icon: BrainCircuit, status: 'Processing', pulse: 'shadow-[0_0_30px_rgba(168,85,247,0.5)]', color: 'text-purple-400' },
    { id: 3, label: 'Bed Allocation', icon: Bed, status: 'Pending', pulse: '', color: 'text-emerald-400' },
    { id: 4, label: 'Doctor Routing', icon: Stethoscope, status: 'Pending', pulse: '', color: 'text-amber-400' },
  ];

  return (
    <div className="relative w-full max-w-lg mx-auto h-[700px] flex flex-col justify-center gap-12 z-20">
      
      {/* Background Grid Matrix */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA0MCAwIEwgMCAwIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] z-0 opacity-50" />

      {/* Main Connection Pipeline */}
      <div className="absolute left-[39px] top-12 bottom-24 w-0.5 bg-gradient-to-b from-white/10 via-white/5 to-transparent z-0" />

      {/* Flowing Packets */}
      <motion.div 
        animate={{ y: [0, 500] }} 
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute left-[38px] top-12 w-1 h-8 bg-purple-500 shadow-[0_0_20px_#a855f7] rounded-full z-10"
      />
      <motion.div 
        animate={{ y: [0, 500] }} 
        transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1.5 }}
        className="absolute left-[38px] top-12 w-1 h-8 bg-emerald-500 shadow-[0_0_20px_#10b981] rounded-full z-10"
      />

      {/* Nodes */}
      {nodes.map((node, i) => (
        <div key={node.id} className="relative z-20 flex items-center gap-8 group">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className={`w-20 h-20 rounded-2xl bg-[#111111] border border-white/10 flex items-center justify-center relative overflow-hidden backdrop-blur-xl ${node.pulse}`}
          >
            {/* Inner Glow */}
            <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent`} />
            <node.icon className={`w-8 h-8 ${node.color} relative z-10`} strokeWidth={1.5} />
            
            {/* Processing Pulse for Node 2 */}
            {i === 1 && (
              <span className="absolute inline-flex h-full w-full rounded-2xl bg-purple-500/20 opacity-75 animate-ping" />
            )}
          </motion.div>
          
          <div className="flex flex-col">
            <h3 className="text-lg font-medium text-white/90 tracking-wide">{node.label}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${i === 1 ? 'bg-purple-500 animate-pulse' : i === 0 ? 'bg-emerald-500' : 'bg-white/20'}`} />
              <span className="text-xs font-bold uppercase tracking-widest text-white/40">{node.status}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Workspace Portals ───────────────────────────────────────────────────
function WorkspacePortal({ title, subtitle, icon: Icon, email, pass, onSelect }) {
  return (
    <div 
      onClick={() => onSelect(email, pass)}
      className="group relative bg-[#111] border border-white/10 hover:border-indigo-500/50 rounded-2xl p-5 cursor-pointer overflow-hidden transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-indigo-500/0 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10 flex items-center gap-5">
        <div className="bg-[#1a1a1a] p-3 rounded-xl border border-white/5 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 transition-all duration-300">
          <Icon className="w-6 h-6 text-white/50 group-hover:text-indigo-400 transition-colors" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">{title}</h4>
          <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider mt-1">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Login Page ─────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Unauthorized access.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSelect = (e, p) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] font-sans selection:bg-indigo-500/30 text-white">
      
      {/* Left Pane - Story & Workspaces */}
      <div className="w-full lg:w-5/12 flex flex-col px-8 sm:px-16 lg:px-20 relative z-20 overflow-y-auto py-12 border-r border-white/5 bg-[#0a0a0a]">
        
        {/* Brand */}
        <div className="flex items-center gap-3 mb-16">
          <Network className="w-6 h-6 text-indigo-500" strokeWidth={2} />
          <span className="text-sm font-bold tracking-[0.2em] uppercase text-white/90">MediAgent AI</span>
        </div>

        {/* Hero Narrative */}
        <div className="mb-14">
          <h1 className="text-[2.75rem] leading-[1.1] font-medium tracking-tight text-white/95 mb-6">
            The AI Workforce Behind Modern Hospitals.
          </h1>
          <div className="grid gap-3">
            <div className="flex items-center gap-3 text-sm font-medium text-white/60">
              <Workflow className="w-4 h-4 text-indigo-400" /> Multi-Agent Workflow Engine
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-white/60">
              <Activity className="w-4 h-4 text-emerald-400" /> Real-Time Decision Intelligence
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-white/60">
              <Network className="w-4 h-4 text-purple-400" /> Autonomous Hospital Coordination
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-white/60">
              <Shield className="w-4 h-4 text-slate-400" /> Enterprise Security & RBAC
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-white/5 mb-12" />

        {/* Workspace Portals */}
        <div className="mb-16">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-6">Select Your Workspace</h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <WorkspacePortal 
              title="Platform Administration" subtitle="Super Admin Access" icon={ShieldCheck} 
              email="admin@mediagent.ai" pass="SuperAdmin123!" onSelect={handleDemoSelect} 
            />
            <WorkspacePortal 
              title="Hospital Command Center" subtitle="Hospital Admin Access" icon={Hospital} 
              email="hadmin@apollo.com" pass="HAdmin123!" onSelect={handleDemoSelect} 
            />
            <WorkspacePortal 
              title="Clinical Dashboard" subtitle="Physician Access" icon={Stethoscope} 
              email="dr.smith@apollo.com" pass="Doctor123!" onSelect={handleDemoSelect} 
            />
            <WorkspacePortal 
              title="Intake & Reception" subtitle="Front Desk Access" icon={UserPlus} 
              email="frontdesk@apollo.com" pass="Reception123!" onSelect={handleDemoSelect} 
            />
          </div>
        </div>

        {/* Minimized Standard Login */}
        <div className="mt-auto">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-6 flex items-center gap-2">
            <Lock className="w-3 h-3" /> Standard Authentication
          </h3>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                required
                className="flex-1 bg-[#111] border border-white/10 text-white/90 text-sm rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 block p-4 transition-all outline-none"
                placeholder="Enterprise Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                required
                className="flex-1 bg-[#111] border border-white/10 text-white/90 text-sm rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 block p-4 transition-all outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white bg-white/10 hover:bg-white/15 border border-white/5 font-medium rounded-xl text-sm px-6 py-4 text-center flex items-center justify-center gap-3 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Authenticating Sequence...' : 'Authenticate'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

      </div>

      {/* Right Pane - The Neural Engine (58% on lg) */}
      <div className="hidden lg:flex w-7/12 bg-[#050505] relative overflow-hidden flex-col items-center justify-center">
        
        {/* Soft atmospheric glows */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <NeuralEngine />

        {/* Live Platform Intelligence Metrics */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="absolute bottom-12 w-full max-w-xl bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] z-30"
        >
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live Platform Intelligence
            </span>
            <span className="text-[10px] font-mono text-indigo-400">SYS_UPTIME: 99.99%</span>
          </div>
          
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-3xl font-light text-white tracking-tight">284</p>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mt-2 font-medium">Workflows<br/>Executed</p>
            </div>
            <div>
              <p className="text-3xl font-light text-white tracking-tight">47</p>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mt-2 font-medium">Patients<br/>Triaged</p>
            </div>
            <div>
              <p className="text-3xl font-light text-white tracking-tight">31</p>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mt-2 font-medium">Auto<br/>Allocations</p>
            </div>
            <div>
              <p className="text-3xl font-light text-emerald-400 tracking-tight">99%</p>
              <p className="text-[10px] uppercase tracking-widest text-emerald-400/50 mt-2 font-medium">Confidence<br/>Score</p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

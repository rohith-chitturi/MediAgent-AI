import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Hospital, Activity, Database, CheckCircle, Network, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';

function AnimatedWorkflow() {
  return (
    <div className="relative w-full max-w-lg mx-auto h-[400px] flex items-center justify-center">
      {/* Background connecting lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.3))' }}>
        <path d="M 100 200 C 200 200, 200 100, 300 100" fill="none" stroke="rgba(59,130,246,0.4)" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_20s_linear_infinite]" />
        <path d="M 100 200 C 200 200, 200 300, 300 300" fill="none" stroke="rgba(16,185,129,0.4)" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_20s_linear_infinite]" />
        <path d="M 300 100 C 400 100, 400 200, 500 200" fill="none" stroke="rgba(59,130,246,0.4)" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_20s_linear_infinite]" />
        <path d="M 300 300 C 400 300, 400 200, 500 200" fill="none" stroke="rgba(16,185,129,0.4)" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_20s_linear_infinite]" />
      </svg>

      {/* Nodes */}
      <motion.div 
        animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[50px] top-[170px] w-16 h-16 rounded-2xl bg-[#1e293b] border border-blue-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.2)] z-10"
      >
        <Database className="w-8 h-8 text-blue-400" />
      </motion.div>

      <motion.div 
        animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[268px] top-[68px] w-16 h-16 rounded-2xl bg-[#1e293b] border border-emerald-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)] z-10"
      >
        <Activity className="w-8 h-8 text-emerald-400" />
      </motion.div>

      <motion.div 
        animate={{ y: [0, -15, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[268px] top-[268px] w-16 h-16 rounded-2xl bg-[#1e293b] border border-purple-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.2)] z-10"
      >
        <BrainCircuit className="w-8 h-8 text-purple-400" />
      </motion.div>

      <motion.div 
        animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[50px] top-[170px] w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 border border-white/10 flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.4)] z-10"
      >
        <CheckCircle className="w-8 h-8 text-white" />
      </motion.div>

      {/* Floating data packets */}
      <motion.div 
        animate={{ x: [100, 268], y: [200, 100], opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="absolute w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa] z-20"
      />
      <motion.div 
        animate={{ x: [100, 268], y: [200, 300], opacity: [0, 1, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 1 }}
        className="absolute w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] z-20"
      />
      <motion.div 
        animate={{ x: [268, 480], y: [100, 200], opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }}
        className="absolute w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa] z-20"
      />
    </div>
  );
}

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
      setError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (role) => {
    const demos = {
      SUPER_ADMIN: { e: 'admin@mediagent.ai', p: 'SuperAdmin123!' },
      HOSPITAL_ADMIN: { e: 'hadmin@apollo.com', p: 'HAdmin123!' },
      DOCTOR: { e: 'dr.smith@apollo.com', p: 'Doctor123!' },
      RECEPTIONIST: { e: 'frontdesk@apollo.com', p: 'Reception123!' },
    };
    setEmail(demos[role].e);
    setPassword(demos[role].p);
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-workspace-bg)]">
      
      {/* Left Pane - Login Form (40%) */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-white relative z-10 shadow-2xl">
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-500 p-2 rounded-xl shadow-lg">
              <Hospital className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">MediAgent AI</span>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Autonomous Operations</h1>
          <p className="text-slate-500 text-sm mb-8">AI agents continuously coordinate patient triage, bed allocation, doctor assignment and hospital workflows.</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Work Email</label>
              <input
                type="email"
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 block p-3 transition-all outline-none"
                placeholder="name@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 block p-3 transition-all outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-lg">
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-3.5 text-center flex items-center justify-center gap-2 transition-all disabled:opacity-70 group"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
              {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-10">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Demo Accounts</p>
            <div className="flex flex-wrap gap-2">
              {['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST'].map(role => (
                <button
                  key={role}
                  onClick={() => fillDemo(role)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-1.5 px-3 rounded-full transition-colors"
                >
                  {role.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane - Visual Storytelling (60%) */}
      <div className="hidden lg:flex w-[60%] bg-[#0f172a] relative overflow-hidden items-center justify-center flex-col">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-[#0f172a] to-teal-900/20 z-0" />
        
        <div className="relative z-10 w-full flex flex-col items-center">
          <AnimatedWorkflow />
          
          <div className="text-center mt-12 max-w-md">
            <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Intelligent Orchestration</h2>
            <p className="text-slate-400 leading-relaxed">
              MediAgent AI acts as the autonomous central nervous system for your hospital, coordinating patients, doctors, and resources in real time.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

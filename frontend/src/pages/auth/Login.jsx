import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BrainCircuit, Hospital, Activity, Database, CheckCircle, 
  Network, ArrowRight, ShieldCheck, UserPlus, Bed, Stethoscope, 
  Bell, FileCheck, Layers, Cpu, Shield, Clock, Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';

function UltimateAnimatedWorkflow() {
  const nodes = [
    { id: 1, label: 'Patient Registered', icon: UserPlus, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', shadow: 'shadow-[0_0_30px_rgba(59,130,246,0.2)]' },
    { id: 2, label: 'AI Triage', icon: BrainCircuit, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', shadow: 'shadow-[0_0_30px_rgba(168,85,247,0.2)]' },
    { id: 3, label: 'Bed Allocation', icon: Bed, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', shadow: 'shadow-[0_0_30px_rgba(16,185,129,0.2)]' },
    { id: 4, label: 'Doctor Assignment', icon: Stethoscope, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', shadow: 'shadow-[0_0_30px_rgba(245,158,11,0.2)]' },
    { id: 5, label: 'Resource Validation', icon: Activity, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', shadow: 'shadow-[0_0_30px_rgba(99,102,241,0.2)]' },
    { id: 6, label: 'Notification', icon: Bell, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', shadow: 'shadow-[0_0_30px_rgba(100,116,139,0.2)]' },
  ];

  return (
    <div className="relative w-full max-w-sm mx-auto h-[550px] flex items-center justify-center pb-24">
      {/* Central Line */}
      <div className="absolute top-8 bottom-32 left-[31px] w-0.5 bg-gradient-to-b from-blue-500/20 via-emerald-500/20 to-slate-500/0 z-0" />

      {/* Animated Packets */}
      <motion.div 
        animate={{ y: [0, 400] }} 
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute left-[29px] top-8 w-1.5 h-6 rounded-full bg-blue-400 shadow-[0_0_15px_#60a5fa] z-10"
      />
      <motion.div 
        animate={{ y: [0, 400] }} 
        transition={{ duration: 3.5, repeat: Infinity, ease: "linear", delay: 1.5 }}
        className="absolute left-[29px] top-8 w-1.5 h-6 rounded-full bg-emerald-400 shadow-[0_0_15px_#34d399] z-10"
      />
      <motion.div 
        animate={{ y: [0, 400] }} 
        transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 2.5 }}
        className="absolute left-[29px] top-8 w-1.5 h-6 rounded-full bg-purple-400 shadow-[0_0_15px_#a855f7] z-10"
      />

      {/* Nodes */}
      <div className="flex flex-col gap-8 w-full relative z-20">
        {nodes.map((node, i) => (
          <div key={node.id} className="flex items-center gap-6">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className={`w-16 h-16 rounded-2xl bg-[#0f172a] ${node.border} ${node.shadow} flex items-center justify-center relative overflow-hidden group shrink-0`}
            >
              <div className={`absolute inset-0 ${node.bg} opacity-50 group-hover:opacity-100 transition-opacity`} />
              <node.icon className={`w-7 h-7 ${node.color} relative z-10`} strokeWidth={1.5} />
            </motion.div>
            <div>
              <p className="text-sm font-bold text-slate-200 tracking-wide">{node.label}</p>
              <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mt-1">
                {i === 0 ? 'Human' : 'Autonomous Agent'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TechBadge({ children }) {
  return (
    <div className="px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
      {children}
    </div>
  );
}

function RoleCard({ role, email, pass, icon: Icon, onSelect }) {
  return (
    <div 
      onClick={() => onSelect(email, pass)}
      className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="bg-slate-50 p-2.5 rounded-lg text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-colors shrink-0">
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 transition-colors truncate">
          {role}
        </p>
        <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">Click to auto-fill</p>
      </div>
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

  const handleDemoSelect = (e, p) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      
      {/* Left Pane - Narrative & Form (50% on lg) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-white relative z-10 shadow-2xl py-12 overflow-y-auto">
        <div className="max-w-xl w-full mx-auto my-auto">
          
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-600 p-2.5 rounded-xl">
              <Network className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold tracking-widest uppercase text-slate-900">MediAgent AI</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
            Autonomous Hospital Operations.<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-teal-500 leading-normal block pb-2">
              Powered by AI Agents.
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg font-medium text-slate-500 leading-relaxed mb-8 max-w-lg">
            Multi-agent intelligence coordinating patient triage, doctor assignment, bed allocation, and resource monitoring in real time.
          </p>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-2 mb-10">
            <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" /> Multi-Agent Architecture
            </div>
            <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" /> Real-Time Operations
            </div>
            <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" /> Secure RBAC Access
            </div>
            <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" /> Scalable SaaS Platform
            </div>
          </div>

          {/* Built With */}
          <div className="mb-14">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Built With</p>
            <div className="flex flex-wrap gap-2">
              <TechBadge>LangGraph</TechBadge>
              <TechBadge>Gemini AI</TechBadge>
              <TechBadge>FastAPI</TechBadge>
              <TechBadge>PostgreSQL</TechBadge>
              <TechBadge>React</TechBadge>
            </div>
          </div>

          <div className="w-full h-px bg-slate-200 mb-12" />

          {/* Sign In Section */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Sign in to Command Center</h3>
            
            <form onSubmit={handleLogin} className="space-y-5 max-w-sm mb-10">
              <input
                type="email"
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-base font-medium rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 block px-4 py-3.5 transition-all outline-none"
                placeholder="name@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-base font-medium rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 block px-4 py-3.5 transition-all outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium rounded-xl">
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full text-white bg-slate-900 hover:bg-slate-800 focus:ring-4 focus:ring-slate-300 font-bold rounded-xl text-base px-6 py-4 text-center flex items-center justify-center gap-3 transition-all disabled:opacity-70 group shadow-lg shadow-slate-900/20"
              >
                {isLoading ? 'Authenticating...' : 'Sign In'}
                {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            {/* Demo Accounts */}
            <div className="pb-8">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Access Demo Accounts</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                <RoleCard 
                  role="Super Admin" icon={ShieldCheck} 
                  email="admin@mediagent.ai" pass="SuperAdmin123!" 
                  onSelect={handleDemoSelect} 
                />
                <RoleCard 
                  role="Hospital Admin" icon={Hospital} 
                  email="hadmin@apollo.com" pass="HAdmin123!" 
                  onSelect={handleDemoSelect} 
                />
                <RoleCard 
                  role="Doctor" icon={Stethoscope} 
                  email="dr.smith@apollo.com" pass="Doctor123!" 
                  onSelect={handleDemoSelect} 
                />
                <RoleCard 
                  role="Receptionist" icon={UserPlus} 
                  email="frontdesk@apollo.com" pass="Reception123!" 
                  onSelect={handleDemoSelect} 
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Right Pane - Visual Engine (50% on lg) */}
      <div className="hidden lg:flex w-1/2 bg-[#080c14] relative overflow-hidden items-center justify-center flex-col py-12">
        {/* Deep background mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#080c14] to-[#080c14] z-0" />
        
        <div className="relative z-10 w-full flex flex-col items-center justify-center h-full">
          <UltimateAnimatedWorkflow />
          
          {/* Today's AI Impact Overlay */}
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="absolute bottom-8 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl z-50"
          >
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 text-center">Today's AI Impact</h3>
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div className="text-center">
                <p className="text-3xl font-black text-white">284</p>
                <p className="text-xs uppercase font-bold tracking-wider text-slate-500 mt-1">Workflows Executed</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-indigo-400">47</p>
                <p className="text-xs uppercase font-bold tracking-wider text-slate-500 mt-1">Patients Triaged</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-emerald-400">31</p>
                <p className="text-xs uppercase font-bold tracking-wider text-slate-500 mt-1">Doctor Assignments</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-amber-400">99.2%</p>
                <p className="text-xs uppercase font-bold tracking-wider text-slate-500 mt-1">Success Rate</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

    </div>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrainCircuit, PhoneCall, Bell, Settings } from 'lucide-react';
import useAuthStore from './store/authStore';

// Pages
import Login          from './pages/auth/Login';
import Patients       from './pages/patients/Patients';
import Doctors        from './pages/doctors/Doctors';
import Beds           from './pages/beds/Beds';
import Resources      from './pages/resources/Resources';
import Appointments   from './pages/appointments/Appointments';
import PlaceholderPage from './pages/PlaceholderPage';
import CommandPalette from './components/ui/CommandPalette';

// Dashboards
import HospitalAdminDashboard from './pages/dashboard/HospitalAdminDashboard';
import SuperAdminDashboard from './pages/dashboard/SuperAdminDashboard';
import DoctorDashboard from './pages/dashboard/DoctorDashboard';
import ReceptionDashboard from './pages/dashboard/ReceptionDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

// Protected route wrapper
function ProtectedRoute({ children, permission }) {
  const { isAuthenticated, hasPermission, user } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (permission && !hasPermission(permission) && user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

// Role Router for Dashboard
function RoleRouter() {
  const { user } = useAuthStore();
  
  switch (user?.role) {
    case 'SUPER_ADMIN':
      return <SuperAdminDashboard />;
    case 'HOSPITAL_ADMIN':
      return <HospitalAdminDashboard />;
    case 'DOCTOR':
      return <DoctorDashboard />;
    case 'RECEPTIONIST':
      return <ReceptionDashboard />;
    default:
      return <HospitalAdminDashboard />;
  }
}

// Public route — redirect to dashboard if already logged in
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CommandPalette />
        <Routes>
          {/* Public */}
          <Route path="/login" element={
            <PublicRoute><Login /></PublicRoute>
          } />

          {/* Protected Dashboard */}
          <Route path="/dashboard" element={
            <ProtectedRoute><RoleRouter /></ProtectedRoute>
          } />
          <Route path="/patients" element={
            <ProtectedRoute permission="PATIENT_VIEW_QUEUE"><Patients /></ProtectedRoute>
          } />
          <Route path="/doctors" element={
            <ProtectedRoute permission="PATIENT_VIEW_QUEUE"><Doctors /></ProtectedRoute>
          } />
          <Route path="/beds" element={
            <ProtectedRoute permission="BED_MANAGE"><Beds /></ProtectedRoute>
          } />
          <Route path="/resources" element={
            <ProtectedRoute permission="RESOURCE_MANAGE"><Resources /></ProtectedRoute>
          } />
          <Route path="/appointments" element={
            <ProtectedRoute permission="PATIENT_VIEW_QUEUE"><Appointments /></ProtectedRoute>
          } />
          <Route path="/agent-activity" element={
            <ProtectedRoute permission="AGENT_VIEW">
              <PlaceholderPage title="Agent Activity" subtitle="AI agent decision timeline" icon={BrainCircuit} />
            </ProtectedRoute>
          } />
          <Route path="/call-logs" element={
            <ProtectedRoute permission="AGENT_VIEW">
              <PlaceholderPage title="Call Logs" subtitle="Vapi voice call history" icon={PhoneCall} />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <PlaceholderPage title="Notifications" subtitle="Alerts & system messages" icon={Bell} />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <PlaceholderPage title="Settings" subtitle="Hospital & system configuration" icon={Settings} />
            </ProtectedRoute>
          } />

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

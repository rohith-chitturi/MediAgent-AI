import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrainCircuit, PhoneCall, Bell, Settings } from 'lucide-react';
import useAuthStore from './store/authStore';

// Pages
import Login          from './pages/auth/Login';
import Dashboard      from './pages/dashboard/Dashboard';
import Patients       from './pages/patients/Patients';
import Doctors        from './pages/doctors/Doctors';
import Beds           from './pages/beds/Beds';
import Resources      from './pages/resources/Resources';
import Appointments   from './pages/appointments/Appointments';
import PlaceholderPage from './pages/PlaceholderPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
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
        <Routes>
          {/* Public */}
          <Route path="/login" element={
            <PublicRoute><Login /></PublicRoute>
          } />

          {/* Protected */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/patients" element={
            <ProtectedRoute><Patients /></ProtectedRoute>
          } />
          <Route path="/doctors" element={
            <ProtectedRoute><Doctors /></ProtectedRoute>
          } />
          <Route path="/beds" element={
            <ProtectedRoute><Beds /></ProtectedRoute>
          } />
          <Route path="/resources" element={
            <ProtectedRoute><Resources /></ProtectedRoute>
          } />
          <Route path="/appointments" element={
            <ProtectedRoute><Appointments /></ProtectedRoute>
          } />
          <Route path="/agent-activity" element={
            <ProtectedRoute>
              <PlaceholderPage title="Agent Activity" subtitle="AI agent decision timeline" icon={BrainCircuit} />
            </ProtectedRoute>
          } />
          <Route path="/call-logs" element={
            <ProtectedRoute>
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

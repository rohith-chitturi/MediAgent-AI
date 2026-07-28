import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhoneCall, PhoneForwarded, PhoneOff, CheckCircle2,
  AlertTriangle, Clock, Search, Filter, Play, RefreshCw, X,
  User, Stethoscope, ShieldAlert, Sparkles, FileText, ChevronRight, Activity
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import EmptyState from '../../components/ui/EmptyState';
import { voiceApi, patientsApi, doctorsApi } from '../../services/modules';
import { getSocket } from '../../services/socket';

export default function VoiceOperations() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedCall, setSelectedCall] = useState(null);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [triggerType, setTriggerType] = useState('FOLLOW_UP');

  // Trigger form state
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [customPhone, setCustomPhone] = useState('+1 (555) 234-5678');
  const [customName, setCustomName] = useState('John Doe');
  const [simulateRisk, setSimulateRisk] = useState('NORMAL');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch calls & stats
  const { data: voiceResponse, refetch } = useQuery({
    queryKey: ['voice-calls', activeTab, searchTerm],
    queryFn: () => voiceApi.listCalls({
      callType: activeTab === 'ALL' ? undefined : activeTab,
      search: searchTerm || undefined
    }).then(r => r.data.data),
    refetchInterval: 5000,
  });

  // Fetch patients & doctors for trigger modal dropdowns
  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientsApi.list().then(r => r.data.data),
  });

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: () => doctorsApi.list().then(r => r.data.data),
  });

  const calls = voiceResponse?.data || [];
  const stats = voiceResponse?.stats || {
    total: 0, active: 0, completed: 0, missed: 0, escalations: 0, followups: 0, successRate: 100, avgDuration: 42
  };

  // Real-time socket updates for call progress
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleCallEvent = () => {
      refetch();
    };

    socket.on('voice:call_started', handleCallEvent);
    socket.on('voice:call_updated', handleCallEvent);
    socket.on('voice:call_completed', handleCallEvent);

    return () => {
      socket.off('voice:call_started', handleCallEvent);
      socket.off('voice:call_updated', handleCallEvent);
      socket.off('voice:call_completed', handleCallEvent);
    };
  }, [refetch]);

  const handleTriggerCall = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let patientId = selectedPatientId || undefined;
      let doctorId = selectedDoctorId || undefined;
      let recipientName = customName;
      let calledTo = customPhone;

      if (triggerType === 'FOLLOW_UP' || triggerType === 'APPOINTMENT_REMINDER') {
        const p = patientsData?.data?.find(item => item.id === patientId);
        if (p) {
          recipientName = p.name;
          calledTo = p.phone || customPhone;
        }
      } else if (triggerType === 'EMERGENCY_ALERT') {
        const d = doctorsData?.data?.find(item => item.id === doctorId);
        if (d) {
          recipientName = `Dr. ${d.user.name}`;
          calledTo = d.user.phone || customPhone;
        }
      }

      await voiceApi.triggerCall({
        patientId,
        doctorId,
        callType: triggerType,
        calledTo,
        recipientName,
        recipientRole: triggerType === 'EMERGENCY_ALERT' ? 'DOCTOR' : (triggerType === 'CRITICAL_ALERT' ? 'ADMIN' : 'PATIENT'),
        context: {
          simulateRisk,
          reason: customReason || undefined
        }
      });

      setShowTriggerModal(false);
      refetch();
    } catch (err) {
      console.error('Trigger call error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div style={{ padding: '1.5rem', maxWidth: 1400, margin: '0 auto' }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: 10, padding: 8, display: 'flex' }}>
                <PhoneCall size={22} color="#fff" />
              </div>
              Voice Operations & Vapi AI
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              Autonomous event-driven Voice AI Agent calls, clinical summaries & transcript intelligence
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => refetch()}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={15} /> Refresh
            </button>

            <button
              onClick={() => setShowTriggerModal(true)}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                border: 'none',
                boxShadow: '0 4px 14px rgba(59,130,246,0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 600
              }}
            >
              <PhoneForwarded size={16} /> Trigger Outbound Call
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard title="Total Calls" value={stats.total} icon={PhoneCall} color="#3b82f6" />
          <StatCard title="Active Calls" value={stats.active} icon={PhoneForwarded} color="#f59e0b" animate={stats.active > 0} />
          <StatCard title="Completed Calls" value={stats.completed} icon={CheckCircle2} color="#10b981" />
          <StatCard title="Escalations" value={stats.escalations} icon={AlertTriangle} color="#ef4444" badge={stats.escalations > 0 ? 'CRITICAL' : null} />
          <StatCard title="Success Rate" value={`${stats.successRate}%`} icon={Activity} color="#8b5cf6" />
          <StatCard title="Avg Duration" value={`${stats.avgDuration}s`} icon={Clock} color="#06b6d4" />
        </div>

        {/* Quick Demo Launchers Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.06))',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 14,
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={16} color="#3b82f6" /> Production Demo Quick Triggers
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              Simulate autonomous event calls directly in the live Vapi agent pipeline:
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setTriggerType('APPOINTMENT_REMINDER'); setShowTriggerModal(true); }}
              style={quickButtonStyle('#3b82f6')}
            >
              📅 Appointment Reminder
            </button>
            <button
              onClick={() => { setTriggerType('FOLLOW_UP'); setSimulateRisk('HIGH'); setShowTriggerModal(true); }}
              style={quickButtonStyle('#ef4444')}
            >
              🚨 High-Risk Follow-up
            </button>
            <button
              onClick={() => { setTriggerType('EMERGENCY_ALERT'); setShowTriggerModal(true); }}
              style={quickButtonStyle('#f59e0b')}
            >
              👨‍⚕️ Emergency Doctor Call
            </button>
            <button
              onClick={() => { setTriggerType('CRITICAL_ALERT'); setShowTriggerModal(true); }}
              style={quickButtonStyle('#8b5cf6')}
            >
              📢 Hospital Admin Alert
            </button>
          </div>
        </div>

        {/* Search & Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['ALL', 'FOLLOW_UP', 'EMERGENCY_ALERT', 'APPOINTMENT_REMINDER', 'CRITICAL_ALERT'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: '1px solid',
                  cursor: 'pointer',
                  background: activeTab === tab ? 'var(--color-brand-500)' : 'transparent',
                  color: activeTab === tab ? '#fff' : 'var(--color-text-muted)',
                  borderColor: activeTab === tab ? 'var(--color-brand-500)' : 'var(--color-border)',
                  transition: 'all 0.2s'
                }}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: 280 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search transcript, recipient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: 36, height: 36, fontSize: '0.82rem' }}
            />
          </div>
        </div>

        {/* Calls Table */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          overflow: 'hidden'
        }}>
          {calls.length === 0 ? (
            <EmptyState
              icon={PhoneCall}
              title="No Call Logs Found"
              description="No voice calls match your filter criteria. Trigger an outbound call to see live Vapi execution."
            />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '10px 16px' }}>Status</th>
                  <th style={{ padding: '10px 16px' }}>Type</th>
                  <th style={{ padding: '10px 16px' }}>Recipient</th>
                  <th style={{ padding: '10px 16px' }}>Risk Level</th>
                  <th style={{ padding: '10px 16px' }}>Outcome</th>
                  <th style={{ padding: '10px 16px' }}>Duration</th>
                  <th style={{ padding: '10px 16px' }}>Initiated</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {calls.map(call => (
                  <tr
                    key={call.id}
                    style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={call.status} />
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                      <span style={{
                        background: 'rgba(59,130,246,0.1)',
                        color: '#3b82f6',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.75rem'
                      }}>
                        {call.callType}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{call.recipientName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{call.calledTo}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <RiskBadge level={call.riskLevel || 'LOW'} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.78rem', color: call.escalationRequired ? '#ef4444' : 'var(--color-text-primary)' }}>
                        {call.outcome || 'PENDING'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>
                      {call.duration ? `${call.duration}s` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                      {new Date(call.initiatedAt).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedCall(call)}
                        style={{
                          background: 'rgba(59,130,246,0.1)',
                          color: '#3b82f6',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Inspect AI Summary
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal 1: Call Details & AI Intelligence Drawer */}
        <AnimatePresence>
          {selectedCall && (
            <div style={modalOverlayStyle}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 16,
                  width: '90%',
                  maxWidth: 750,
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  padding: '1.5rem',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                  position: 'relative'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
                      {selectedCall.callType}
                    </span>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 4, color: 'var(--color-text-primary)' }}>
                      Call Intelligence — {selectedCall.recipientName}
                    </h2>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      Vapi Call ID: {selectedCall.vapiCallId || 'N/A'} • Initiated: {new Date(selectedCall.initiatedAt).toLocaleString()}
                    </p>
                  </div>
                  <button onClick={() => setSelectedCall(null)} style={closeButtonStyle}><X size={18} /></button>
                </div>

                {/* AI Executive Summary Card */}
                <div style={{
                  background: selectedCall.escalationRequired ? 'rgba(239,68,68,0.06)' : 'rgba(59,130,246,0.06)',
                  border: `1px solid ${selectedCall.escalationRequired ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
                  borderRadius: 12,
                  padding: '1rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: selectedCall.escalationRequired ? '#ef4444' : '#3b82f6', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Sparkles size={14} /> Gemini AI Medical Summary
                    </span>
                    <RiskBadge level={selectedCall.riskLevel || 'LOW'} />
                  </div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
                    {selectedCall.summary || 'Summary pending call completion.'}
                  </p>
                </div>

                {/* Structured Metadata Pills Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <MetaPill label="Sentiment" value={selectedCall.sentiment || 'NEUTRAL'} color="#8b5cf6" />
                  <MetaPill label="Med Compliance" value={selectedCall.medicationCompliance || 'N/A'} color="#10b981" />
                  <MetaPill label="Outcome" value={selectedCall.outcome || 'PENDING'} color="#3b82f6" />
                  <MetaPill label="Escalation" value={selectedCall.escalationRequired ? 'REQUIRED (ALERT SENT)' : 'NONE'} color={selectedCall.escalationRequired ? '#ef4444' : '#6b7280'} />
                </div>

                {/* Interactive Timeline */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                    Call Execution Timeline
                  </h4>
                  <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: 4 }}>
                    {(Array.isArray(selectedCall.timeline) ? selectedCall.timeline : [
                      { event: 'Call Started', status: 'COMPLETED' },
                      { event: 'Conversation Active', status: 'COMPLETED' },
                      { event: 'Transcript Received', status: 'COMPLETED' },
                      { event: 'Summary Generated', status: 'COMPLETED' },
                      { event: 'Follow-up Created', status: selectedCall.escalationRequired ? 'ACTION_REQUIRED' : 'COMPLETED' },
                      { event: 'Workflow Completed', status: 'COMPLETED' }
                    ]).map((step, idx) => (
                      <div key={idx} style={{
                        background: 'var(--color-surface-hover)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 8,
                        padding: '6px 10px',
                        flexShrink: 0,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: step.status === 'COMPLETED' ? '#10b981' : (step.status === 'ACTION_REQUIRED' ? '#ef4444' : 'var(--color-text-muted)')
                      }}>
                        ✓ {step.event}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expandable Transcript */}
                <div>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                    Call Transcript (Vapi Voice Recording)
                  </h4>
                  <div style={{
                    background: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 10,
                    padding: '1rem',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-secondary)',
                    maxHeight: 220,
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6
                  }}>
                    {selectedCall.transcript || 'No transcript generated for this call.'}
                  </div>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal 2: Trigger Outbound Call Modal */}
        <AnimatePresence>
          {showTriggerModal && (
            <div style={modalOverlayStyle}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 16,
                  width: '90%',
                  maxWidth: 520,
                  padding: '1.5rem',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <PhoneForwarded size={18} color="#3b82f6" /> Trigger Voice AI Call
                  </h2>
                  <button onClick={() => setShowTriggerModal(false)} style={closeButtonStyle}><X size={18} /></button>
                </div>

                <form onSubmit={handleTriggerCall}>
                  {/* Call Workflow Type */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Select Workflow Type</label>
                    <select
                      value={triggerType}
                      onChange={(e) => setTriggerType(e.target.value)}
                      className="input"
                      style={{ width: '100%', height: 38 }}
                    >
                      <option value="FOLLOW_UP">Post-Discharge Follow-up Call</option>
                      <option value="APPOINTMENT_REMINDER">Appointment Reminder Call</option>
                      <option value="EMERGENCY_ALERT">Emergency Doctor Alert Call</option>
                      <option value="CRITICAL_ALERT">Hospital Admin Alert Call</option>
                    </select>
                  </div>

                  {/* Recipient Selector */}
                  {(triggerType === 'FOLLOW_UP' || triggerType === 'APPOINTMENT_REMINDER') && (
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={labelStyle}>Select Patient</label>
                      <select
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        className="input"
                        style={{ width: '100%', height: 38 }}
                      >
                        <option value="">-- Choose Patient (or enter custom) --</option>
                        {patientsData?.data?.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.phone || 'No phone'})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {triggerType === 'EMERGENCY_ALERT' && (
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={labelStyle}>Select Doctor</label>
                      <select
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        className="input"
                        style={{ width: '100%', height: 38 }}
                      >
                        <option value="">-- Choose Doctor --</option>
                        {doctorsData?.data?.map(d => (
                          <option key={d.id} value={d.id}>Dr. {d.user.name} ({d.specialization})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Risk simulation flag */}
                  {triggerType === 'FOLLOW_UP' && (
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={labelStyle}>Simulation Risk Mode</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => setSimulateRisk('NORMAL')}
                          style={{
                            flex: 1, padding: '8px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600,
                            border: '1px solid', cursor: 'pointer',
                            background: simulateRisk === 'NORMAL' ? 'rgba(16,185,129,0.15)' : 'transparent',
                            color: simulateRisk === 'NORMAL' ? '#10b981' : 'var(--color-text-muted)',
                            borderColor: simulateRisk === 'NORMAL' ? '#10b981' : 'var(--color-border)'
                          }}
                        >
                          🟢 Normal Recovery
                        </button>
                        <button
                          type="button"
                          onClick={() => setSimulateRisk('HIGH')}
                          style={{
                            flex: 1, padding: '8px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600,
                            border: '1px solid', cursor: 'pointer',
                            background: simulateRisk === 'HIGH' ? 'rgba(239,68,68,0.15)' : 'transparent',
                            color: simulateRisk === 'HIGH' ? '#ef4444' : 'var(--color-text-muted)',
                            borderColor: simulateRisk === 'HIGH' ? '#ef4444' : 'var(--color-border)'
                          }}
                        >
                          🔴 High Risk (Trigger Alert)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button type="button" onClick={() => setShowTriggerModal(false)} className="btn btn-secondary">Cancel</button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none' }}
                    >
                      {isSubmitting ? 'Dispatching...' : 'Dispatch Call Now'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </Layout>
  );
}

// UI Subcomponents
function StatCard({ title, value, icon: Icon, color, animate, badge }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 12,
      padding: '1rem',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{title}</span>
        <div style={{ background: `${color}15`, color, borderRadius: 8, padding: 6, display: 'flex' }}>
          <Icon size={16} className={animate ? 'animate-spin' : ''} />
        </div>
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
        {value}
      </div>
      {badge && (
        <span style={{ position: 'absolute', top: 10, right: 10, background: '#ef4444', color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>
          {badge}
        </span>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const configs = {
    INITIATED: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: 'INITIATED' },
    RINGING: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'RINGING' },
    IN_PROGRESS: { bg: 'rgba(245,158,11,0.2)', color: '#f59e0b', label: 'IN PROGRESS' },
    COMPLETED: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'COMPLETED' },
    FAILED: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'FAILED' }
  };
  const cfg = configs[status] || configs.INITIATED;
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700 }}>
      {cfg.label}
    </span>
  );
}

function RiskBadge({ level }) {
  const colors = {
    CRITICAL: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    HIGH: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    MEDIUM: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
    LOW: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' }
  };
  const cfg = colors[level] || colors.LOW;
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 800 }}>
      {level} RISK
    </span>
  );
}

function MetaPill({ label, value, color }) {
  return (
    <div style={{ background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 10px' }}>
      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '0.82rem', fontWeight: 700, color, marginTop: 2 }}>{value}</div>
    </div>
  );
}

const modalOverlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
  zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
};

const closeButtonStyle = {
  background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4
};

const labelStyle = {
  display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4
};

function quickButtonStyle(color) {
  return {
    background: `${color}15`,
    color,
    border: `1px solid ${color}40`,
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s'
  };
}

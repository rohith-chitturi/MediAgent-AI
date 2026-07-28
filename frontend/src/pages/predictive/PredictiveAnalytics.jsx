import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  TrendingUp, Activity, AlertTriangle, ShieldAlert, Zap,
  Bed, Package, Clock, Sparkles, CheckCircle2, RefreshCw, ArrowRight
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { predictiveApi } from '../../services/modules';

export default function PredictiveAnalytics() {
  const [isRunning, setIsRunning] = useState(false);

  const { data: forecastData, refetch } = useQuery({
    queryKey: ['predictive-forecast'],
    queryFn: () => predictiveApi.getForecast().then(r => r.data.data),
    refetchInterval: 15000,
  });

  const handleRunForecast = async () => {
    setIsRunning(true);
    try {
      await predictiveApi.runForecast();
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  const telemetry = forecastData?.telemetry || { bedOccupancyPct: 0, icuOccupancyPct: 0, lowStockResourcesCount: 0, recentPatients24h: 0 };
  const forecast = forecastData?.forecast || {
    bedForecast: { icuRisk24h: 'LOW', generalWardRisk24h: 'LOW', predictedOccupancyPct: 0, summary: 'Analyzing telemetry...' },
    resourceDepletionAlerts: [],
    patientSurgePrediction: { surgeLikelihood: 'LOW', expectedIncomingCases24h: 0, topDepartmentDemand: '—' },
    actionableRecommendations: []
  };

  return (
    <Layout>
      <div style={{ padding: '1.5rem', maxWidth: 1400, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', borderRadius: 10, padding: 8, display: 'flex' }}>
                <TrendingUp size={22} color="#fff" />
              </div>
              Predictive Hospital Analytics
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              Proactive AI forecasting for bed occupancy, resource stockouts, patient surge detection & automated alerts
            </p>
          </div>

          <button
            onClick={handleRunForecast}
            disabled={isRunning}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(139,92,246,0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 600
            }}
          >
            <Zap size={16} className={isRunning ? 'animate-spin' : ''} />
            {isRunning ? 'Running AI Forecast...' : 'Run Instant AI Sweep'}
          </button>
        </div>

        {/* 24h Risk Gauges Header Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          
          <RiskWidget
            title="ICU Occupancy Risk (24h)"
            riskLevel={forecast.bedForecast?.icuRisk24h || 'LOW'}
            metric={`${telemetry.icuOccupancyPct}% Occupied`}
            subtitle={`Projected peak: ${forecast.bedForecast?.predictedOccupancyPct}%`}
            icon={Bed}
          />

          <RiskWidget
            title="Resource Depletion Alert"
            riskLevel={forecast.resourceDepletionAlerts?.some(r => r.riskLevel === 'CRITICAL') ? 'CRITICAL' : 'LOW'}
            metric={`${telemetry.lowStockResourcesCount} Low-Stock Items`}
            subtitle={forecast.resourceDepletionAlerts?.[0]?.resourceName ? `${forecast.resourceDepletionAlerts[0].resourceName} (~${forecast.resourceDepletionAlerts[0].hoursRemaining}h remaining)` : 'Stock levels nominal'}
            icon={Package}
          />

          <RiskWidget
            title="Patient Surge Prediction"
            riskLevel={forecast.patientSurgePrediction?.surgeLikelihood || 'LOW'}
            metric={`~${forecast.patientSurgePrediction?.expectedIncomingCases24h || 0} Cases Expected`}
            subtitle={`Highest demand: ${forecast.patientSurgePrediction?.topDepartmentDemand || 'General'}`}
            icon={Activity}
          />

        </div>

        {/* AI Executive Forecast Summary Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.08))',
          border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: 14,
          padding: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={18} color="#8b5cf6" /> Gemini AI Predictive Operational Briefing
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Updated: {new Date(forecastData?.lastUpdated || Date.now()).toLocaleTimeString()}
            </span>
          </div>
          <p style={{ fontSize: '0.92rem', color: 'var(--color-text-primary)', lineHeight: 1.5, fontWeight: 500 }}>
            {forecast.bedForecast?.summary || 'Autonomous agent actively monitoring hospital telemetry and knowledge layer.'}
          </p>
        </div>

        {/* Two Column Layout: Resource Countdown + AI Recommendations */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          
          {/* Resource Depletion Countdowns */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package size={17} color="#ec4899" /> Resource Stockout Countdowns
            </h3>

            {forecast.resourceDepletionAlerts?.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No imminent resource depletion risks detected.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {forecast.resourceDepletionAlerts.map((res, i) => (
                  <div key={i} style={{
                    background: 'var(--color-surface-hover)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 10,
                    padding: '0.875rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>{res.resourceName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                        Recommended Order: +{res.recommendedReorderQty} units
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        background: res.riskLevel === 'CRITICAL' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                        color: res.riskLevel === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: '0.78rem',
                        fontWeight: 800
                      }}>
                        ⏱️ ~{res.hoursRemaining}h Left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actionable AI Recommendations */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldAlert size={17} color="#8b5cf6" /> Actionable Proactive Mitigations
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(forecast.actionableRecommendations?.length > 0 ? forecast.actionableRecommendations : [
                "Prepare 2 General Ward beds for step-down ICU transition.",
                "Authorize automatic restocking for critical resource thresholds.",
                "Review doctor workload distribution for Cardiology department."
              ]).map((rec, idx) => (
                <div key={idx} style={{
                  background: 'rgba(139,92,246,0.06)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  borderRadius: 10,
                  padding: '0.875rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10
                }}>
                  <ArrowRight size={16} color="#8b5cf6" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{rec}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </Layout>
  );
}

function RiskWidget({ title, riskLevel, metric, subtitle, icon: Icon }) {
  const riskColors = {
    CRITICAL: '#ef4444',
    HIGH: '#f59e0b',
    MEDIUM: '#3b82f6',
    LOW: '#10b981'
  };
  const color = riskColors[riskLevel] || '#10b981';

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 14,
      padding: '1.25rem',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{title}</span>
        <span style={{
          background: `${color}15`,
          color,
          padding: '2px 8px',
          borderRadius: 6,
          fontSize: '0.7rem',
          fontWeight: 800
        }}>
          {riskLevel}
        </span>
      </div>

      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 2 }}>
        {metric}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        {subtitle}
      </div>
    </div>
  );
}

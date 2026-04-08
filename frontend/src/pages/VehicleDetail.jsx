import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchVehicleDiagnostics, fetchVehicleHistory, aiAnalyze } from '../api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function VehicleDetail() {
  const { id } = useParams();
  const [diag, setDiag] = useState(null);
  const [history, setHistory] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [window, setWindow] = useState('1h');

  useEffect(() => {
    const load = async () => {
      const [d, h] = await Promise.all([
        fetchVehicleDiagnostics(id),
        fetchVehicleHistory(id, window),
      ]);
      setDiag(d.data);
      // Reverse so oldest is first (for chart)
      setHistory(h.data.reverse().map(r => ({
        ...r,
        time: new Date(r.time).toLocaleTimeString(),
      })));
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [id, window]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await aiAnalyze(id);
      setAnalysis(res.data.analysis);
    } catch (err) {
      setAnalysis({ status: 'ERROR', reasoning: err.message });
    }
    setAnalyzing(false);
  };

  if (!diag) return <div style={{ padding: '40px', color: '#64748b' }}>Loading...</div>;

  const { current, activeAlerts, dtcs } = diag;
  const statusColors = { NORMAL: '#22c55e', DEGRADING: '#f59e0b', CRITICAL: '#ef4444', ERROR: '#64748b' };

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>{id} — Diagnostics</h1>

      {/* Current state cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'State', value: current?.state },
          { label: 'Battery', value: `${current?.batterySoc?.toFixed(1)}%` },
          { label: 'Voltage', value: `${current?.batteryVoltage?.toFixed(1)}V` },
          { label: 'Temp', value: `${current?.batteryTemp?.toFixed(1)}°C` },
          { label: 'Health', value: current?.batteryHealth },
        ].map(s => (
          <div key={s.label} style={{
            background: '#1e293b', borderRadius: '10px', padding: '16px',
            border: '1px solid #334155', textAlign: 'center',
          }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Battery SOC Over Time</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['1h', '6h', '24h'].map(w => (
              <button key={w} onClick={() => setWindow(w)} style={{
                padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: window === w ? '#3b82f6' : '#334155',
                color: window === w ? '#fff' : '#94a3b8', fontSize: '12px',
              }}>{w}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
            <Line type="monotone" dataKey="batterySoc" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* AI Analysis */}
      <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>AI Analysis</h2>
          <button onClick={runAnalysis} disabled={analyzing} style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: '#3b82f6', color: '#fff', fontSize: '13px', fontWeight: 600,
            opacity: analyzing ? 0.5 : 1,
          }}>
            {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
          </button>
        </div>
        {analysis && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{
                padding: '6px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '14px',
                background: `${statusColors[analysis.status] || '#64748b'}20`,
                color: statusColors[analysis.status] || '#64748b',
              }}>{analysis.status}</span>
              {analysis.confidence && (
                <span style={{ color: '#64748b', fontSize: '13px' }}>
                  Confidence: {(analysis.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: '12px' }}>
              {analysis.reasoning}
            </p>
            {analysis.actions?.length > 0 && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Recommended Actions:</div>
                {analysis.actions.map((a, i) => (
                  <div key={i} style={{ fontSize: '13px', color: '#94a3b8', padding: '4px 0', paddingLeft: '12px', borderLeft: '2px solid #3b82f6' }}>{a}</div>
                ))}
              </div>
            )}
          </div>
        )}
        {!analysis && <p style={{ color: '#475569', fontSize: '14px' }}>Click "Run AI Analysis" to get GenAI diagnostics for this vehicle.</p>}
      </div>

      {/* Active Alerts */}
      {activeAlerts?.length > 0 && (
        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Active Alerts</h2>
          {activeAlerts.map(a => (
            <div key={a._id} style={{
              padding: '12px', borderRadius: '8px', marginBottom: '8px',
              background: a.severity === 'CRITICAL' ? '#ef444420' : a.severity === 'WARNING' ? '#f59e0b20' : '#3b82f620',
              borderLeft: `3px solid ${a.severity === 'CRITICAL' ? '#ef4444' : a.severity === 'WARNING' ? '#f59e0b' : '#3b82f6'}`,
            }}>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>{a.alertType}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{a.message}</div>
            </div>
          ))}
        </div>
      )}

      {/* DTCs */}
      {dtcs?.length > 0 && (
        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Active DTCs</h2>
          {dtcs.map((d, i) => (
            <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #334155', fontSize: '13px' }}>
              <span style={{ fontWeight: 700, color: '#f59e0b' }}>{d.code}</span> — {d.description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
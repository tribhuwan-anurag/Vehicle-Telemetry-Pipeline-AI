import { useState, useEffect } from 'react';
import { fetchVehicles, aiAnalyze, aiPredict, aiExplainDtc } from '../api';
import { Brain, Send } from 'lucide-react';

export default function AiCopilot() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [action, setAction] = useState('analyze');
  const [dtcCode, setDtcCode] = useState('P0300');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVehicles().then(res => {
      setVehicles(res.data);
      if (res.data.length > 0) setSelectedVehicle(res.data[0].vehicleId);
    });
  }, []);

  const run = async () => {
    if (!selectedVehicle) return;
    setLoading(true);
    setResult(null);
    try {
      let res;
      if (action === 'analyze') res = await aiAnalyze(selectedVehicle);
      else if (action === 'predict') res = await aiPredict(selectedVehicle);
      else if (action === 'explain-dtc') res = await aiExplainDtc(selectedVehicle, dtcCode);
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.message });
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Brain size={28} color="#8b5cf6" /> AI Copilot
      </h1>

      {/* Controls */}
      <div style={{
        background: '#1e293b', borderRadius: '12px', padding: '20px',
        border: '1px solid #334155', marginBottom: '24px',
        display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap',
      }}>
        <div>
          <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Vehicle</label>
          <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} style={{
            padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155',
            background: '#0f172a', color: '#e2e8f0', fontSize: '14px',
          }}>
            {vehicles.map(v => (
              <option key={v.vehicleId} value={v.vehicleId}>{v.vehicleId} — {v.batteryHealth}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Action</label>
          <select value={action} onChange={e => setAction(e.target.value)} style={{
            padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155',
            background: '#0f172a', color: '#e2e8f0', fontSize: '14px',
          }}>
            <option value="analyze">Anomaly Analysis</option>
            <option value="predict">Predictive Maintenance</option>
            <option value="explain-dtc">Explain DTC</option>
          </select>
        </div>

        {action === 'explain-dtc' && (
          <div>
            <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>DTC Code</label>
            <input value={dtcCode} onChange={e => setDtcCode(e.target.value)} style={{
              padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155',
              background: '#0f172a', color: '#e2e8f0', fontSize: '14px', width: '100px',
            }} />
          </div>
        )}

        <button onClick={run} disabled={loading} style={{
          padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
          background: '#8b5cf6', color: '#fff', fontSize: '14px', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '6px',
          opacity: loading ? 0.5 : 1,
        }}>
          <Send size={14} /> {loading ? 'Running...' : 'Run'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div style={{
          background: '#1e293b', borderRadius: '12px', padding: '20px',
          border: '1px solid #334155',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#8b5cf6' }}>
            AI Response
          </h2>
          <pre style={{
            background: '#0f172a', padding: '16px', borderRadius: '8px',
            fontSize: '13px', lineHeight: 1.6, color: '#e2e8f0',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            border: '1px solid #334155',
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
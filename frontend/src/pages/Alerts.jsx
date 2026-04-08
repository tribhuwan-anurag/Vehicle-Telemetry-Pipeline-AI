import { useState, useEffect } from 'react';
import { fetchActiveAlerts, resolveAlert } from '../api';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);

  const load = async () => {
    const res = await fetchActiveAlerts();
    setAlerts(res.data);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (id) => {
    await resolveAlert(id);
    load();
  };

  const sevColor = { CRITICAL: '#ef4444', WARNING: '#f59e0b', INFO: '#3b82f6' };

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>
        Active Alerts ({alerts.length})
      </h1>

      {alerts.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          No active alerts. All systems nominal.
        </div>
      )}

      {alerts.map(a => (
        <div key={a._id} style={{
          background: '#1e293b', borderRadius: '12px', padding: '16px 20px',
          border: '1px solid #334155', marginBottom: '12px',
          borderLeft: `4px solid ${sevColor[a.severity] || '#64748b'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{
                padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                background: `${sevColor[a.severity]}20`, color: sevColor[a.severity],
              }}>{a.severity}</span>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>{a.vehicleId}</span>
              <span style={{ color: '#64748b', fontSize: '13px' }}>{a.alertType}</span>
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>{a.message}</div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
              {new Date(a.time).toLocaleString()}
            </div>
          </div>
          <button onClick={() => handleResolve(a._id)} style={{
            padding: '6px 14px', borderRadius: '6px', border: '1px solid #334155',
            background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '12px',
          }}>Resolve</button>
        </div>
      ))}
    </div>
  );
}
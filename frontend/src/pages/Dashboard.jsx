import { useState, useEffect } from 'react';
import { fetchFleetHealth, fetchVehicles } from '../api';
import { Activity, Battery, Thermometer, AlertTriangle } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div style={{
    background: '#1e293b', borderRadius: '12px', padding: '20px',
    display: 'flex', alignItems: 'center', gap: '16px',
    border: '1px solid #334155',
  }}>
    <div style={{
      width: '48px', height: '48px', borderRadius: '10px',
      background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={24} color={color} />
    </div>
    <div>
      <div style={{ fontSize: '13px', color: '#94a3b8' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 700 }}>{value}</div>
    </div>
  </div>
);

const HealthBadge = ({ status }) => {
  const colors = { HEALTHY: '#22c55e', DEGRADING: '#f59e0b', CRITICAL: '#ef4444' };
  return (
    <span style={{
      padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
      background: `${colors[status] || '#64748b'}20`,
      color: colors[status] || '#64748b',
    }}>
      {status}
    </span>
  );
};

export default function Dashboard() {
  const [health, setHealth] = useState(null);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [h, v] = await Promise.all([fetchFleetHealth(), fetchVehicles()]);
      setHealth(h.data);
      setVehicles(v.data);
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!health) return <div style={{ padding: '40px', color: '#64748b' }}>Loading...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Fleet Dashboard</h1>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <StatCard icon={Activity} label="Total Vehicles" value={health.totalVehicles} color="#3b82f6" />
        <StatCard icon={Battery} label="Healthy" value={health.healthBreakdown?.HEALTHY || 0} color="#22c55e" />
        <StatCard icon={Thermometer} label="Degrading" value={health.healthBreakdown?.DEGRADING || 0} color="#f59e0b" />
        <StatCard icon={AlertTriangle} label="Active Alerts" value={health.activeAlerts} color="#ef4444" />
      </div>

      {/* Vehicle table */}
      <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Fleet Overview</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              {['Vehicle', 'State', 'Battery', 'Voltage', 'Temp', 'Speed', 'Health'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vehicles.map(v => (
              <tr key={v.vehicleId} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                  <a href={`/vehicle/${v.vehicleId}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>{v.vehicleId}</a>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>{v.state}</td>
                <td style={{ padding: '12px 16px' }}>{v.batterySoc?.toFixed(1)}%</td>
                <td style={{ padding: '12px 16px' }}>{v.batteryVoltage?.toFixed(1)}V</td>
                <td style={{ padding: '12px 16px' }}>{v.batteryTemp?.toFixed(1)}°C</td>
                <td style={{ padding: '12px 16px' }}>{v.speed?.toFixed(1)} km/h</td>
                <td style={{ padding: '12px 16px' }}><HealthBadge status={v.batteryHealth} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
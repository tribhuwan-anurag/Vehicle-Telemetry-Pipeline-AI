import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchVehicles } from '../api';
import { Battery, Zap, Thermometer } from 'lucide-react';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const res = await fetchVehicles();
      setVehicles(res.data);
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const stateColors = { DRIVING: '#3b82f6', PARKED: '#64748b', CHARGING: '#22c55e' };

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Vehicles</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {vehicles.map(v => (
          <div key={v.vehicleId} onClick={() => navigate(`/vehicle/${v.vehicleId}`)} style={{
            background: '#1e293b', borderRadius: '12px', padding: '20px',
            border: '1px solid #334155', cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontWeight: 700, fontSize: '16px' }}>{v.vehicleId}</span>
              <span style={{
                padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                background: `${stateColors[v.state]}20`, color: stateColors[v.state],
              }}>{v.state}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Battery size={16} color="#22c55e" />
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>SOC</span>
                <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{v.batterySoc?.toFixed(1)}%</span>
              </div>
              <div style={{
                height: '4px', background: '#334155', borderRadius: '2px',
              }}>
                <div style={{
                  height: '100%', borderRadius: '2px', width: `${v.batterySoc || 0}%`,
                  background: v.batterySoc > 50 ? '#22c55e' : v.batterySoc > 20 ? '#f59e0b' : '#ef4444',
                }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={16} color="#f59e0b" />
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Voltage</span>
                <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{v.batteryVoltage?.toFixed(1)}V</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Thermometer size={16} color="#ef4444" />
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Temp</span>
                <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{v.batteryTemp?.toFixed(1)}°C</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
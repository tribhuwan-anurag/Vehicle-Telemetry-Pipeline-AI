import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Activity, Car, AlertTriangle, Brain } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';
import Alerts from './pages/Alerts';
import AiCopilot from './pages/AiCopilot';
import './index.css';


function NavLink({to, icon: Icon, label}) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} style = {{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '10px 16px', borderRadius: '8px', textDecoration: 'none',
      background: active ? '#3b82f6' : 'transparent',
      color: active ? '#fff' : '#94a3b8',
      fontWeight: active ? 600 : 400,
      transition: 'all 0.2s',
    }}>
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  )
}

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
        {/* Sidebar */}
        <nav style={{
          width: '220px', padding: '20px 12px', borderRight: '1px solid #1e293b',
          display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          <h2 style={{ color: '#3b82f6', fontSize: '18px', fontWeight: 700, padding: '0 16px 16px', margin: 0 }}>
            Fleet AI
          </h2>
          <NavLink to="/" icon={Activity} label="Dashboard" />
          <NavLink to="/vehicles" icon={Car} label="Vehicles" />
          <NavLink to="/alerts" icon={AlertTriangle} label="Alerts" />
          <NavLink to="/ai" icon={Brain} label="AI Copilot" />
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/vehicle/:id" element={<VehicleDetail />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/ai" element={<AiCopilot />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
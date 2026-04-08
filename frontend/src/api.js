import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
})

export const fetchFleetHealth = () => api.get('/fleet/health');
export const fetchVehicles = () => api.get('/fleet/vehicles');
export const fetchVehicleDiagnostics = (id) => api.get(`/vehicle/${id}/diagnostics`);
export const fetchVehicleHistory = (id, window = '1h') => api.get(`/vehicle/${id}/history?window=${window}`);
export const fetchActiveAlerts = () => api.get('/alerts/active');
export const resolveAlert = (id) => api.patch(`/alerts/${id}/resolve`);
export const aiAnalyze = (id) => api.post(`/ai/analyze/${id}`);
export const aiPredict = (id) => api.post(`/ai/predict/${id}`);
export const aiExplainDtc = (id, code) => api.post(`/ai/explain-dtc/${id}/${code}`);

export default api;
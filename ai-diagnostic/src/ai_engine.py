"""
AI Engine — sends vehicle telemetry to Gemini for analysis.
Uses Google's free Gemini API.
"""

import json
import google.generativeai as genai
from config import GEMINI_API_KEY, MODEL_NAME

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel(MODEL_NAME)


def _call_gemini(prompt: str) -> dict:
    """Call Gemini API and parse JSON response."""
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()

        # Strip markdown code fences if present
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        return json.loads(text)
    except json.JSONDecodeError:
        return {"status": "ERROR", "reasoning": text, "actions": []}
    except Exception as e:
        return {"status": "ERROR", "reasoning": str(e), "actions": []}


def analyze_vehicle(vehicle_data: dict) -> dict:
    """Anomaly detection — classify vehicle health."""
    stats = vehicle_data.get("stats_24h") or {}
    dtcs = vehicle_data.get("dtcs", [])
    alerts = vehicle_data.get("active_alerts", [])

    prompt = f"""You are a vehicle diagnostics expert specializing in electric vehicle telemetry.
Analyze this 24-hour telemetry summary for vehicle {vehicle_data['vehicle_id']}.

Normal operating ranges:
- Battery SOC: 20-100% (below 20% = low)
- Battery voltage: 340-403V (below 330V with high SOC = cell failure)
- Battery temperature: 15-40°C (above 45°C = overheating)
- Motor temperature: 20-85°C (above 90°C = overheating)

Current state: {vehicle_data.get('current_state')}
Current SOC: {vehicle_data.get('current_soc', 'N/A')}%
Current voltage: {vehicle_data.get('current_voltage', 'N/A')}V
Current battery temp: {vehicle_data.get('current_temp', 'N/A')}°C
Current health flag: {vehicle_data.get('current_health')}

24h statistics:
- SOC range: {stats.get('min_soc', 'N/A')}% to {stats.get('max_soc', 'N/A')}%
- SOC start to end: {stats.get('start_soc', 'N/A')}% to {stats.get('end_soc', 'N/A')}%
- Voltage range: {stats.get('min_voltage', 'N/A')}V to {stats.get('max_voltage', 'N/A')}V
- Battery temp range: {stats.get('min_temp', 'N/A')}°C to {stats.get('max_temp', 'N/A')}°C
- Motor temp max: {stats.get('max_motor_temp', 'N/A')}°C
- Max speed: {stats.get('max_speed', 'N/A')} km/h
- Samples: {stats.get('sample_count', 0)}

Active alerts: {json.dumps(alerts) if alerts else 'None'}
Active DTCs: {json.dumps(dtcs) if dtcs else 'None'}

Respond ONLY with valid JSON, no markdown, no extra text:
{{"status": "NORMAL or DEGRADING or CRITICAL", "confidence": 0.0 to 1.0, "reasoning": "2-3 sentences", "actions": ["action1", "action2"], "risk_factors": ["factor1"]}}"""

    return _call_gemini(prompt)


def predict_maintenance(trend_data: list, vehicle_id: str) -> dict:
    """Predictive maintenance — forecast next 30 days."""
    prompt = f"""You are a predictive maintenance expert for electric vehicles.
Analyze this 7-day trend data for vehicle {vehicle_id} and predict maintenance needs for the next 30 days.

Daily data (most recent last):
{json.dumps(trend_data, indent=2)}

Look for:
- SOC range narrowing day over day = battery capacity loss
- Temperature trending upward at same usage = cooling issue
- Voltage dropping while SOC is stable = cell degradation

Respond ONLY with valid JSON, no markdown, no extra text:
{{"predictions": [{{"issue": "description", "likelihood": "HIGH or MEDIUM or LOW", "timeframe": "within X days", "recommended_action": "what to do"}}], "overall_health_trend": "IMPROVING or STABLE or DECLINING", "summary": "2-3 sentences"}}"""

    return _call_gemini(prompt)


def explain_dtc(vehicle_data: dict, dtc_code: str) -> dict:
    """Root cause analysis for a DTC."""
    stats = vehicle_data.get("stats_24h") or {}

    prompt = f"""You are an automotive diagnostics expert.
Explain the root cause of DTC {dtc_code} for vehicle {vehicle_data['vehicle_id']}.

Vehicle context:
- Current SOC: {vehicle_data.get('current_soc', 'N/A')}%
- Current voltage: {vehicle_data.get('current_voltage', 'N/A')}V
- Battery temp: {vehicle_data.get('current_temp', 'N/A')}°C
- 24h voltage range: {stats.get('min_voltage', 'N/A')}V to {stats.get('max_voltage', 'N/A')}V
- 24h temp range: {stats.get('min_temp', 'N/A')}°C to {stats.get('max_temp', 'N/A')}°C
- Current health flag: {vehicle_data.get('current_health')}
- All active DTCs: {json.dumps(vehicle_data.get('dtcs', []))}

Common EV DTC reference:
- P0300: Random misfire
- P0480: Cooling fan relay circuit
- P0A80: Replace hybrid/EV battery pack
- U0100: Lost communication with ECM
- B1234: Climate control sensor fault
- P0562: System voltage low
- P0AA6: Hybrid battery voltage mismatch

Respond ONLY with valid JSON, no markdown, no extra text:
{{"dtc_code": "{dtc_code}", "description": "what this code means", "probable_cause": "2-3 sentences explaining root cause given the telemetry", "severity": "LOW or MEDIUM or HIGH or CRITICAL", "immediate_action": "what to do now", "long_term_fix": "permanent solution"}}"""

    return _call_gemini(prompt)
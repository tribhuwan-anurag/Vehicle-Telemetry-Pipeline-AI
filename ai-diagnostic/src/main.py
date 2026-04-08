"""
AI Diagnostics Service — FastAPI app.
Endpoints:
  POST /ai/analyze/{vehicle_id}
  POST /ai/predict/{vehicle_id}
  POST /ai/explain-dtc/{vehicle_id}/{dtc_code}
  GET  /health
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import PORT
from data_fetcher import get_vehicle_summary_24h, get_vehicle_trend_7d
from ai_engine import analyze_vehicle, predict_maintenance, explain_dtc

app = FastAPI(title="Fleet AI Diagnostics", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai-diagnostics"}


@app.post("/ai/analyze/{vehicle_id}")
async def analyze(vehicle_id: str):
    """GenAI anomaly analysis for a vehicle."""
    data = await get_vehicle_summary_24h(vehicle_id)
    if not data:
        raise HTTPException(status_code=404, detail=f"Vehicle {vehicle_id} not found")

    result = analyze_vehicle(data)
    return {"vehicle_id": vehicle_id, "analysis": result}


@app.post("/ai/predict/{vehicle_id}")
async def predict(vehicle_id: str):
    """Predictive maintenance for the next 30 days."""
    trends = await get_vehicle_trend_7d(vehicle_id)
    if not trends:
        raise HTTPException(status_code=404, detail=f"No trend data for {vehicle_id}")

    result = predict_maintenance(trends, vehicle_id)
    return {"vehicle_id": vehicle_id, "predictions": result}


@app.post("/ai/explain-dtc/{vehicle_id}/{dtc_code}")
async def explain(vehicle_id: str, dtc_code: str):
    """Root cause analysis for a DTC."""
    data = await get_vehicle_summary_24h(vehicle_id)
    if not data:
        raise HTTPException(status_code=404, detail=f"Vehicle {vehicle_id} not found")

    result = explain_dtc(data, dtc_code)
    return {"vehicle_id": vehicle_id, "dtc_code": dtc_code, "explanation": result}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
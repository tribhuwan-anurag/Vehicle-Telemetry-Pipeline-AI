# Vehicle Telemetry Pipeline

A real-time telemetry ingestion and diagnostics pipeline for vehicle sensor data, built to process multi-signal data streams and automatically flag anomalies using an LLM-powered diagnostics layer.

Why this exists

Traditional vehicle diagnostics rely on manual trend-based inspection, someone has to look at battery, GPS, and DTC (Diagnostic Trouble Code) signals over time and spot patterns by hand. This project automates that process: it ingests raw sensor data in real time, isolates faults so one bad signal doesn't take down the whole pipeline, and uses an LLM to classify anomaly patterns automatically, replacing manual inspection with automated root-cause classification.

## What it does
Ingests real-time, multi-signal vehicle data (battery, GPS, DTC codes) over MQTT
Uses a gRPC-based inter-service layer to connect Python and Java components
Persists incoming data to a time-series database for historical analysis
Processes signals with fault isolation, so a failure in one signal stream doesn't block others
Runs a GenAI diagnostics layer that classifies anomaly patterns across 24-hour windows
Automates root-cause classification instead of relying on manual trend inspection

## Architecture
Sensor data (battery, GPS, DTC) streams in over MQTT
Spring Boot and Python services process signals independently, connected via gRPC
Fault isolation ensures one bad signal doesn't disrupt the rest of the pipeline
Processed data is persisted to a time-series database
An LLM API analyzes rolling 24-hour windows of signal data to classify anomaly patterns and surface likely root causes

## Project structure
vehicle-telemetry-pipeline/
├── ingestion/          # MQTT ingestion service
├── services/
│   ├── python/         # Python-side processing service
│   └── java/            # Java/Spring Boot processing service
├── grpc/                # gRPC service definitions and inter-service contracts
├── diagnostics/          # LLM-based anomaly classification layer
└── storage/             # Time-series database integration


## Running locally
# Clone the repo
git clone https://github.com/tribhuwan-anurag/vehicle-telemetry-pipeline
cd vehicle-telemetry-pipeline

# Install dependencies (adjust per service)
pip install -r requirements.txt   # Python service
./mvnw install                    # Java/Spring Boot service

# Start MQTT broker and run services

Notes 
This project was built to get hands-on experience with real-time, multi-signal data pipelines and to explore how LLMs can be applied 
to automate diagnostics work that's traditionally done manually. Future improvements could include expanding sensor coverage, adding 
a live dashboard for visualizing flagged anomalies, and benchmarking classification accuracy against known fault cases.

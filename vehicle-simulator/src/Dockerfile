FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY proto/ proto/
RUN mkdir -p src && python -m grpc_tools.protoc -I=proto --python_out=src --grpc_python_out=src proto/telemetry.proto
COPY src/ src/
WORKDIR /app/src
CMD ["python", "main.py"]
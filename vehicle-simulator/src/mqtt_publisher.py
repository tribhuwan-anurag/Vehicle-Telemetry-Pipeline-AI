import time
import paho.mqtt.client as mqtt


class MQTTPublisher:
    def __init__(self, broker_host="localhost", broker_port=1883, client_id="fleet-simulator"):
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=client_id)
        self.connected = False
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect

    def _on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            print(f"[MQTT] Connected to {self.broker_host}:{self.broker_port}")
            self.connected = True
        else:
            print(f"[MQTT] Connection failed with code {rc}")

    def _on_disconnect(self, client, userdata, flags, rc, properties=None):
        print("[MQTT] Disconnected")
        self.connected = False

    def connect(self, retries=5, delay=2):
        for attempt in range(1, retries + 1):
            try:
                self.client.connect(self.broker_host, self.broker_port, keepalive=60)
                self.client.loop_start()
                timeout = 5
                while not self.connected and timeout > 0:
                    time.sleep(0.5)
                    timeout -= 0.5
                if self.connected:
                    return True
            except Exception as e:
                print(f"[MQTT] Attempt {attempt}/{retries} failed: {e}")
                time.sleep(delay)
        raise ConnectionError(f"Could not connect to MQTT broker")

    def publish_telemetry(self, vehicle_id, serialized_event):
        topic = f"vehicles/{vehicle_id}/telemetry"
        self.client.publish(topic, serialized_event, qos=1)

    def publish_dtc(self, vehicle_id, dtc_data):
        self.client.publish(f"vehicles/{vehicle_id}/dtc", dtc_data, qos=1)

    def publish_fleet_alert(self, alert_data):
        self.client.publish("fleet/alerts", alert_data, qos=1)

    def disconnect(self):
        self.client.loop_stop()
        self.client.disconnect()
        print("[MQTT] Publisher shut down cleanly")
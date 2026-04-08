import os
import sys
import asyncio
import signal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fleet_manager import FleetManager


def main():
    mqtt_host = os.getenv("MQTT_HOST", "localhost")
    mqtt_port = int(os.getenv("MQTT_PORT", "1883"))
    fleet_size = int(os.getenv("FLEET_SIZE", "10"))

    print(f"[CONFIG] MQTT: {mqtt_host}:{mqtt_port}, Fleet size: {fleet_size}")

    manager = FleetManager(fleet_size=fleet_size, mqtt_host=mqtt_host, mqtt_port=mqtt_port)

    loop = asyncio.new_event_loop()

    def shutdown(sig, frame):
        manager.stop()
        for task in asyncio.all_tasks(loop):
            task.cancel()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        loop.run_until_complete(manager.start())
    except KeyboardInterrupt:
        manager.stop()


if __name__ == "__main__":
    main()
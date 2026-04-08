import asyncio
import random

from vehicle_agent import VehicleAgent
from fault_injector import FaultInjector
from mqtt_publisher import MQTTPublisher


class FleetManager:
    def __init__(self, fleet_size=10, mqtt_host="localhost", mqtt_port=1883):
        self.fleet_size = fleet_size
        self.publisher = MQTTPublisher(broker_host=mqtt_host, broker_port=mqtt_port)
        self.fault_injector = FaultInjector(fault_probability=0.02)
        self.vehicles = []
        self.running = False

    def _create_fleet(self):
        base_lat, base_lon = 32.7357, -97.1081
        for i in range(1, self.fleet_size + 1):
            vid = f"VH-{i:03d}"
            lat = base_lat + random.uniform(-0.05, 0.05)
            lon = base_lon + random.uniform(-0.05, 0.05)
            agent = VehicleAgent(vehicle_id=vid, start_lat=lat, start_lon=lon)
            self.vehicles.append(agent)
            print(f"[FLEET] Created {vid} at ({lat:.4f}, {lon:.4f})")

    async def _run_vehicle(self, agent):
        while self.running:
            event = agent.tick()
            self.fault_injector.inject(agent)
            serialized = event.SerializeToString()
            self.publisher.publish_telemetry(agent.vehicle_id, serialized)
            await asyncio.sleep(random.uniform(1.0, 2.0))

    async def _print_status(self):
        while self.running:
            await asyncio.sleep(10)
            print("\n" + "=" * 60)
            print(f"{'VID':<10} {'State':<10} {'SOC':>6} {'Volt':>7} {'Temp':>6} {'Speed':>7} {'DTCs':>5}")
            print("-" * 60)
            for v in self.vehicles:
                state_name = {0: "PARKED", 1: "DRIVING", 2: "CHARGING"}.get(v.state, "?")
                print(f"{v.vehicle_id:<10} {state_name:<10} "
                      f"{v.battery_soc:>5.1f}% {v.battery_voltage:>6.1f}V "
                      f"{v.battery_temp:>5.1f}° {v.speed:>6.1f} "
                      f"{len(v.active_dtcs):>5}")
            print("=" * 60 + "\n")

    async def start(self):
        print(f"[FLEET] Starting fleet of {self.fleet_size} vehicles...")
        self._create_fleet()
        self.publisher.connect()
        self.running = True
        tasks = [asyncio.create_task(self._run_vehicle(v)) for v in self.vehicles]
        tasks.append(asyncio.create_task(self._print_status()))
        try:
            await asyncio.gather(*tasks)
        except asyncio.CancelledError:
            pass
        finally:
            self.stop()

    def stop(self):
        print("\n[FLEET] Shutting down...")
        self.running = False
        self.publisher.disconnect()
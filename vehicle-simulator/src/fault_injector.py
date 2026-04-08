import random
import time
import telemetry_pb2 as pb

DTC_CATALOG = [
    ("P0300", pb.WARNING, "Random misfire detected"),
    ("P0480", pb.WARNING, "Cooling fan relay circuit malfunction"),
    ("P0A80", pb.CRITICAL_SEVERITY, "Replace hybrid/EV battery pack"),
    ("U0100", pb.CRITICAL_SEVERITY, "Lost communication with ECM/PCM"),
    ("B1234", pb.WARNING, "Climate control sensor fault"),
    ("P0562", pb.WARNING, "System voltage low"),
    ("P0AA6", pb.CRITICAL_SEVERITY, "Hybrid battery voltage mismatch"),
]


class ActiveFault:
    def __init__(self, fault_type, duration, data=None):
        self.fault_type = fault_type
        self.remaining = duration
        self.data = data or {}

    def tick(self):
        self.remaining -= 1
        return self.remaining <= 0


class FaultInjector:
    def __init__(self, fault_probability=0.02):
        self.fault_probability = fault_probability
        self.active_faults = {}

    def inject(self, agent):
        vid = agent.vehicle_id
        if vid not in self.active_faults:
            self.active_faults[vid] = []

        if random.random() < self.fault_probability:
            self._new_fault(agent)

        resolved = []
        for fault in self.active_faults[vid]:
            self._apply_fault(agent, fault)
            if fault.tick():
                resolved.append(fault)

        for fault in resolved:
            self.active_faults[vid].remove(fault)
            self._resolve_fault(agent, fault)

    def _new_fault(self, agent):
        vid = agent.vehicle_id
        fault_type = random.choice(["battery_degradation", "sensor_glitch", "overheating", "dtc"])

        if fault_type == "battery_degradation":
            f = ActiveFault("battery_degradation", random.randint(50, 100))
            self.active_faults[vid].append(f)
            print(f"  [FAULT] {vid}: Battery degradation started")

        elif fault_type == "sensor_glitch":
            sensor = random.choice(["battery_temp", "speed", "voltage"])
            f = ActiveFault("sensor_glitch", random.randint(1, 3), {"sensor": sensor})
            self.active_faults[vid].append(f)
            print(f"  [FAULT] {vid}: Sensor glitch on {sensor}")

        elif fault_type == "overheating":
            target = random.choice(["battery", "motor"])
            f = ActiveFault("overheating", random.randint(20, 40), {"target": target})
            self.active_faults[vid].append(f)
            print(f"  [FAULT] {vid}: {target} overheating started")

        elif fault_type == "dtc":
            code, severity, desc = random.choice(DTC_CATALOG)
            existing_codes = [d.code for d in agent.active_dtcs]
            if code not in existing_codes:
                dtc = pb.DiagnosticCode(
                    code=code, severity=severity, description=desc,
                    first_seen=int(time.time() * 1000),
                )
                agent.active_dtcs.append(dtc)
                f = ActiveFault("dtc", random.randint(30, 80), {"code": code})
                self.active_faults[vid].append(f)
                print(f"  [FAULT] {vid}: DTC {code} — {desc}")

    def _apply_fault(self, agent, fault):
        if fault.fault_type == "battery_degradation":
            agent.battery_voltage -= random.uniform(0.05, 0.15)
        elif fault.fault_type == "sensor_glitch":
            s = fault.data["sensor"]
            if s == "battery_temp": agent.battery_temp += random.uniform(15, 30)
            elif s == "speed": agent.speed += random.uniform(50, 100)
            elif s == "voltage": agent.battery_voltage -= random.uniform(20, 50)
        elif fault.fault_type == "overheating":
            if fault.data["target"] == "battery":
                agent.battery_temp += random.uniform(0.5, 1.5)
            else:
                agent.motor_temp += random.uniform(0.5, 1.5)

    def _resolve_fault(self, agent, fault):
        if fault.fault_type == "dtc":
            code = fault.data["code"]
            agent.active_dtcs = [d for d in agent.active_dtcs if d.code != code]
            print(f"  [RESOLVED] {agent.vehicle_id}: DTC {code} cleared")
        else:
            print(f"  [RESOLVED] {agent.vehicle_id}: {fault.fault_type} resolved")
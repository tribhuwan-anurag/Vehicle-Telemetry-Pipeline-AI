import random
import time
import math
import telemetry_pb2 as pb


class VehicleAgent:
    def __init__(self, vehicle_id, start_lat=32.7357, start_lon=-97.1081):
        self.vehicle_id = vehicle_id
        self.battery_soc = random.uniform(60, 100)
        self.battery_voltage = self._soc_to_voltage(self.battery_soc)
        self.battery_temp = random.uniform(20, 30)
        self.battery_current = 0.0
        self.speed = 0.0
        self.motor_rpm = 0
        self.motor_temp = random.uniform(20, 30)
        self.throttle = 0.0
        self.regen_braking = False
        self.latitude = start_lat
        self.longitude = start_lon
        self.heading = random.uniform(0, 360)
        self.state = pb.PARKED
        self.active_dtcs = []
        self.ticks_in_state = 0

    @staticmethod
    def _soc_to_voltage(soc):
        return 320 + (soc / 100) * 83

    @staticmethod
    def _clamp(value, lo, hi):
        return max(lo, min(hi, value))

    def _maybe_transition(self):
        self.ticks_in_state += 1
        if self.state == pb.PARKED:
            if self.battery_soc < 40 and random.random() < 0.15:
                self.state = pb.CHARGING
                self.ticks_in_state = 0
            elif self.battery_soc > 20 and random.random() < 0.10:
                self.state = pb.DRIVING
                self.ticks_in_state = 0
        elif self.state == pb.DRIVING:
            if self.battery_soc < 5:
                self.state = pb.PARKED
                self.ticks_in_state = 0
            elif random.random() < 0.05:
                self.state = pb.PARKED
                self.ticks_in_state = 0
        elif self.state == pb.CHARGING:
            if self.battery_soc >= 95:
                self.state = pb.PARKED
                self.ticks_in_state = 0

    def _update_parked(self):
        self.battery_soc -= 0.01
        self.battery_temp += (25 - self.battery_temp) * 0.02
        self.motor_temp += (25 - self.motor_temp) * 0.05
        self.speed = 0
        self.motor_rpm = 0
        self.throttle = 0
        self.regen_braking = False
        self.battery_current = -0.5

    def _update_driving(self):
        self.throttle = self._clamp(self.throttle + random.uniform(-10, 10), 10, 95)
        target_speed = self.throttle * 1.3
        self.speed += (target_speed - self.speed) * 0.3 + random.uniform(-3, 3)
        self.speed = self._clamp(self.speed, 0, 130)
        self.motor_rpm = int(self.speed * 90)
        self.motor_temp = self._clamp(self.motor_temp + random.uniform(0.1, 0.5), 20, 95)
        self.regen_braking = self.throttle < 30 and self.speed > 20
        drain_rate = 0.02 + (self.speed / 130) * 0.12
        if self.regen_braking:
            drain_rate *= 0.6
        self.battery_soc -= drain_rate
        self.battery_soc = self._clamp(self.battery_soc, 0, 100)
        self.battery_current = -(drain_rate * 50)
        self.battery_temp += random.uniform(0.05, 0.2)
        self.battery_temp = self._clamp(self.battery_temp, 10, 60)
        speed_deg = (self.speed / 3600) * 0.009
        self.heading += random.uniform(-15, 15)
        self.heading %= 360
        self.latitude += speed_deg * math.cos(math.radians(self.heading))
        self.longitude += speed_deg * math.sin(math.radians(self.heading))

    def _update_charging(self):
        self.battery_soc = self._clamp(self.battery_soc + 0.5, 0, 100)
        self.battery_voltage = self._soc_to_voltage(self.battery_soc)
        self.battery_temp += random.uniform(0.01, 0.1)
        self.battery_temp = self._clamp(self.battery_temp, 10, 50)
        self.battery_current = 150
        self.speed = 0
        self.motor_rpm = 0
        self.throttle = 0
        self.motor_temp += (25 - self.motor_temp) * 0.05
        self.regen_braking = False

    def _assess_health(self):
        if self.battery_temp > 50 or self.battery_voltage < 330:
            return pb.CRITICAL
        if self.battery_temp > 42 or self.battery_soc < 15:
            return pb.DEGRADING
        return pb.HEALTHY

    def tick(self):
        self._maybe_transition()
        if self.state == pb.PARKED:
            self._update_parked()
        elif self.state == pb.DRIVING:
            self._update_driving()
        elif self.state == pb.CHARGING:
            self._update_charging()
        self.battery_voltage = self._soc_to_voltage(self.battery_soc)

        event = pb.TelemetryEvent(
            vehicle_id=self.vehicle_id,
            timestamp=int(time.time() * 1000),
            state=self.state,
            gps=pb.Location(
                latitude=self.latitude,
                longitude=self.longitude,
                speed_kmh=round(self.speed, 2),
                heading=round(self.heading, 2),
            ),
            powertrain=pb.PowertrainState(
                motor_rpm=self.motor_rpm,
                motor_temp=round(self.motor_temp, 2),
                throttle_position=round(self.throttle, 2),
                regen_braking_active=self.regen_braking,
            ),
            battery=pb.BatteryState(
                state_of_charge=round(self.battery_soc, 2),
                voltage=round(self.battery_voltage, 2),
                temperature=round(self.battery_temp, 2),
                current_draw=round(self.battery_current, 2),
                health=self._assess_health(),
            ),
        )
        for dtc in self.active_dtcs:
            event.dtcs.append(dtc)
        return event
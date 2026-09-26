"""
NEER Environment & Trigger Engine Unit Tests
"""

import unittest
import os
import sys
import datetime

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from environment.sources.adapters import get_source_registry, DataSourceRegistry
from environment.normalization.observation import EnvironmentalObservation, normalize_unit
from environment.validation.validator import validate_observation, validate_time_series
from environment.triggers.trigger_engine import TriggerEngine, TriggerRule
from environment.monitoring.monitor import EnvironmentalMonitor

class TestEnvironmentPipeline(unittest.TestCase):

    def setUp(self):
        self.now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        self.stale_iso = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=4)).isoformat()

        self.valid_obs = {
            "location_id": "st-as",
            "latitude": 26.185,
            "longitude": 91.772,
            "parameter": "rainfall",
            "value": 42.5,
            "unit": "mm",
            "observed_at": self.now_iso,
            "source": "IMD-AWS-Guwahati"
        }

    def test_source_adapters_unconnected_state(self):
        registry = DataSourceRegistry()
        health = registry.get_source_health()
        self.assertEqual(len(health), 5)
        for item in health:
            self.assertFalse(item["is_connected"])
            self.assertEqual(item["status_text"], "External data source not connected.")

    def test_unit_normalization(self):
        val_mm, unit_mm = normalize_unit("rainfall", 2.0, "inches")
        self.assertEqual(val_mm, 50.8)
        self.assertEqual(unit_mm, "mm")

        val_c, unit_c = normalize_unit("temperature", 77.0, "degF")
        self.assertEqual(val_c, 25.0)
        self.assertEqual(unit_c, "degC")

    def test_observation_validator_valid(self):
        status, issues = validate_observation(self.valid_obs)
        self.assertEqual(status, "valid")
        self.assertEqual(len(issues), 0)

    def test_observation_validator_stale(self):
        stale_obs = self.valid_obs.copy()
        stale_obs["observed_at"] = self.stale_iso
        status, issues = validate_observation(stale_obs)
        self.assertEqual(status, "stale")
        self.assertTrue(any("stale" in i for i in issues))

    def test_observation_validator_invalid_range(self):
        invalid_obs = self.valid_obs.copy()
        invalid_obs["value"] = -15.0
        status, issues = validate_observation(invalid_obs)
        self.assertEqual(status, "invalid")
        self.assertTrue(any("violates physical limits" in i for i in issues))

    def test_time_series_duplicates_and_out_of_order(self):
        ts_data = [
            {"observed_at": "2026-09-17T02:00:00Z"},
            {"observed_at": "2026-09-17T01:00:00Z"},
            {"observed_at": "2026-09-17T02:00:00Z"}
        ]
        res = validate_time_series(ts_data)
        self.assertFalse(res["is_clean"])
        self.assertEqual(res["duplicates"], 1)
        self.assertEqual(res["out_of_order"], 1)

    def test_trigger_engine_unconfigured_rules(self):
        engine = TriggerEngine()
        res = engine.evaluate_observations({"rainfall": self.valid_obs})
        self.assertEqual(res["overall_trigger_status"], "UNCONFIGURED")
        self.assertTrue(any("Trigger thresholds not configured" in eval_item["message"] for eval_item in res["evaluations"]))

    def test_trigger_engine_configured_rule_evaluation(self):
        engine = TriggerEngine()
        rule = TriggerRule(
            rule_id="TEST-RAIN-01",
            name="Test Rain Trigger",
            parameter="rainfall",
            threshold=30.0,
            unit="mm",
            status="configured"
        )
        engine.rules["TEST-RAIN-01"] = rule
        
        res = engine.evaluate_observations({"rainfall": self.valid_obs})
        self.assertEqual(res["overall_trigger_status"], "TRIGGERED")
        self.assertTrue(any(e["rule_id"] == "TEST-RAIN-01" and e["triggered"] for e in res["evaluations"]))

    def test_4_tier_monitor_architecture(self):
        monitor = EnvironmentalMonitor()
        res = monitor.get_location_monitoring_status(
            location_id="st-as",
            lat=26.185,
            lng=91.772,
            gis_factors={
                "elevation": 120.5, "slope": 4.2, "distance_to_river": 350.0,
                "distance_to_stream": 150.0, "distance_to_road": 400.0,
                "land_cover": "Agricultural Land", "aspect": 185.0, "twi": 11.4,
                "spi": 2.1, "profile_curvature": 0.02, "plan_curvature": -0.01
            },
            telemetry_observations={"rainfall": self.valid_obs}
        )

        self.assertIn("overall_monitoring_status", res)
        self.assertIn("tier_1_susceptibility", res)
        self.assertIn("tier_2_environmental_conditions", res)
        self.assertIn("tier_3_trigger_status", res)
        self.assertEqual(res["tier_2_environmental_conditions"]["status"], "DATA_AVAILABLE")

if __name__ == "__main__":
    unittest.main()

"""
NEER Flood Trigger Engine & Multi-Condition Evaluator
Evaluates hydro-meteorological observations against configured trigger rules.

IMPORTANT: System does NOT hardcode arbitrary uncalibrated scientific thresholds.
Unconfigured rules return: "Trigger thresholds not configured."
"""

import sys
import os
import datetime
from typing import Dict, Any, List, Optional

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

class TriggerRule:
    def __init__(
        self,
        rule_id: str,
        name: str,
        parameter: str,
        threshold: Optional[float] = None,
        unit: Optional[str] = None,
        comparison_operator: str = ">=",
        duration_minutes: Optional[int] = None,
        geographic_scope: str = "district",
        source: str = "awaiting_verified_threshold",
        status: str = "not_configured",
        conditions: Optional[List[Dict[str, Any]]] = None
    ):
        self.rule_id = rule_id
        self.name = name
        self.parameter = parameter
        self.threshold = threshold
        self.unit = unit
        self.comparison_operator = comparison_operator
        self.duration_minutes = duration_minutes
        self.geographic_scope = geographic_scope
        self.source = source
        self.status = status
        self.conditions = conditions or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.rule_id,
            "name": self.name,
            "parameter": self.parameter,
            "threshold": self.threshold,
            "unit": self.unit,
            "comparison_operator": self.comparison_operator,
            "duration_minutes": self.duration_minutes,
            "geographic_scope": self.geographic_scope,
            "source": self.source,
            "status": self.status,
            "conditions": self.conditions,
            "message": "Trigger thresholds not configured." if self.threshold is None and not self.conditions else "Rule configured."
        }

class TriggerEngine:
    def __init__(self):
        self.rules: Dict[str, TriggerRule] = {}
        self._load_default_framework_rules()

    def _load_default_framework_rules(self):
        """Loads framework trigger rule structure awaiting verified thresholds."""
        default_rules = [
            TriggerRule(
                rule_id="TR-RAIN-01",
                name="24-Hour Heavy Rainfall Threshold",
                parameter="rainfall",
                threshold=None,
                unit="mm",
                source="awaiting_verified_threshold",
                status="not_configured"
            ),
            TriggerRule(
                rule_id="TR-RIVER-01",
                name="River Danger Level Breach",
                parameter="river_level",
                threshold=None,
                unit="m",
                source="awaiting_verified_threshold",
                status="not_configured"
            ),
            TriggerRule(
                rule_id="TR-MULTI-01",
                name="Combined Torrential Rain & River Level Rise",
                parameter="multi_condition",
                threshold=None,
                source="awaiting_verified_threshold",
                status="not_configured",
                conditions=[
                    {"parameter": "rainfall", "operator": ">=", "threshold": None},
                    {"parameter": "river_level", "operator": ">=", "threshold": None}
                ]
            ),
            TriggerRule(
                rule_id="TR-MULTI-02",
                name="Rainfall Persistence & High Soil Saturation",
                parameter="multi_condition",
                threshold=None,
                source="awaiting_verified_threshold",
                status="not_configured",
                conditions=[
                    {"parameter": "rainfall_intensity", "operator": ">=", "threshold": None},
                    {"parameter": "soil_moisture", "operator": ">=", "threshold": None}
                ]
            )
        ]
        for r in default_rules:
            self.rules[r.rule_id] = r

    def evaluate_observations(self, observations: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates observations against configured trigger rules.
        """
        evaluated_results = []
        triggered_count = 0
        unconfigured_count = 0

        for r_id, rule in self.rules.items():
            # If threshold is unconfigured / null
            if rule.status == "not_configured" or (rule.threshold is None and not any(c.get("threshold") for c in rule.conditions)):
                unconfigured_count += 1
                evaluated_results.append({
                    "rule_id": rule.rule_id,
                    "name": rule.name,
                    "status": "UNCONFIGURED",
                    "triggered": False,
                    "message": "Trigger thresholds not configured. Awaiting scientific or official calibration."
                })
                continue

            # Evaluate single parameter rule
            if rule.parameter in observations:
                obs_val = observations[rule.parameter].get("value")
                if obs_val is not None and rule.threshold is not None:
                    is_triggered = False
                    if rule.comparison_operator in [">", ">="] and obs_val >= rule.threshold:
                        is_triggered = True
                    elif rule.comparison_operator in ["<", "<="] and obs_val <= rule.threshold:
                        is_triggered = True

                    if is_triggered:
                        triggered_count += 1

                    evaluated_results.append({
                        "rule_id": rule.rule_id,
                        "name": rule.name,
                        "status": "TRIGGERED" if is_triggered else "NORMAL",
                        "triggered": is_triggered,
                        "observed_value": obs_val,
                        "threshold": rule.threshold,
                        "message": f"Observation {obs_val} {rule.unit} surpassed threshold {rule.threshold} {rule.unit}" if is_triggered else "Below threshold."
                    })

        overall_trigger_status = "TRIGGERED" if triggered_count > 0 else ("UNCONFIGURED" if unconfigured_count == len(self.rules) else "NORMAL")

        return {
            "overall_trigger_status": overall_trigger_status,
            "triggered_rules_count": triggered_count,
            "unconfigured_rules_count": unconfigured_count,
            "evaluations": evaluated_results,
            "disclaimer": "Flood trigger evaluation requires verified scientific thresholds configured by authorized hydrology agencies."
        }

_trigger_engine_instance: Optional[TriggerEngine] = None

def get_trigger_engine() -> TriggerEngine:
    global _trigger_engine_instance
    if _trigger_engine_instance is None:
        _trigger_engine_instance = TriggerEngine()
    return _trigger_engine_instance

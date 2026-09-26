"""
NEER Alert Management Engine
Handles alert lifecycle: Draft -> Under Review -> Approved -> Active -> Expired -> Cancelled.
Severity levels: Advisory, Watch, Warning, Emergency.
Geographic targeting: State -> District -> Block -> Village.
"""

import sys
import os
import datetime
from typing import Dict, Any, List, Optional

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

SEVERITY_LEVELS = ["Advisory", "Watch", "Warning", "Emergency"]
ALERT_STATUSES = ["Draft", "Under Review", "Approved", "Active", "Expired", "Cancelled"]
ALERT_TYPES = [
    "environmental_condition",
    "flood_susceptibility",
    "configured_trigger",
    "incident",
    "manual_authority_alert"
]

class Alert:
    def __init__(
        self,
        alert_id: str,
        title: str,
        message: str,
        severity: str,
        alert_type: str,
        state_id: str,
        district_id: Optional[str] = None,
        block_id: Optional[str] = None,
        village_id: Optional[str] = None,
        location_name: str = "Target Area",
        created_by: str = "Authority Admin",
        start_time: Optional[str] = None,
        expiry_time: Optional[str] = None,
        recommended_action: str = "Follow local authority instructions.",
        additional_instructions: str = "",
        status: str = "Draft",
        linked_incident_id: Optional[str] = None
    ):
        self.alert_id = alert_id
        self.title = title
        self.message = message
        self.severity = severity if severity in SEVERITY_LEVELS else "Watch"
        self.alert_type = alert_type if alert_type in ALERT_TYPES else "manual_authority_alert"
        self.state_id = state_id
        self.district_id = district_id
        self.block_id = block_id
        self.village_id = village_id
        self.location_name = location_name
        self.created_by = created_by
        self.created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        self.start_time = start_time or self.created_at
        self.expiry_time = expiry_time or (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)).isoformat()
        self.recommended_action = recommended_action
        self.additional_instructions = additional_instructions
        self.status = status if status in ALERT_STATUSES else "Draft"
        self.linked_incident_id = linked_incident_id

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.alert_id,
            "title": self.title,
            "message": self.message,
            "severity": self.severity,
            "alert_type": self.alert_type,
            "state_id": self.state_id,
            "district_id": self.district_id,
            "block_id": self.block_id,
            "village_id": self.village_id,
            "location_name": self.location_name,
            "created_by": self.created_by,
            "created_at": self.created_at,
            "start_time": self.start_time,
            "expiry_time": self.expiry_time,
            "recommended_action": self.recommended_action,
            "additional_instructions": self.additional_instructions,
            "status": self.status,
            "linked_incident_id": self.linked_incident_id
        }

class AlertEngine:
    def __init__(self):
        self.alerts: Dict[str, Alert] = {}
        self._load_initial_alerts()

    def _load_initial_alerts(self):
        sample_alerts = [
            Alert(
                alert_id="ALT-2026-001",
                title="RED ALERT: River Inundation & Flashflood Warning",
                message="Brahmaputra river level rising rapidly above danger mark. Immediate evacuation advised for low-lying blocks.",
                severity="Emergency",
                alert_type="configured_trigger",
                state_id="st-as",
                district_id="dt-km",
                location_name="Guwahati Metro, Kamrup, Assam",
                created_by="NDMA Regional Command",
                status="Active",
                recommended_action="Relocate to designated multi-purpose flood shelters immediately."
            ),
            Alert(
                alert_id="ALT-2026-002",
                title="ORANGE WATCH: Heavy Rainfall Persistence",
                message="Monsoon precipitation intensity exceeding 45 mm/hr in coastal catchment zones.",
                severity="Watch",
                alert_type="environmental_condition",
                state_id="st-mh",
                district_id="dt-mb",
                location_name="Mumbai Suburban, Maharashtra",
                created_by="State Disaster Authority",
                status="Active",
                recommended_action="Avoid underpasses and low-lying transit corridors."
            )
        ]
        for a in sample_alerts:
            self.alerts[a.alert_id] = a

    def get_alerts_for_area(
        self,
        state_id: str,
        district_id: Optional[str] = None,
        block_id: Optional[str] = None,
        village_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Filters active public alerts targeted to a citizen's geographic area."""
        matched = []
        for alt in self.alerts.values():
            if alt.status != "Active":
                continue

            # Geographic match logic (State -> District -> Block -> Village)
            if alt.state_id != state_id:
                continue

            if alt.district_id and district_id and alt.district_id != district_id:
                continue

            if alt.block_id and block_id and alt.block_id != block_id:
                continue

            if alt.village_id and village_id and alt.village_id != village_id:
                continue

            matched.append(alt.to_dict())

        return matched

_alert_engine_instance: Optional[AlertEngine] = None

def get_alert_engine() -> AlertEngine:
    global _alert_engine_instance
    if _alert_engine_instance is None:
        _alert_engine_instance = AlertEngine()
    return _alert_engine_instance

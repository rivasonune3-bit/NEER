"""
NEER Read-Only Audit Log Store
Records audit events for all authority operations (Alert creation/approval, Incident verification/assignment, Status changes).
"""

import sys
import os
import datetime
from typing import Dict, Any, List, Optional

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

class AuditEvent:
    def __init__(
        self,
        event_id: str,
        user_id: str,
        action: str,
        entity_type: str,
        entity_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.event_id = event_id
        self.user_id = user_id
        self.action = action
        self.entity_type = entity_type
        self.entity_id = entity_id
        self.timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        self.metadata = metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "user_id": self.user_id,
            "action": self.action,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "timestamp": self.timestamp,
            "metadata": self.metadata
        }

class AuditEngine:
    def __init__(self):
        self.events: List[AuditEvent] = []
        self._load_initial_events()

    def _load_initial_events(self):
        sample = [
            AuditEvent(
                event_id="AUD-00001",
                user_id="NDMA Regional Admin",
                action="ALERT_ACTIVATED",
                entity_type="ALERT",
                entity_id="ALT-2026-001",
                metadata={"severity": "Emergency", "target_district": "dt-km"}
            ),
            AuditEvent(
                event_id="AUD-00002",
                user_id="NDMA Dispatcher",
                action="TEAM_ASSIGNED",
                entity_type="INCIDENT",
                entity_id="INC-2026-101",
                metadata={"team_id": "TEAM-NDRF-01", "team_name": "1st NDRF Battalion Alpha Team"}
            )
        ]
        self.events.extend(sample)

    def log_event(self, user_id: str, action: str, entity_type: str, entity_id: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        evt_id = f"AUD-{len(self.events) + 1:05d}"
        evt = AuditEvent(
            event_id=evt_id,
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata=metadata
        )
        self.events.append(evt)
        return evt.to_dict()

    def get_audit_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        return [e.to_dict() for e in reversed(self.events[-limit:])]

_audit_engine_instance: Optional[AuditEngine] = None

def get_audit_engine() -> AuditEngine:
    global _audit_engine_instance
    if _audit_engine_instance is None:
        _audit_engine_instance = AuditEngine()
    return _audit_engine_instance

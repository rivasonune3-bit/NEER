"""
NEER Incident Management Engine
Manages incident lifecycle: Reported -> Verified -> Assigned -> In Progress -> Resolved -> Closed -> Rejected.
Tracks priority: Low, Medium, High, Critical.
Records timeline history: user, timestamp, previous_status, new_status, note.
"""

import sys
import os
import datetime
from typing import Dict, Any, List, Optional

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

INCIDENT_STATUSES = ["Reported", "Verified", "Assigned", "In Progress", "Resolved", "Closed", "Rejected"]
INCIDENT_PRIORITIES = ["Low", "Medium", "High", "Critical"]
INCIDENT_TYPES = ["Flooding", "Water level rise", "Road blockage", "Landslide", "Infrastructure damage", "Other"]

class IncidentTimelineEntry:
    def __init__(self, user: str, previous_status: str, new_status: str, note: str = ""):
        self.user = user
        self.timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        self.previous_status = previous_status
        self.new_status = new_status
        self.note = note

    def to_dict(self) -> Dict[str, Any]:
        return {
            "user": self.user,
            "timestamp": self.timestamp,
            "previous_status": self.previous_status,
            "new_status": self.new_status,
            "note": self.note
        }

class Incident:
    def __init__(
        self,
        incident_id: str,
        title: str,
        description: str,
        incident_type: str,
        location_name: str,
        latitude: float,
        longitude: float,
        reported_by: str,
        reported_phone: str = "",
        priority: str = "Medium",
        status: str = "Reported",
        assigned_team_id: Optional[str] = None,
        assigned_team_name: Optional[str] = None,
        linked_alert_id: Optional[str] = None,
        internal_notes: str = ""
    ):
        self.incident_id = incident_id
        self.title = title
        self.description = description
        self.incident_type = incident_type if incident_type in INCIDENT_TYPES else "Other"
        self.location_name = location_name
        self.latitude = latitude
        self.longitude = longitude
        self.reported_by = reported_by
        self.reported_phone = reported_phone
        self.reported_time = datetime.datetime.now(datetime.timezone.utc).isoformat()
        self.priority = priority if priority in INCIDENT_PRIORITIES else "Medium"
        self.status = status if status in INCIDENT_STATUSES else "Reported"
        self.assigned_team_id = assigned_team_id
        self.assigned_team_name = assigned_team_name
        self.linked_alert_id = linked_alert_id
        self.internal_notes = internal_notes
        self.created_at = self.reported_time
        self.updated_at = self.reported_time
        self.timeline: List[IncidentTimelineEntry] = [
            IncidentTimelineEntry(user=reported_by, previous_status="None", new_status=self.status, note="Incident reported")
        ]

    def update_status(self, new_status: str, user: str, note: str = ""):
        if new_status in INCIDENT_STATUSES:
            prev = self.status
            self.status = new_status
            self.updated_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
            self.timeline.append(IncidentTimelineEntry(user=user, previous_status=prev, new_status=new_status, note=note))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.incident_id,
            "title": self.title,
            "description": self.description,
            "incident_type": self.incident_type,
            "location_name": self.location_name,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "reported_by": self.reported_by,
            "reported_phone": self.reported_phone,
            "reported_time": self.reported_time,
            "priority": self.priority,
            "status": self.status,
            "assigned_team_id": self.assigned_team_id,
            "assigned_team_name": self.assigned_team_name,
            "linked_alert_id": self.linked_alert_id,
            "internal_notes": self.internal_notes,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "timeline": [t.to_dict() for t in self.timeline]
        }

class IncidentEngine:
    def __init__(self):
        self.incidents: Dict[str, Incident] = {}
        self._load_initial_incidents()

    def _load_initial_incidents(self):
        sample_incidents = [
            Incident(
                incident_id="INC-2026-101",
                title="Severe Street Inundation & Trapped Households",
                description="Floodwater levels reached 1.5m in Pandu Ward 12. 18 households stranded on rooftops.",
                incident_type="Flooding",
                location_name="Pandu, Guwahati, Assam",
                latitude=26.175,
                longitude=91.712,
                reported_by="Resident Rahul Sharma",
                reported_phone="+91 98640 12345",
                priority="Critical",
                status="Assigned",
                assigned_team_id="TEAM-NDRF-01",
                assigned_team_name="1st NDRF Battalion Alpha Team",
                linked_alert_id="ALT-2026-001"
            ),
            Incident(
                incident_id="INC-2026-102",
                title="Embankment Soil Erosion & Road Culvert Washout",
                description="Riverbank culvert collapsed near NH-37, blocking emergency relief transport.",
                incident_type="Infrastructure damage",
                location_name="Khanapara, Kamrup, Assam",
                latitude=26.120,
                longitude=91.810,
                reported_by="Local Transport Watch",
                reported_phone="+91 94350 99887",
                priority="High",
                status="Reported"
            )
        ]
        for inc in sample_incidents:
            self.incidents[inc.incident_id] = inc

_incident_engine_instance: Optional[IncidentEngine] = None

def get_incident_engine() -> IncidentEngine:
    global _incident_engine_instance
    if _incident_engine_instance is None:
        _incident_engine_instance = IncidentEngine()
    return _incident_engine_instance

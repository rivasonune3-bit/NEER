"""
NEER Response Team Management & Dispatch Assignment Engine
Tracks team availability: Available, Assigned, Busy, Offline.
Handles assignments with availability verification and authority override support.
Updates team progress: Accepted, En Route, On Site, Assistance Provided, Completed.
"""

import sys
import os
import datetime
from typing import Dict, Any, List, Optional

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

TEAM_STATUSES = ["Available", "Assigned", "Busy", "Offline"]
PROGRESS_STATUSES = ["Accepted", "En Route", "On Site", "Assistance Provided", "Completed"]

import math

class ResponseTeam:
    def __init__(
        self,
        team_id: str,
        name: str,
        team_type: str,
        leader_name: str,
        contact_phone: str,
        base_location: str,
        status: str = "Available",
        lat: float = 26.1850,
        lng: float = 91.7720,
        assigned_incident_id: Optional[str] = None,
        progress_status: Optional[str] = None
    ):
        self.team_id = team_id
        self.name = name
        self.team_type = team_type
        self.leader_name = leader_name
        self.contact_phone = contact_phone
        self.base_location = base_location
        self.status = status if status in TEAM_STATUSES else "Available"
        self.lat = lat
        self.lng = lng
        self.assigned_incident_id = assigned_incident_id
        self.progress_status = progress_status

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.team_id,
            "name": self.name,
            "type": self.team_type,
            "leader_name": self.leader_name,
            "contact_phone": self.contact_phone,
            "base_location": self.base_location,
            "status": self.status,
            "lat": self.lat,
            "lng": self.lng,
            "assigned_incident_id": self.assigned_incident_id,
            "progress_status": self.progress_status
        }

def calculate_haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculates straight-line spherical distance in km between two coordinates."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

class ResponseTeamsEngine:
    def __init__(self):
        self.teams: Dict[str, ResponseTeam] = {}
        self._load_initial_teams()

    def _load_initial_teams(self):
        sample_teams = [
            ResponseTeam(
                team_id="TEAM-NDRF-01",
                name="1st NDRF Battalion Alpha Team",
                team_type="NDRF",
                leader_name="Cmdt. S. K. Das",
                contact_phone="+91 94351 00101",
                base_location="Patgaon Base, Guwahati",
                status="Assigned",
                lat=26.112, lng=91.605,
                assigned_incident_id="INC-2026-101",
                progress_status="En Route"
            ),
            ResponseTeam(
                team_id="TEAM-SDRF-02",
                name="Assam SDRF Water Rescue Unit 2",
                team_type="SDRF",
                leader_name="Inspector M. Boro",
                contact_phone="+91 94351 00202",
                base_location="Dispur Station, Guwahati",
                status="Available",
                lat=26.142, lng=91.789
            ),
            ResponseTeam(
                team_id="TEAM-FIRE-03",
                name="State Fire & Emergency Service Boat Crew",
                team_type="Fire & Rescue",
                leader_name="Station Officer P. Gogoi",
                contact_phone="+91 94351 00303",
                base_location="Panbazar Station, Guwahati",
                status="Available",
                lat=26.188, lng=91.745
            ),
            ResponseTeam(
                team_id="TEAM-MED-04",
                name="Rapid Medical Relief Force Team 1",
                team_type="Medical Unit",
                leader_name="Dr. A. Saikia",
                contact_phone="+91 94351 00404",
                base_location="GMCH Command, Guwahati",
                status="Busy",
                lat=26.155, lng=91.770
            )
        ]
        for t in sample_teams:
            self.teams[t.team_id] = t

    def find_nearby_teams(
        self,
        incident_lat: float,
        incident_lng: float,
        max_distance_km: float = 50.0
    ) -> List[Dict[str, Any]]:
        """
        Calculates straight-line distances to registered teams and ranks suitable candidates.
        Clearly labels distance calculation method as STRAIGHT_LINE_FALLBACK.
        """
        recommendations = []
        for team in self.teams.values():
            dist_km = calculate_haversine_distance(incident_lat, incident_lng, team.lat, team.lng)
            if dist_km <= max_distance_km:
                team_data = team.to_dict()
                team_data["straight_line_distance_km"] = dist_km
                team_data["distance_calculation_method"] = "STRAIGHT_LINE_FALLBACK"
                team_data["road_network_routing_status"] = "AWAITING_OSM_ROUTING_NETWORK"
                team_data["is_recommended"] = (team.status == "Available")
                recommendations.append(team_data)

        recommendations.sort(key=lambda x: (not x["is_recommended"], x["straight_line_distance_km"]))
        return recommendations

    def assign_team(self, team_id: str, incident_id: str, authority_user: str, override: bool = False) -> Dict[str, Any]:
        if team_id not in self.teams:
            return {"success": False, "message": f"Response team '{team_id}' not found."}

        team = self.teams[team_id]
        if team.status != "Available" and not override:
            return {
                "success": False,
                "message": f"Team '{team.name}' is currently '{team.status}'. Assignment requires explicit authority override.",
                "current_status": team.status
            }

        team.status = "Assigned"
        team.assigned_incident_id = incident_id
        team.progress_status = "Accepted"

        return {
            "success": True,
            "message": f"Team '{team.name}' assigned to Incident '{incident_id}'.",
            "team": team.to_dict()
        }

    def update_progress(self, team_id: str, progress_status: str) -> Dict[str, Any]:
        if team_id not in self.teams:
            return {"success": False, "message": f"Response team '{team_id}' not found."}

        if progress_status not in PROGRESS_STATUSES:
            return {"success": False, "message": f"Invalid progress status '{progress_status}'. Allowed: {PROGRESS_STATUSES}"}

        team = self.teams[team_id]
        team.progress_status = progress_status

        if progress_status == "Completed":
            team.status = "Available"
            team.assigned_incident_id = None

        return {
            "success": True,
            "message": f"Progress updated to '{progress_status}'.",
            "team": team.to_dict()
        }

_teams_engine_instance: Optional[ResponseTeamsEngine] = None

def get_teams_engine() -> ResponseTeamsEngine:
    global _teams_engine_instance
    if _teams_engine_instance is None:
        _teams_engine_instance = ResponseTeamsEngine()
    return _teams_engine_instance

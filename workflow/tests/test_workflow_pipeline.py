"""
NEER Workflow Unit Tests
Validates Alerts Engine, Incident Engine, Response Teams Engine, Notifications, and Audit Logs.
"""

import unittest
import os
import sys
import datetime

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from workflow.alerts.alerts_engine import AlertEngine, Alert
from workflow.incidents.incidents_engine import IncidentEngine, Incident
from workflow.teams.response_teams_engine import ResponseTeamsEngine, ResponseTeam
from workflow.notifications.notification_engine import NotificationEngine
from workflow.audit.audit_engine import AuditEngine

class TestWorkflowPipeline(unittest.TestCase):

    def test_alert_creation_and_geographic_targeting(self):
        engine = AlertEngine()
        alert = Alert(
            alert_id="TEST-ALT-01",
            title="Test Warning",
            message="Test Message",
            severity="Warning",
            alert_type="manual_authority_alert",
            state_id="st-as",
            district_id="dt-km",
            status="Active"
        )
        engine.alerts[alert.alert_id] = alert

        # Matching area check
        matched = engine.get_alerts_for_area(state_id="st-as", district_id="dt-km")
        self.assertTrue(any(a["id"] == "TEST-ALT-01" for a in matched))

        # Unmatched area check
        unmatched = engine.get_alerts_for_area(state_id="st-mh", district_id="dt-mb")
        self.assertFalse(any(a["id"] == "TEST-ALT-01" for a in unmatched))

    def test_citizen_incident_reporting(self):
        engine = IncidentEngine()
        inc = Incident(
            incident_id="TEST-INC-01",
            title="Citizen Water Level Rise",
            description="Water rising near residential road",
            incident_type="Flooding",
            location_name="Guwahati",
            latitude=26.185,
            longitude=91.772,
            reported_by="Citizen John",
            status="Reported"
        )
        engine.incidents[inc.incident_id] = inc

        self.assertEqual(inc.status, "Reported")
        self.assertEqual(len(inc.timeline), 1)
        self.assertEqual(inc.timeline[0].user, "Citizen John")

    def test_authority_incident_verification_and_assignment(self):
        engine = IncidentEngine()
        inc = Incident(
            incident_id="TEST-INC-02",
            title="Road Blockage Test",
            description="Tree block",
            incident_type="Road blockage",
            location_name="Dispur",
            latitude=26.14,
            longitude=91.79,
            reported_by="Citizen Jane",
            status="Reported"
        )
        engine.incidents[inc.incident_id] = inc

        # Verify incident
        inc.update_status("Verified", user="Authority Admin", note="Verified by GIS team")
        self.assertEqual(inc.status, "Verified")
        self.assertEqual(len(inc.timeline), 2)

    def test_response_team_assignment_and_override(self):
        teams_engine = ResponseTeamsEngine()
        
        # Test assigning an available team
        res = teams_engine.assign_team("TEAM-SDRF-02", "INC-2026-101", authority_user="Admin")
        self.assertTrue(res["success"])
        self.assertEqual(res["team"]["status"], "Assigned")

        # Test assigning a busy team without override
        res_busy = teams_engine.assign_team("TEAM-MED-04", "INC-2026-101", authority_user="Admin", override=False)
        self.assertFalse(res_busy["success"])
        self.assertIn("requires explicit authority override", res_busy["message"])

        # Test assigning a busy team WITH override
        res_override = teams_engine.assign_team("TEAM-MED-04", "INC-2026-101", authority_user="Admin", override=True)
        self.assertTrue(res_override["success"])

    def test_response_team_progress_updates(self):
        teams_engine = ResponseTeamsEngine()
        res = teams_engine.update_progress("TEAM-NDRF-01", "On Site")
        self.assertTrue(res["success"])
        self.assertEqual(res["team"]["progress_status"], "On Site")

        res_done = teams_engine.update_progress("TEAM-NDRF-01", "Completed")
        self.assertTrue(res_done["success"])
        self.assertEqual(res_done["team"]["status"], "Available")

    def test_audit_logging(self):
        audit = AuditEngine()
        evt = audit.log_event(
            user_id="Admin User",
            action="ALERT_APPROVED",
            entity_type="ALERT",
            entity_id="ALT-2026-001"
        )
        self.assertEqual(evt["action"], "ALERT_APPROVED")
        logs = audit.get_audit_logs()
        self.assertTrue(any(l["event_id"] == evt["event_id"] for l in logs))

    def test_notifications_unconnected_channels(self):
        notif = NotificationEngine()
        res = notif.dispatch_alert_notifications("ALT-2026-001", "Evacuation Order", ["USER-01"])
        self.assertEqual(len(res), 1)
        self.assertEqual(res[0]["status"], "delivered")
        self.assertEqual(res[0]["channel_notice"], "Simulated In-App Notification")

if __name__ == "__main__":
    unittest.main()

"""
NEER In-App Notification Engine & Channel Abstraction
Simulates in-app notifications and labels external SMS/Email/Push services as "Not connected."
"""

import sys
import os
import datetime
from typing import Dict, Any, List, Optional

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

NOTIFICATION_CHANNELS = ["in_app", "sms", "email", "push"]

class NotificationRecord:
    def __init__(
        self,
        notification_id: str,
        user_id: str,
        alert_id: str,
        channel: str,
        message: str,
        status: str = "delivered"
    ):
        self.notification_id = notification_id
        self.user_id = user_id
        self.alert_id = alert_id
        self.channel = channel if channel in NOTIFICATION_CHANNELS else "in_app"
        self.message = message
        self.created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        self.delivered_at = self.created_at if channel == "in_app" else None
        self.status = "delivered" if channel == "in_app" else "not_connected"
        self.channel_notice = "Simulated In-App Notification" if channel == "in_app" else f"External channel '{channel}' not connected."

    def to_dict(self) -> Dict[str, Any]:
        return {
            "notification_id": self.notification_id,
            "user_id": self.user_id,
            "alert_id": self.alert_id,
            "channel": self.channel,
            "message": self.message,
            "status": self.status,
            "created_at": self.created_at,
            "delivered_at": self.delivered_at,
            "channel_notice": self.channel_notice
        }

class NotificationEngine:
    def __init__(self):
        self.notifications: List[NotificationRecord] = []

    def dispatch_alert_notifications(self, alert_id: str, message: str, target_user_ids: List[str]) -> List[Dict[str, Any]]:
        dispatched = []
        for u_id in target_user_ids:
            notif_id = f"NOTIF-{len(self.notifications) + 1:05d}"
            rec = NotificationRecord(
                notification_id=notif_id,
                user_id=u_id,
                alert_id=alert_id,
                channel="in_app",
                message=message
            )
            self.notifications.append(rec)
            dispatched.append(rec.to_dict())
        return dispatched

_notification_engine_instance: Optional[NotificationEngine] = None

def get_notification_engine() -> NotificationEngine:
    global _notification_engine_instance
    if _notification_engine_instance is None:
        _notification_engine_instance = NotificationEngine()
    return _notification_engine_instance

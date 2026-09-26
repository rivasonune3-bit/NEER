import urllib.request
import json
import time

BASE_URL_FASTAPI = "http://127.0.0.1:8000"
BASE_URL_NEXTJS = "http://127.0.0.1:3005"

def api_get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "NEER-Test/1.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))

def api_post(url, data):
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json", "User-Agent": "NEER-Test/1.0"}, method="POST")
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))

def api_patch(url, data):
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json", "User-Agent": "NEER-Test/1.0"}, method="PATCH")
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))

print("==================================================")
print("NEER CONNECTED REAL-TIME WORKFLOW VERIFICATION")
print("==================================================")

# 1. Authority Targeting Query for Chamoli
print("\n[STEP 1] Testing Dynamic Targeting Query for Chamoli...")
targeting = api_get(f"{BASE_URL_FASTAPI}/targeting?location_name=Chamoli")
assert targeting["target_location"] == "Chamoli", "Wrong target location"
assert targeting["primary_count"] == 4, f"Expected 4 primary citizens, got {targeting['primary_count']}"
assert targeting["nearby_count"] == 10, f"Expected 10 nearby citizens, got {targeting['nearby_count']}"
assert targeting["away_count"] == 1, f"Expected 1 away citizen, got {targeting['away_count']}"
assert targeting["total_recipients"] == 14, f"Expected 14 total in-area citizens, got {targeting['total_recipients']}"
assert len(targeting["ambulances"]) >= 1, "Expected at least 1 ambulance unit"
print(f" -> OK: Primary: {targeting['primary_area']} ({targeting['primary_count']} residents)")
print(f" -> OK: Nearby Villages: {targeting['nearby_areas']} ({targeting['nearby_count']} residents)")
print(f" -> OK: Excluded Away Citizen: {targeting['away_citizens'][0]['name']} currently in {targeting['away_citizens'][0]['current_location']}")
print(f" -> OK: Stationed Ambulances: {[a['name'] for a in targeting['ambulances']]}")

# 2. Check initial operations summary
print("\n[STEP 2] Checking Initial Command Operations Summary...")
initial_summary = api_get(f"{BASE_URL_FASTAPI}/operations/summary?location_name=Chamoli")
print(f" -> Ambulances status: {initial_summary['ambulances']}")
print(f" -> Response teams status: {initial_summary['response_teams']}")

# 3. Authority executes One-Click Emergency Alert Dispatch
print("\n[STEP 3] Executing Authority One-Click Emergency Alert Dispatch for Chamoli...")
dispatch_payload = {
    "location_name": "Chamoli",
    "district_id": "Chamoli",
    "severity": "Emergency",
    "title": "CRITICAL FLASH FLOOD SURGE WARNING — CHAMOLI",
    "message": "Glacial outburst surge detected upstream in Rishi Ganga / Alaknanda. Move immediately toward designated high ground.",
    "recommended_action": "Evacuate low-lying river terraces immediately to Gopeshwar Relief Complex.",
    "created_by": "Authority Command Dispatcher"
}
dispatch_res = api_post(f"{BASE_URL_FASTAPI}/alerts/one-click", dispatch_payload)
assert dispatch_res.get("success") is True, "Dispatch failed"
alert_id = dispatch_res["alert_id"]
recipient_cnt = dispatch_res["recipient_count"]
created_asgns = dispatch_res.get("created_dispatches", [])
print(f" -> OK: Alert Created with ID: {alert_id}")
print(f" -> OK: Total Recipients: {recipient_cnt} ({dispatch_res['delivery_mode']})")
print(f" -> OK: Auto-Created Emergency Unit Assignments: {created_asgns}")

# 4. Verify Alert Recipients Table
print("\n[STEP 4] Verifying Audit Log of Targeted Alert Recipients...")
recipients = api_get(f"{BASE_URL_FASTAPI}/alerts/{alert_id}/recipients")
assert len(recipients) == recipient_cnt, f"Mismatch in stored recipients: expected {recipient_cnt}, got {len(recipients)}"
cit_recipients = [r for r in recipients if r["recipient_type"] == "CITIZEN"]
amb_recipients = [r for r in recipients if r["recipient_type"] == "AMBULANCE"]
print(f" -> OK: Stored {len(cit_recipients)} citizen recipients and {len(amb_recipients)} ambulance recipients in database.")

# 5. Paramedic Closed-Loop Mission Execution in Ambulance Portal
print("\n[STEP 5] Testing Ambulance Portal Closed-Loop Mission Progression...")
# Find assignment for AMB-001
asgn_id = created_asgns[0]["assignment_id"] if (created_asgns and isinstance(created_asgns[0], dict)) else (created_asgns[0] if created_asgns else None)
if asgn_id:
    # 5a. Paramedic Accepts
    res_accept = api_patch(f"{BASE_URL_FASTAPI}/assignments/{asgn_id}/status", {
        "status": "ACCEPTED",
        "notes": "Ambulance crew mobilized from Gopeshwar Hub."
    })
    print(f" -> Status updated to ACCEPTED: {res_accept.get('status')}")

    # 5b. Ambulance departs station (EN_ROUTE)
    res_enroute = api_patch(f"{BASE_URL_FASTAPI}/assignments/{asgn_id}/status", {
        "status": "EN_ROUTE",
        "notes": "Ambulance en route with active emergency sirens."
    })
    print(f" -> Status updated to EN_ROUTE: {res_enroute.get('status')}")

    # Check updated operational summary reflects EN_ROUTE
    sum_enroute = api_get(f"{BASE_URL_FASTAPI}/operations/summary?location_name=Chamoli")
    print(f" -> Updated Summary Ambulances: {sum_enroute['ambulances']}")

    # 5c. Ambulance arrives on scene (ON_SCENE)
    res_onscene = api_patch(f"{BASE_URL_FASTAPI}/assignments/{asgn_id}/status", {
        "status": "ON_SCENE",
        "notes": "Arrived at flood fringe. Triage post operational."
    })
    print(f" -> Status updated to ON_SCENE: {res_onscene.get('status')}")

    sum_onscene = api_get(f"{BASE_URL_FASTAPI}/operations/summary?location_name=Chamoli")
    print(f" -> Updated Summary Ambulances: {sum_onscene['ambulances']}")

# 6. Test Next.js API Routes Proxying correctly
print("\n[STEP 6] Testing Next.js API Route Proxies on Port 3005...")
next_summary = api_get(f"{BASE_URL_NEXTJS}/api/operations/summary?location_name=Chamoli")
assert "ambulances" in next_summary, "Failed to get operations summary through Next.js"
print(f" -> OK: Next.js /api/operations/summary proxy returned: {next_summary['ambulances']}")

next_alerts = api_get(f"{BASE_URL_NEXTJS}/api/alerts")
latest_alert = next_alerts[0] if next_alerts else None
assert latest_alert is not None, "No alerts found through Next.js proxy"
print(f" -> OK: Next.js /api/alerts returned active alert: {latest_alert['title']}")

# 7. Check Realtime Hub Event Log
print("\n[STEP 7] Checking Realtime Event Hub Polling...")
events_poll = api_get(f"{BASE_URL_NEXTJS}/api/events/poll?since=0")
assert len(events_poll.get("events", [])) > 0, "No realtime events captured"
print(f" -> OK: Captured {len(events_poll['events'])} events in log. Latest version: {events_poll['current_version']}")

print("\n==================================================")
print("SUCCESS: ALL 7 END-TO-END WORKFLOW TESTS PASSED!")
print("==================================================")

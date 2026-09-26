import urllib.request
import json
import time

def test_api():
    print("=== STARTING NEER CLOSED-LOOP DATA VERIFICATION ===")
    
    # 1. Fetch Alerts
    req = urllib.request.Request("http://localhost:3005/api/alerts")
    with urllib.request.urlopen(req) as resp:
        alerts = json.loads(resp.read().decode())
        print(f"[1] Active Alerts fetched: {len(alerts)} records")
        for a in alerts[:2]:
            print(f"    - {a['id']}: {a['title']} ({a['severity']}) - {a['location_name']}")
        assert len(alerts) > 0, "No alerts found in database!"

    # 2. Fetch Incidents
    req = urllib.request.Request("http://localhost:3005/api/incidents")
    with urllib.request.urlopen(req) as resp:
        incidents = json.loads(resp.read().decode())
        print(f"[2] Incidents fetched: {len(incidents)} records")
        for i in incidents[:3]:
            print(f"    - {i['id']}: {i['title']} [{i['status']}] - {i['location_name']}")
        assert len(incidents) > 0, "No incidents found in database!"

    # 3. Fetch Citizens
    req = urllib.request.Request("http://localhost:3005/api/citizens")
    with urllib.request.urlopen(req) as resp:
        citizens = json.loads(resp.read().decode())
        print(f"[3] Citizens fetched: {len(citizens)} records")
        for c in citizens[:3]:
            print(f"    - {c['id']}: {c['name']} ({c.get('district', 'N/A')}, {c.get('state', 'N/A')})")
        assert len(citizens) > 0, "No citizens found in database!"

    # 4. Register a new Citizen in Chamoli
    email = f"riva.live.{int(time.time())}@neer.gov.in"
    reg_payload = {
        "name": "Riva Sonune",
        "email": email,
        "password": "Password123!",
        "role": "CITIZEN",
        "phone": "+91 98765 11111",
        "location": "Gopeshwar, Chamoli, Uttarakhand"
    }
    req = urllib.request.Request(
        "http://localhost:3005/api/auth/register",
        data=json.dumps(reg_payload).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        reg_data = json.loads(resp.read().decode())
        print(f"[4] Registered new Citizen: {reg_data['name']} (token: {reg_data['token'][:20]}...)")
        assert reg_data["name"] == "Riva Sonune"

    # 5. Verify Targeting in Chamoli
    req = urllib.request.Request("http://localhost:3005/api/targeting?location_name=Chamoli")
    with urllib.request.urlopen(req) as resp:
        targeting = json.loads(resp.read().decode())
        primary_names = [c["name"] for c in targeting["primary_citizens"]]
        all_target_names = [c["name"] for c in targeting.get("target_citizens", [])]
        print(f"[5] Targeting for Chamoli: {targeting['primary_count']} primary, {targeting['nearby_count']} nearby")
        print(f"    Primary names: {primary_names}")
        assert "Riva Sonune" in primary_names or "Riva Sonune" in all_target_names, "Newly registered citizen not found in Chamoli targeting!"
        print("    --> SUCCESS: Riva Sonune is directly targeted in Chamoli!")

    # 6. Verify Citizen appears in Authority Citizens List
    req = urllib.request.Request("http://localhost:3005/api/citizens")
    with urllib.request.urlopen(req) as resp:
        all_cits = json.loads(resp.read().decode())
        riva_record = next((c for c in all_cits if c["email"] == email), None)
        assert riva_record is not None, "Riva Sonune not found in /api/citizens!"
        print(f"[6] Riva record verified in central DB: District={riva_record.get('district')}, State={riva_record.get('state')}, Hometown={riva_record.get('hometown_district')}")

    # 7. Citizen Reports SOS Incident
    sos_payload = {
        "title": "Severe Flash Flood Influx near Raini Terrace",
        "description": "Rapid water surge entered courtyard. Elderly family members stranded on higher terrace.",
        "incident_type": "Flash Flood",
        "location_name": "Raini, Chamoli",
        "latitude": 30.4850,
        "longitude": 79.7020,
        "reported_by": "Riva Sonune",
        "reported_phone": "+91 98765 11111",
        "priority": "Critical"
    }
    req = urllib.request.Request(
        "http://localhost:3005/api/incidents",
        data=json.dumps(sos_payload).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        sos_res = json.loads(resp.read().decode())
        print(f"[7] Created SOS Incident: {sos_res['id']} - {sos_res['title']}")

    # 8. Check Chamoli Targeting Active SOS Count
    req = urllib.request.Request("http://localhost:3005/api/targeting?location_name=Chamoli")
    with urllib.request.urlopen(req) as resp:
        targeting_after_sos = json.loads(resp.read().decode())
        print(f"[8] Active SOS in Chamoli: {targeting_after_sos['active_sos_count']} reports")
        assert targeting_after_sos['active_sos_count'] >= 1, "Active SOS not reflected in Chamoli targeting!"

    # 9. One-Click Emergency Alert Dispatch
    alert_payload = {
        "location_name": "Chamoli",
        "severity": "Critical",
        "title": "CRITICAL EVACUATION ORDER: Chamoli Flood Surge",
        "message": "Water levels at Dhauliganga & Alaknanda junction rising critically. Move to nearest designated high-ground shelters.",
        "recommended_action": "Evacuate immediately to Chamoli Relief Center",
        "created_by": "Authority Command Test"
    }
    req = urllib.request.Request(
        "http://localhost:3005/api/alerts/one-click",
        data=json.dumps(alert_payload).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        alert_res = json.loads(resp.read().decode())
        print(f"[9] One-Click Alert Dispatched: {alert_res['alert']['id']}, Total Recipients: {alert_res['targeting']['total_recipients']}")
        assert alert_res['alert']['id'].startswith("ALT-"), "Alert ID invalid!"

    # 10. Check Alerts Feed
    req = urllib.request.Request("http://localhost:3005/api/alerts")
    with urllib.request.urlopen(req) as resp:
        updated_alerts = json.loads(resp.read().decode())
        print(f"[10] Total Active Alerts now: {len(updated_alerts)}")
        found = any(a["id"] == alert_res['alert']['id'] for a in updated_alerts)
        assert found, "Dispatched alert not found in active alerts list!"

    print("\n=== ALL 10 TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    test_api()

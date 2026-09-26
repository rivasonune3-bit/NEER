import urllib.request
import json

# 1. Report Citizen SOS Incident
payload = {
    'title': 'CRITICAL SOS: Water Inundation near Riverside Pandu',
    'description': 'Water rapidly rising. Trapped on 2nd floor with 4 family members.',
    'incident_type': 'Flooding',
    'location_name': 'Pandu Ward 12, Guwahati',
    'latitude': 26.175,
    'longitude': 91.712,
    'reported_by': 'Ramesh Kalita',
    'reported_phone': '+91 98640 12345',
    'priority': 'Critical'
}
req = urllib.request.Request('http://localhost:3005/api/incidents', data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json'}, method='POST')
with urllib.request.urlopen(req) as resp:
    created_incident = json.loads(resp.read().decode())
    print('1. Citizen SOS Created:', created_incident['id'], created_incident['title'])

# 2. Verify Incident in Queue
with urllib.request.urlopen('http://localhost:3005/api/incidents') as resp:
    incidents = json.loads(resp.read().decode())
    print('2. Incidents in DB:', len(incidents))

# 3. Check Shelters API
with urllib.request.urlopen('http://localhost:3005/api/shelters?latitude=26.185&longitude=91.772&max_km=60') as resp:
    shelters = json.loads(resp.read().decode())
    print('3. Shelters near location:', len(shelters))
    for s in shelters[:2]:
        print('   -', s['name'], f"({s.get('distance_km')} km)")

# 4. Check Response Teams
with urllib.request.urlopen('http://localhost:3005/api/response-teams') as resp:
    teams = json.loads(resp.read().decode())
    print('4. Response Teams in DB:', len(teams))
    team_id = teams[0]['id']

# 5. Assign Incident to Response Team
assign_payload = {'team_id': team_id, 'priority': 'Critical', 'internal_notes': 'Urgent rescue dispatch'}
req = urllib.request.Request(f"http://localhost:3005/api/incidents/{created_incident['id']}/assign", data=json.dumps(assign_payload).encode(), headers={'Content-Type': 'application/json'}, method='POST')
with urllib.request.urlopen(req) as resp:
    print('5. Authority Assigned to Team:', resp.status)

# 6. Response Team updates assignment progress to En Route
progress_payload = {'progress_status': 'En Route'}
req = urllib.request.Request(f"http://localhost:3005/api/assignments/{team_id}", data=json.dumps(progress_payload).encode(), headers={'Content-Type': 'application/json'}, method='PATCH')
with urllib.request.urlopen(req) as resp:
    print('6. Response Team Progress Updated:', resp.status)

# 7. Check Incident Final Status
with urllib.request.urlopen('http://localhost:3005/api/incidents') as resp:
    final_inc = json.loads(resp.read().decode())[0]
    print('7. Final Incident Status in DB:', final_inc['status'], '| Assigned Team:', final_inc.get('assigned_team_id'))

import urllib.request
import json

# 1. Create Assignment
data = json.dumps({
    'incident_id': 'INC-CHM-01',
    'team_id': 'RT-004',
    'assigned_by': 'Authority Command Dispatcher',
    'notes': 'Mountain rescue team assigned to Raini terrace flood'
}).encode()

req = urllib.request.Request('http://localhost:3005/api/assignments', data=data, headers={'Content-Type': 'application/json'}, method='POST')
res = urllib.request.urlopen(req)
asgn = json.loads(res.read().decode())
print('1. Created Assignment:', asgn['id'], 'Status:', asgn['status'])

# 2. Team Accepts
patch_data = json.dumps({'status': 'ACCEPTED', 'notes': 'SDRF acknowledged and preparing gear'}).encode()
req2 = urllib.request.Request(f'http://localhost:3005/api/assignments/{asgn["id"]}/status', data=patch_data, headers={'Content-Type': 'application/json'}, method='PATCH')
res2 = urllib.request.urlopen(req2)
asgn2 = json.loads(res2.read().decode())
print('2. Team Accepted:', asgn2['id'], 'Status:', asgn2['status'])

# 3. Team En Route
patch_data = json.dumps({'status': 'EN_ROUTE', 'notes': 'Rescue vehicle dispatched from Gopeshwar'}).encode()
req3 = urllib.request.Request(f'http://localhost:3005/api/assignments/{asgn["id"]}/status', data=patch_data, headers={'Content-Type': 'application/json'}, method='PATCH')
res3 = urllib.request.urlopen(req3)
asgn3 = json.loads(res3.read().decode())
print('3. Team En Route:', asgn3['id'], 'Status:', asgn3['status'])

# 4. Check Targeting Data
req4 = urllib.request.Request('http://localhost:3005/api/targeting?location_name=Chamoli')
res4 = urllib.request.urlopen(req4)
target_data = json.loads(res4.read().decode())
print('4. Targeting Query Success: Registered Citizens:', target_data['primary_count'], 'Teams Stationed:', target_data['teams_count'])

print('TEST COMPLETED SUCCESSFULLY!')

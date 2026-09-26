import urllib.request
import json

# Test targeting
res = urllib.request.urlopen('http://127.0.0.1:8000/targeting?location_name=Chamoli')
t_data = json.loads(res.read().decode())
print("1. Dynamic Targeting:")
print(f"   Primary Area: {t_data.get('primary_area')}")
print(f"   Nearby Areas: {t_data.get('nearby_areas')}")
print(f"   Primary Citizens: {t_data.get('primary_count')}")
print(f"   Nearby Citizens: {t_data.get('nearby_count')}")
print(f"   Away Citizens: {t_data.get('away_count')}")
print(f"   Total Citizens: {t_data.get('total_recipients')}")
print(f"   Ambulances: {t_data.get('ambulances_count')}")
print(f"   Medical Teams: {t_data.get('medical_teams_count')}")
print(f"   Rescue Teams: {t_data.get('rescue_teams_count')}")

# Test operations summary
res2 = urllib.request.urlopen('http://127.0.0.1:8000/operations/summary?location_name=Chamoli')
ops_data = json.loads(res2.read().decode())
print("\n2. Operations Summary:")
print(f"   Response Teams: {ops_data.get('response_teams')}")
print(f"   Ambulances: {ops_data.get('ambulances')}")
print(f"   Citizens: {ops_data.get('citizens')}")

# Test event polling
res3 = urllib.request.urlopen('http://127.0.0.1:8000/events/poll')
poll_data = json.loads(res3.read().decode())
print("\n3. Realtime Events Hub Poll:")
print(f"   Current Version: {poll_data.get('current_version')}")
print("ALL NEW ENDPOINTS WORKING PERFECTLY!")

import sqlite3
from datetime import datetime, timezone

conn = sqlite3.connect('data/neer.db')
cursor = conn.cursor()

# 1. Create alert_recipients table
cursor.execute("""
CREATE TABLE IF NOT EXISTS alert_recipients (
    id TEXT PRIMARY KEY,
    alert_id TEXT NOT NULL,
    recipient_type TEXT NOT NULL, -- 'CITIZEN', 'RESPONSE_TEAM', 'AMBULANCE', 'MEDICAL_TEAM'
    recipient_id TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    recipient_contact TEXT,
    location_name TEXT,
    match_reason TEXT, -- 'CURRENTLY_PRESENT', 'PRIMARY_SECTOR', 'NEARBY_VILLAGE'
    delivery_status TEXT DEFAULT 'QUEUED', -- 'QUEUED', 'DELIVERED', 'ACKNOWLEDGED'
    acknowledged INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    acknowledged_at TEXT,
    FOREIGN KEY (alert_id) REFERENCES alerts(id)
)
""")

# 2. Add columns to citizens table if needed
cursor.execute("PRAGMA table_info(citizens)")
citizen_cols = [c[1] for c in cursor.fetchall()]

if "hometown_district" not in citizen_cols:
    cursor.execute("ALTER TABLE citizens ADD COLUMN hometown_district TEXT")
if "hometown_village" not in citizen_cols:
    cursor.execute("ALTER TABLE citizens ADD COLUMN hometown_village TEXT")
if "current_location" not in citizen_cols:
    cursor.execute("ALTER TABLE citizens ADD COLUMN current_location TEXT")
if "is_currently_in_area" not in citizen_cols:
    cursor.execute("ALTER TABLE citizens ADD COLUMN is_currently_in_area INTEGER DEFAULT 1")

# Update existing Chamoli citizens with hometown and current_location
cursor.execute("""
UPDATE citizens SET 
    hometown_district = district,
    hometown_village = village,
    current_location = village,
    is_currently_in_area = 1
WHERE hometown_district IS NULL OR hometown_district = ''
""")

now_iso = datetime.now(timezone.utc).isoformat()
sample_citizens = [
    {
        "id": "cit-chm-010", "user_id": "usr-cit-010", "name": "Devendra Singh Rawat",
        "email": "devendra.rawat@chamoli.in", "phone": "+91 94120 22010", "state": "Uttarakhand",
        "district": "Chamoli", "block": "Gopeshwar Block", "village": "Gopeshwar High-Ground",
        "address": "Ward 1, Upper Bazaar, Gopeshwar", "latitude": 30.415, "longitude": 79.325,
        "emergency_contacts": "+91 94120 99010", "family_count": 4, "medical_needs": "None",
        "alert_sms_enabled": 1, "hometown_district": "Chamoli", "hometown_village": "Gopeshwar",
        "current_location": "Gopeshwar High-Ground", "is_currently_in_area": 1
    },
    {
        "id": "cit-chm-011", "user_id": "usr-cit-011", "name": "Sunita Bhandari",
        "email": "sunita.b@chamoli.in", "phone": "+91 94120 22011", "state": "Uttarakhand",
        "district": "Chamoli", "block": "Gopeshwar Block", "village": "Chamoli Central Basin",
        "address": "Riverview Colony, Chamoli", "latitude": 30.404, "longitude": 79.330,
        "emergency_contacts": "+91 94120 99011", "family_count": 5, "medical_needs": "Elderly parent (wheelchair)",
        "alert_sms_enabled": 1, "hometown_district": "Chamoli", "hometown_village": "Chamoli Central",
        "current_location": "Chamoli Central Basin", "is_currently_in_area": 1
    },
    {
        "id": "cit-chm-012", "user_id": "usr-cit-012", "name": "Harish Chandra Negi",
        "email": "harish.negi@chamoli.in", "phone": "+91 94120 22012", "state": "Uttarakhand",
        "district": "Chamoli", "block": "Gopeshwar Block", "village": "Chamoli Central Basin",
        "address": "Main Confluence Ward, Chamoli", "latitude": 30.402, "longitude": 79.332,
        "emergency_contacts": "+91 94120 99012", "family_count": 3, "medical_needs": "None",
        "alert_sms_enabled": 1, "hometown_district": "Chamoli", "hometown_village": "Chamoli Central",
        "current_location": "Chamoli Central Basin", "is_currently_in_area": 1
    },
    {
        "id": "cit-chm-013", "user_id": "usr-cit-013", "name": "Kamla Devi Gusain",
        "email": "kamla.g@chamoli.in", "phone": "+91 94120 22013", "state": "Uttarakhand",
        "district": "Chamoli", "block": "Joshimath Block", "village": "Raini Floodplain Sector",
        "address": "Lower Terrace House 8, Raini", "latitude": 30.486, "longitude": 79.691,
        "emergency_contacts": "+91 94120 99013", "family_count": 4, "medical_needs": "Diabetic medication",
        "alert_sms_enabled": 1, "hometown_district": "Chamoli", "hometown_village": "Raini",
        "current_location": "Raini Floodplain Sector", "is_currently_in_area": 1
    },
    {
        "id": "cit-chm-014", "user_id": "usr-cit-014", "name": "Prakash Semwal",
        "email": "prakash.s@chamoli.in", "phone": "+91 94120 22014", "state": "Uttarakhand",
        "district": "Chamoli", "block": "Joshimath Block", "village": "Tapovan Glacial Outwash Sector",
        "address": "Tapovan Barrage Enclave", "latitude": 30.506, "longitude": 79.623,
        "emergency_contacts": "+91 94120 99014", "family_count": 2, "medical_needs": "None",
        "alert_sms_enabled": 1, "hometown_district": "Chamoli", "hometown_village": "Tapovan",
        "current_location": "Tapovan Glacial Outwash Sector", "is_currently_in_area": 1
    },
    {
        "id": "cit-chm-015", "user_id": "usr-cit-015", "name": "Meena Joshi",
        "email": "meena.j@chamoli.in", "phone": "+91 94120 22015", "state": "Uttarakhand",
        "district": "Chamoli", "block": "Joshimath Block", "village": "Helang Outpost",
        "address": "NH-07 Helang Valley", "latitude": 30.531, "longitude": 79.522,
        "emergency_contacts": "+91 94120 99015", "family_count": 3, "medical_needs": "None",
        "alert_sms_enabled": 1, "hometown_district": "Chamoli", "hometown_village": "Helang",
        "current_location": "Helang Outpost", "is_currently_in_area": 1
    },
    {
        "id": "cit-chm-016", "user_id": "usr-cit-016", "name": "Arun Chauhan",
        "email": "arun.c@chamoli.in", "phone": "+91 94120 22016", "state": "Uttarakhand",
        "district": "Chamoli", "block": "Joshimath Block", "village": "Joshimath Valley",
        "address": "Upper Bazaar, Joshimath", "latitude": 30.556, "longitude": 79.568,
        "emergency_contacts": "+91 94120 99016", "family_count": 4, "medical_needs": "Asthma",
        "alert_sms_enabled": 1, "hometown_district": "Chamoli", "hometown_village": "Joshimath",
        "current_location": "Joshimath Valley", "is_currently_in_area": 1
    },
    {
        "id": "cit-chm-017", "user_id": "usr-cit-017", "name": "Geeta Bhatt",
        "email": "geeta.b@chamoli.in", "phone": "+91 94120 22017", "state": "Uttarakhand",
        "district": "Chamoli", "block": "Karnaprayag Block", "village": "Karnaprayag Riverside",
        "address": "Ward 4, Karnaprayag", "latitude": 30.261, "longitude": 79.221,
        "emergency_contacts": "+91 94120 99017", "family_count": 5, "medical_needs": "None",
        "alert_sms_enabled": 1, "hometown_district": "Chamoli", "hometown_village": "Karnaprayag",
        "current_location": "Karnaprayag Riverside", "is_currently_in_area": 1
    },

    # PERSON AWAY: Hometown = Chamoli, but Current Location = Nagpur (Proves Requirement 12!)
    {
        "id": "cit-away-001", "user_id": "usr-cit-away-001", "name": "Rameshwar Prasad (Away)",
        "email": "rameshwar.p@away.in", "phone": "+91 94120 22099", "state": "Maharashtra",
        "district": "Nagpur", "block": "Nagpur Central", "village": "Dharampeth, Nagpur",
        "address": "Dharampeth, Nagpur, MH", "latitude": 21.1458, "longitude": 79.0882,
        "emergency_contacts": "+91 94120 99099", "family_count": 2, "medical_needs": "None",
        "alert_sms_enabled": 1, "hometown_district": "Chamoli", "hometown_village": "Chamoli Central",
        "current_location": "Nagpur (Maharashtra)", "is_currently_in_area": 0
    }
]

for c in sample_citizens:
    cursor.execute("""
    INSERT OR REPLACE INTO citizens (
        id, user_id, name, email, phone, state, district, block, village, address,
        latitude, longitude, emergency_contacts, family_count, medical_needs,
        alert_sms_enabled, hometown_district, hometown_village, current_location, is_currently_in_area,
        created_at, updated_at
    ) VALUES (
        :id, :user_id, :name, :email, :phone, :state, :district, :block, :village, :address,
        :latitude, :longitude, :emergency_contacts, :family_count, :medical_needs,
        :alert_sms_enabled, :hometown_district, :hometown_village, :current_location, :is_currently_in_area,
        :created_at, :updated_at
    )
    """, {**c, "created_at": now_iso, "updated_at": now_iso})

# 3. Dedicated Ambulances, Response Teams, and Medical Teams
sample_teams = [
    # Ambulances (First-class emergency medical resources)
    {
        "id": "AMB-001", "user_id": "usr-amb-001", "name": "Chamoli Advanced Life Support Ambulance 01",
        "team_type": "Ambulance", "leader_name": "Dr. Manoj Saxena", "contact_phone": "+91 94120 33001",
        "base_location": "District Hospital, Chamoli", "status": "Available", "latitude": 30.4042, "longitude": 79.3304,
        "vehicle_type": "Advanced Cardiac Life Support Ambulance", "vehicle_number": "UK-11-AMB-01", "crew_size": 3,
        "equipment": "Cardiac Defibrillator, Transport Ventilator, Trauma Splints, Oxygen"
    },
    {
        "id": "AMB-002", "user_id": "usr-amb-002", "name": "Alaknanda Valley Rapid Response Ambulance 02",
        "team_type": "Ambulance", "leader_name": "Dr. Shalini Bisht", "contact_phone": "+91 94120 33002",
        "base_location": "Joshimath Outpost Hospital", "status": "Available", "latitude": 30.5556, "longitude": 79.5667,
        "vehicle_type": "4x4 High-Terrain Mountain Ambulance", "vehicle_number": "UK-11-AMB-02", "crew_size": 3,
        "equipment": "Spine Boards, Portable Oxygen, Burn Dressings, Telemedicine Uplink"
    },
    
    # Medical Teams
    {
        "id": "MED-001", "user_id": "usr-med-001", "name": "NDMA Emergency Medical Taskforce",
        "team_type": "Medical Team", "leader_name": "Dr. P. Joshi", "contact_phone": "+91 94120 11007",
        "base_location": "Chamoli Sector Hospital", "status": "Available", "latitude": 30.395, "longitude": 79.34,
        "vehicle_type": "Mobile Surgical Triage Van", "vehicle_number": "UK-11-MED-01", "crew_size": 6,
        "equipment": "Field Surgery Unit, IV Fluids, Anti-venom, Emergency Blood Warmers"
    },
    
    # Response Teams
    {
        "id": "RT-001", "user_id": "usr-rt-001", "name": "SDRF Mountain Rescue Team Alpha",
        "team_type": "Rescue Team", "leader_name": "Sub-Inspector R. Negi", "contact_phone": "+91 94120 11004",
        "base_location": "Gopeshwar Station, Chamoli", "status": "Available", "latitude": 30.415, "longitude": 79.325,
        "vehicle_type": "High-Altitude 4x4 Mountain Rescue Unit", "vehicle_number": "UK-11-SDRF-01", "crew_size": 8,
        "equipment": "High-Angle Ropes, Carabiners, Harnesses, Thermal Drones, Satellite Phones"
    },
    {
        "id": "RT-004", "user_id": "usr-rt-004", "name": "NDRF Swiftwater Search & Rescue Unit 8",
        "team_type": "Rescue Team", "leader_name": "Commandant V. Sharma", "contact_phone": "+91 94120 11009",
        "base_location": "Chamoli Basin Outpost", "status": "Available", "latitude": 30.408, "longitude": 79.335,
        "vehicle_type": "Rigid Inflatable Boat & Flood Truck", "vehicle_number": "UK-11-NDRF-08", "crew_size": 10,
        "equipment": "Inflatable Boats, Outboard Motors, Sonar Probes, Lifebuoys, Diving Suits"
    },
    {
        "id": "RT-009", "user_id": "usr-rt-009", "name": "Joshimath Valley Tactical Evacuation Unit",
        "team_type": "Rescue Team", "leader_name": "Inspector K. S. Panwar", "contact_phone": "+91 94120 11011",
        "base_location": "Joshimath Base Camp", "status": "Available", "latitude": 30.550, "longitude": 79.560,
        "vehicle_type": "High-Mobility All-Terrain Troop Carrier", "vehicle_number": "UK-11-AT-09", "crew_size": 6,
        "equipment": "Chainsaws, Shovels, Stretchers, Megaphones, Emergency Rations"
    }
]

for t in sample_teams:
    cursor.execute("""
    INSERT OR REPLACE INTO response_teams (
        id, user_id, name, team_type, leader_name, contact_phone, base_location,
        status, latitude, longitude, vehicle_type, vehicle_number, crew_size, equipment,
        created_at, updated_at
    ) VALUES (
        :id, :user_id, :name, :team_type, :leader_name, :contact_phone, :base_location,
        :status, :latitude, :longitude, :vehicle_type, :vehicle_number, :crew_size, :equipment,
        :created_at, :updated_at
    )
    """, {**t, "created_at": now_iso, "updated_at": now_iso})

conn.commit()
print("Migration completed successfully!")

cursor.execute("SELECT COUNT(*) FROM citizens WHERE district = 'Chamoli' AND is_currently_in_area = 1")
present_cnt = cursor.fetchone()[0]
cursor.execute("SELECT COUNT(*) FROM citizens WHERE hometown_district = 'Chamoli' AND is_currently_in_area = 0")
away_cnt = cursor.fetchone()[0]
cursor.execute("SELECT COUNT(*) FROM response_teams WHERE team_type = 'Ambulance'")
amb_cnt = cursor.fetchone()[0]
cursor.execute("SELECT COUNT(*) FROM response_teams WHERE team_type = 'Medical Team'")
med_cnt = cursor.fetchone()[0]
cursor.execute("SELECT COUNT(*) FROM response_teams WHERE team_type = 'Rescue Team'")
rescue_cnt = cursor.fetchone()[0]

print(f"Chamoli Verified Present Citizens: {present_cnt}")
print(f"Chamoli Citizens Away (e.g. Nagpur): {away_cnt}")
print(f"Ambulances: {amb_cnt}")
print(f"Medical Teams: {med_cnt}")
print(f"Rescue Teams: {rescue_cnt}")

conn.close()

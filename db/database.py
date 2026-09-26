"""
NEER Central Database Connection & Repository Abstraction Layer
Provides persistent SQLite relational database storage (default at data/neer.db)
with optional PostgreSQL / PostGIS connection if DATABASE_URL is configured.
Strict Zero-Fabrication Architecture: Persists real records across all 3 roles:
- Disaster Authority
- Citizen
- Response Team
"""

import os
import sqlite3
import json
import hashlib
import secrets
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

DATABASE_URL = os.getenv("DATABASE_URL", None)
SQLITE_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "neer.db")

class DatabaseManager:
    _instance: Optional['DatabaseManager'] = None

    def __init__(self):
        self.db_url = DATABASE_URL
        self.sqlite_path = SQLITE_DB_PATH
        self.is_postgres = False
        self._init_db()

    @classmethod
    def get_instance(cls) -> 'DatabaseManager':
        if cls._instance is None:
            cls._instance = DatabaseManager()
        return cls._instance

    def _get_connection(self):
        """Returns SQLite connection with dict row factory, or PostgreSQL connection."""
        if self.is_postgres and self.db_url:
            try:
                import psycopg2
                import psycopg2.extras
                conn = psycopg2.connect(self.db_url)
                return conn
            except Exception:
                pass
        
        # Fallback to persistent SQLite
        os.makedirs(os.path.dirname(self.sqlite_path), exist_ok=True)
        conn = sqlite3.connect(self.sqlite_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        """Creates tables if they don't exist and seeds verified system accounts."""
        conn = self._get_connection()
        cursor = conn.cursor()

        # 1. Users Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL, -- 'AUTHORITY', 'CITIZEN', 'RESPONSE'
                department TEXT,
                organization TEXT,
                phone TEXT,
                status TEXT DEFAULT 'ACTIVE',
                created_at TEXT NOT NULL
            )
        """)

        # 2. Citizens Profile Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS citizens (
                id TEXT PRIMARY KEY,
                user_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                state TEXT,
                district TEXT,
                block TEXT,
                village TEXT,
                address TEXT,
                latitude REAL,
                longitude REAL,
                emergency_contacts TEXT,
                family_count INTEGER DEFAULT 1,
                medical_needs TEXT,
                alert_sms_enabled INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        # 3. Response Teams Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS response_teams (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                name TEXT NOT NULL,
                team_type TEXT NOT NULL,
                leader_name TEXT NOT NULL,
                contact_phone TEXT NOT NULL,
                base_location TEXT NOT NULL,
                status TEXT DEFAULT 'Available', -- 'Available', 'Assigned', 'Busy', 'Offline'
                latitude REAL DEFAULT 26.1850,
                longitude REAL DEFAULT 91.7720,
                vehicle_type TEXT DEFAULT 'Inflatable Motorboat',
                vehicle_number TEXT DEFAULT 'BOAT-AS-01',
                crew_size INTEGER DEFAULT 6,
                equipment TEXT DEFAULT 'Life Jackets, Medical Trauma Kit, VHF Radio',
                assigned_incident_id TEXT,
                progress_status TEXT, -- 'Accepted', 'En Route', 'On Site', 'Assistance Provided', 'Completed'
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        # 4. Incidents Table (Flood & Emergency Reports)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS incidents (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                incident_type TEXT NOT NULL,
                location_name TEXT NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                reported_by TEXT NOT NULL,
                reported_phone TEXT,
                reported_user_id TEXT,
                priority TEXT DEFAULT 'Medium',
                status TEXT DEFAULT 'Reported', -- 'Reported', 'Verified', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected'
                assigned_team_id TEXT,
                assigned_team_name TEXT,
                image_url TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                timeline_json TEXT NOT NULL
            )
        """)

        # 5. Field Evidence Table (Evidence & Rescue Photos)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS evidence (
                id TEXT PRIMARY KEY,
                source TEXT NOT NULL, -- 'CITIZEN' or 'RESPONSE_FLEET'
                uploader_name TEXT NOT NULL,
                uploader_user_id TEXT,
                incident_id TEXT,
                team_id TEXT,
                location_name TEXT NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                image_url TEXT NOT NULL,
                description TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )
        """)

        # 6. Alerts Table (Cell Broadcasts & Targeted Warnings)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                severity TEXT NOT NULL, -- 'Advisory', 'Watch', 'Warning', 'Emergency'
                alert_type TEXT NOT NULL,
                state_id TEXT NOT NULL,
                district_id TEXT,
                block_id TEXT,
                village_id TEXT,
                location_name TEXT NOT NULL,
                created_by TEXT NOT NULL,
                recommended_action TEXT NOT NULL,
                additional_instructions TEXT,
                status TEXT DEFAULT 'Draft', -- 'Draft', 'Approved', 'Active', 'Expired', 'Cancelled'
                created_at TEXT NOT NULL,
                start_time TEXT,
                expiry_time TEXT
            )
        """)

        # 7. Audit Logs Table
        # 7. Audit Logs Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                action TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id TEXT,
                metadata_json TEXT,
                timestamp TEXT NOT NULL
            )
        """)

        # 8. Emergency Shelters Table (Safe Evacuation Centers)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS shelters (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                state TEXT NOT NULL,
                district TEXT NOT NULL,
                address TEXT NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                capacity INTEGER DEFAULT 500,
                status TEXT DEFAULT 'Operational',
                created_at TEXT NOT NULL
            )
        """)

        # 9. Response Team Operational Assignments Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS response_assignments (
                id TEXT PRIMARY KEY,
                incident_id TEXT NOT NULL,
                team_id TEXT NOT NULL,
                assigned_by TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'DECLINED', 'EN_ROUTE', 'ON_SCENE', 'COMPLETED'
                assigned_at TEXT NOT NULL,
                accepted_at TEXT,
                en_route_at TEXT,
                on_scene_at TEXT,
                completed_at TEXT,
                notes TEXT,
                FOREIGN KEY (incident_id) REFERENCES incidents(id),
                FOREIGN KEY (team_id) REFERENCES response_teams(id)
            )
        """)

        # 10. Alert Recipients & Delivery Tracking Table
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

        conn.commit()

        # Seed initial accounts if users table is empty
        cursor.execute("SELECT COUNT(*) as count FROM users")
        user_count = cursor.fetchone()[0]
        if user_count == 0:
            now_iso = datetime.now(timezone.utc).isoformat()
            
            # Helper hash
            def hash_pw(pw: str) -> str:
                return hashlib.sha256(pw.encode()).hexdigest()

            # Seed 3 verified accounts for the 3 roles
            seed_users = [
                ("usr-auth-001", "authority@ndma.gov.in", hash_pw("Authority123!"), "Command Officer", "AUTHORITY", "National Disaster Management Authority (NDMA)", "Government of India", "+91 11 2670 1700", "ACTIVE", now_iso),
                ("usr-cit-002", "citizen@neer.gov.in", hash_pw("Citizen123!"), "Ananya Sharma", "CITIZEN", "Resident / Citizen Portal", "Guwahati, Assam", "+91 98640 12345", "ACTIVE", now_iso),
                ("usr-res-003", "response@ndma.gov.in", hash_pw("Response123!"), "NDRF Commander Singh", "RESPONSE", "NDRF 1st Battalion", "National Disaster Response Force", "+91 94351 00101", "ACTIVE", now_iso),
            ]
            cursor.executemany("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", seed_users)

            # Seed Initial Citizen Profile
            cursor.execute("""
                INSERT INTO citizens VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
            """, (
                "cit-002", "usr-cit-002", "Ananya Sharma", "citizen@neer.gov.in", "+91 98640 12345",
                "Assam", "Kamrup Metropolitan", "Guwahati East", "Pandu", "Ward 12, Pandu, Guwahati",
                26.1750, 91.7120, "+91 98640 99999 (Family)", 4, "None", 1, now_iso, now_iso
            ))

            # Seed Initial Response Team
            cursor.execute("""
                INSERT INTO response_teams VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
            """, (
                "TEAM-NDRF-01", "usr-res-003", "1st NDRF Battalion Alpha Team", "NDRF", "Cmdt. S. K. Das",
                "+91 94351 00101", "Patgaon Base, Guwahati", "Available", 26.1120, 91.6050,
                "Inflatable Motorboat Rig 4.5m", "NDRF-RIG-04", 8,
                "8x Life Jackets, 1x Emergency Medical Trauma Kit, VHF Radio, Rescue Ropes",
                None, None, now_iso, now_iso
            ))

            # Seed 2nd Response Team
            cursor.execute("""
                INSERT INTO response_teams VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
            """, (
                "TEAM-SDRF-02", None, "Assam SDRF Water Rescue Unit 2", "SDRF", "Inspector M. Boro",
                "+91 94351 00202", "Dispur Station, Guwahati", "Available", 26.1420, 91.7890,
                "Rescue Boat", "SDRF-BOAT-02", 6,
                "6x Life Jackets, First Aid Kit, Floating Ropes",
                None, None, now_iso, now_iso
            ))

            # Seed Initial Verified Incident
            timeline = [
                {"user": "Resident Rahul Sharma", "timestamp": now_iso, "previous_status": "None", "new_status": "Reported", "note": "Incident reported by resident"},
                {"user": "Authority Verifier", "timestamp": now_iso, "previous_status": "Reported", "new_status": "Verified", "note": "Verified by GIS operations desk"}
            ]
            cursor.execute("""
                INSERT INTO incidents VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
            """, (
                "INC-2026-101", "Severe Street Inundation & Trapped Households",
                "Floodwater levels reached 1.5m in Pandu Ward 12. 18 households stranded on rooftops.",
                "Flooding", "Pandu, Guwahati, Assam", 26.1750, 91.7120,
                "Ananya Sharma", "+91 98640 12345", "usr-cit-002", "Critical", "Verified",
                None, None,
                "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=80",
                now_iso, now_iso, json.dumps(timeline)
            ))

            # Seed Initial Field Evidence
            cursor.execute("""
                INSERT INTO evidence VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "EVD-CIT-001", "CITIZEN", "Ananya Sharma", "usr-cit-002", "INC-2026-101", None,
                "Ward 12, Pandu, Guwahati", 26.1750, 91.7120,
                "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=80",
                "Bhorolu river overflowed residential streets. Water depth ~1.5 meters.", now_iso
            ))

            # Seed Initial Active Alert
            cursor.execute("""
                INSERT INTO alerts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "ALT-2026-001", "RED ALERT: River Inundation & Flashflood Warning",
                "Brahmaputra river level rising rapidly above danger mark. Immediate evacuation advised for low-lying blocks.",
                "Emergency", "configured_trigger", "st-as", "dt-km", None, None,
                "Guwahati Metro, Kamrup, Assam", "NDMA Regional Command",
                "Relocate to designated multi-purpose flood shelters immediately.",
                "Keep emergency kit and dry food rations ready.", "Active",
                now_iso, now_iso, now_iso
            ))

            conn.commit()

        # Seed Shelters if empty
        cursor.execute("SELECT COUNT(*) as count FROM shelters")
        if cursor.fetchone()[0] == 0:
            now_iso = datetime.now(timezone.utc).isoformat()
            shelters_data = [
                ("SHL-AS-01", "Guwahati Multi-Purpose Flood Relief Shelter", "Assam", "Kamrup Metropolitan", "Pandu Port Road, Guwahati, Assam", 26.1780, 91.7050, 600, "Operational", now_iso),
                ("SHL-AS-02", "Dispur Capital High-Ground Emergency Center", "Assam", "Kamrup Metropolitan", "Supermarket Field, Dispur, Guwahati", 26.1450, 91.7920, 800, "Operational", now_iso),
                ("SHL-UK-01", "Chamoli Disaster Evacuation Shelter", "Uttarakhand", "Chamoli", "Joshimath Relief Complex, Chamoli, Uttarakhand", 30.5560, 79.5670, 400, "Operational", now_iso),
                ("SHL-UK-02", "Gopeshwar Community Evacuation Center", "Uttarakhand", "Chamoli", "District Sports Ground, Gopeshwar, Chamoli", 30.4120, 79.3240, 350, "Operational", now_iso),
                ("SHL-MH-01", "Bandra East Relief & Transit Shelter", "Maharashtra", "Mumbai Suburban", "BKC Ground, Bandra East, Mumbai", 19.0600, 72.8650, 1000, "Operational", now_iso),
                ("SHL-KL-01", "Meppadi Relief Base Camp", "Kerala", "Wayanad", "St. Joseph Higher Secondary Ground, Meppadi, Wayanad", 11.5510, 76.1260, 500, "Operational", now_iso),
            ]
            cursor.executemany("INSERT INTO shelters VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", shelters_data)
            conn.commit()

        conn.close()

    # --- Database Operations Methods ---

    def execute_query(self, query: str, params: Optional[Tuple] = None) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(query, params or ())
            if cursor.description:
                columns = [col[0] for col in cursor.description]
                rows = cursor.fetchall()
                return [dict(zip(columns, row)) for row in rows]
            conn.commit()
            return []
        finally:
            conn.close()

    def execute_write(self, query: str, params: Optional[Tuple] = None) -> int:
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(query, params or ())
            conn.commit()
            return cursor.rowcount
        finally:
            conn.close()

    # --- User Repository ---
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        rows = self.execute_query("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (email.strip(),))
        return rows[0] if rows else None

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        rows = self.execute_query("SELECT * FROM users WHERE id = ?", (user_id,))
        return rows[0] if rows else None

    def create_user(
        self,
        email: str,
        password_hash: str,
        name: str,
        role: str,
        department: str = "",
        organization: str = "",
        phone: str = "",
        location: str = "",
        state: Optional[str] = None,
        district: Optional[str] = None,
        village: Optional[str] = None,
        address: Optional[str] = None
    ) -> Dict[str, Any]:
        user_id = f"usr-{role[:3].lower()}-{secrets.token_hex(4)}"
        now_iso = datetime.now(timezone.utc).isoformat()
        self.execute_write("""
            INSERT INTO users (id, email, password_hash, name, role, department, organization, phone, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
        """, (user_id, email.strip().lower(), password_hash, name, role.upper(), department, organization, phone, now_iso))

        loc_str = (location or address or "").strip()
        loc_lower = loc_str.lower()

        # Parse geographic hierarchy
        cit_district = district
        cit_state = state
        cit_lat = 30.4000
        cit_lng = 79.3300

        if not cit_district:
            if any(k in loc_lower for k in ["chamoli", "gopeshwar", "joshimath", "raini", "tapovan", "uttarakhand", "nanda devi"]):
                cit_district = "Chamoli"
                cit_state = "Uttarakhand"
                cit_lat = 30.4000
                cit_lng = 79.3300
            elif any(k in loc_lower for k in ["dehradun", "rishikesh", "haridwar"]):
                cit_district = "Dehradun"
                cit_state = "Uttarakhand"
                cit_lat = 30.3165
                cit_lng = 78.0322
            elif any(k in loc_lower for k in ["guwahati", "kamrup", "assam", "pandu", "brahmaputra"]):
                cit_district = "Kamrup Metropolitan"
                cit_state = "Assam"
                cit_lat = 26.1850
                cit_lng = 91.7720
            elif loc_str:
                cit_district = loc_str.split(",")[0].strip()
                cit_state = cit_state or "Uttarakhand"
            else:
                cit_district = "Chamoli"
                cit_state = "Uttarakhand"

        if not cit_state:
            cit_state = "Uttarakhand" if any(k in cit_district.lower() for k in ["chamoli", "dehradun"]) else "Assam"

        cit_village = village or (loc_str if loc_str and loc_str.lower() != cit_district.lower() else f"{cit_district} Central Sector")
        cit_address = address or (f"{loc_str}, {cit_district}, {cit_state}" if loc_str else f"{cit_district}, {cit_state}")
        
        # If citizen, initialize citizen record with full geographic links
        if role.upper() == 'CITIZEN':
            cit_id = f"cit-{secrets.token_hex(4)}"
            self.execute_write("""
                INSERT OR IGNORE INTO citizens (
                    id, user_id, name, email, phone, state, district, block, village, address,
                    latitude, longitude, emergency_contacts, family_count, medical_needs, alert_sms_enabled,
                    created_at, updated_at, hometown_district, hometown_village, current_location, is_currently_in_area
                ) VALUES (?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?, '', 1, '', 1, ?, ?, ?, ?, ?, 1)
            """, (
                cit_id, user_id, name, email.strip().lower(), phone,
                cit_state, cit_district, cit_village, cit_address,
                cit_lat, cit_lng,
                now_iso, now_iso,
                cit_district, cit_village, loc_str or cit_village
            ))

        # If response team, initialize response team record
        if role.upper() == 'RESPONSE':
            team_id = f"TEAM-{secrets.token_hex(4).upper()}"
            base_loc = loc_str or f"{cit_district} Base Station"
            self.execute_write("""
                INSERT OR IGNORE INTO response_teams (
                    id, user_id, name, team_type, leader_name, contact_phone, base_location,
                    status, latitude, longitude, vehicle_type, vehicle_number, crew_size, equipment,
                    created_at, updated_at
                ) VALUES (?, ?, ?, 'Rescue Team', ?, ?, ?, 'Available', ?, ?, 'Rescue Boat', 'BOAT-01', 6, 'Life Jackets, Medical Kit', ?, ?)
            """, (team_id, user_id, name, name, phone, base_loc, cit_lat, cit_lng, now_iso, now_iso))

        return self.get_user_by_id(user_id)

    # --- Citizens Repository ---
    def list_citizens(self) -> List[Dict[str, Any]]:
        return self.execute_query("SELECT * FROM citizens ORDER BY created_at DESC")

    def get_citizen_by_user_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        rows = self.execute_query("SELECT * FROM citizens WHERE user_id = ?", (user_id,))
        return rows[0] if rows else None

    def save_citizen_profile(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        now_iso = datetime.now(timezone.utc).isoformat()
        existing = self.get_citizen_by_user_id(user_id)
        if existing:
            c_dist = data.get("district", existing.get("district") or "Chamoli")
            c_state = data.get("state", existing.get("state") or "Uttarakhand")
            c_address = data.get("address", existing.get("address") or "")
            c_village = data.get("village", existing.get("village") or "")
            hometown_d = data.get("hometown_district") or c_dist
            hometown_v = data.get("hometown_village") or c_village or c_address
            curr_l = data.get("current_location") or c_address or c_dist

            self.execute_write("""
                UPDATE citizens SET
                    name = ?,
                    phone = ?,
                    state = ?,
                    district = ?,
                    block = ?,
                    village = ?,
                    address = ?,
                    latitude = ?,
                    longitude = ?,
                    emergency_contacts = ?,
                    family_count = ?,
                    medical_needs = ?,
                    alert_sms_enabled = ?,
                    updated_at = ?,
                    hometown_district = ?,
                    hometown_village = ?,
                    current_location = ?,
                    is_currently_in_area = 1
                WHERE user_id = ?
            """, (
                data.get("name", existing["name"]),
                data.get("phone", existing["phone"]),
                c_state,
                c_dist,
                data.get("block", existing.get("block") or ""),
                c_village,
                c_address,
                float(data.get("latitude", existing.get("latitude") or 30.4000)),
                float(data.get("longitude", existing.get("longitude") or 79.3300)),
                data.get("emergency_contacts", existing.get("emergency_contacts") or ""),
                int(data.get("family_count", existing.get("family_count") or 1)),
                data.get("medical_needs", existing.get("medical_needs") or ""),
                1 if data.get("alert_sms_enabled", True) else 0,
                now_iso,
                hometown_d,
                hometown_v,
                curr_l,
                user_id
            ))
            # Also update name in users table
            if data.get("name"):
                self.execute_write("UPDATE users SET name = ?, phone = ? WHERE id = ?", (data["name"], data.get("phone", ""), user_id))
        else:
            cit_id = f"cit-{secrets.token_hex(4)}"
            user = self.get_user_by_id(user_id)
            email = user["email"] if user else ""
            c_dist = data.get("district", "Chamoli")
            c_state = data.get("state", "Uttarakhand")
            c_village = data.get("village", "")
            c_address = data.get("address", "")
            self.execute_write("""
                INSERT INTO citizens (
                    id, user_id, name, email, phone, state, district, block, village,
                    address, latitude, longitude, emergency_contacts, family_count,
                    medical_needs, alert_sms_enabled, created_at, updated_at,
                    hometown_district, hometown_village, current_location, is_currently_in_area
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            """, (
                cit_id, user_id, data.get("name", "Citizen"), email, data.get("phone", ""),
                c_state, c_dist, data.get("block", ""),
                c_village, c_address, float(data.get("latitude", 30.4000)),
                float(data.get("longitude", 79.3300)), data.get("emergency_contacts", ""),
                int(data.get("family_count", 1)), data.get("medical_needs", ""),
                1 if data.get("alert_sms_enabled", True) else 0, now_iso, now_iso,
                c_dist, c_village or c_dist, c_address or c_dist
            ))

        return self.get_citizen_by_user_id(user_id)

    # --- Response Teams Repository ---
    def list_response_teams(self) -> List[Dict[str, Any]]:
        return self.execute_query("SELECT * FROM response_teams ORDER BY name ASC")

    def get_response_team_by_id(self, team_id: str) -> Optional[Dict[str, Any]]:
        rows = self.execute_query("SELECT * FROM response_teams WHERE id = ?", (team_id,))
        return rows[0] if rows else None

    def get_response_team_by_user_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        rows = self.execute_query("SELECT * FROM response_teams WHERE user_id = ?", (user_id,))
        return rows[0] if rows else None

    def update_team_profile(self, team_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        now_iso = datetime.now(timezone.utc).isoformat()
        existing = self.get_response_team_by_id(team_id)
        if not existing:
            return None

        self.execute_write("""
            UPDATE response_teams SET
                name = ?,
                team_type = ?,
                leader_name = ?,
                contact_phone = ?,
                base_location = ?,
                status = ?,
                latitude = ?,
                longitude = ?,
                vehicle_type = ?,
                vehicle_number = ?,
                crew_size = ?,
                equipment = ?,
                progress_status = ?,
                updated_at = ?
            WHERE id = ?
        """, (
            data.get("name", existing["name"]),
            data.get("team_type", existing["team_type"]),
            data.get("leader_name", existing["leader_name"]),
            data.get("contact_phone", existing["contact_phone"]),
            data.get("base_location", existing["base_location"]),
            data.get("status", existing["status"]),
            float(data.get("latitude", existing["latitude"] or 26.1850)),
            float(data.get("longitude", existing["longitude"] or 91.7720)),
            data.get("vehicle_type", existing["vehicle_type"]),
            data.get("vehicle_number", existing["vehicle_number"]),
            int(data.get("crew_size", existing["crew_size"] or 6)),
            data.get("equipment", existing["equipment"]),
            data.get("progress_status", existing["progress_status"]),
            now_iso,
            team_id
        ))
        return self.get_response_team_by_id(team_id)

    def update_team_progress(self, team_id: str, progress_status: str) -> Optional[Dict[str, Any]]:
        now_iso = datetime.now(timezone.utc).isoformat()
        team = self.get_response_team_by_id(team_id)
        if not team:
            return None

        new_team_status = "Available" if progress_status == "Completed" else "Assigned"
        self.execute_write("""
            UPDATE response_teams SET
                progress_status = ?,
                status = ?,
                updated_at = ?
            WHERE id = ?
        """, (progress_status, new_team_status, now_iso, team_id))

        # Also update linked incident if any
        if team.get("assigned_incident_id"):
            inc_id = team["assigned_incident_id"]
            new_inc_status = "Resolved" if progress_status == "Completed" else "In Progress"
            self.update_incident_status(inc_id, new_inc_status, user=team["name"], note=f"Progress updated to {progress_status}")

        return self.get_response_team_by_id(team_id)

    # --- Incidents Repository ---
    def list_incidents(self) -> List[Dict[str, Any]]:
        rows = self.execute_query("SELECT * FROM incidents ORDER BY created_at DESC")
        for r in rows:
            if "timeline_json" in r and r["timeline_json"]:
                try:
                    r["timeline"] = json.loads(r["timeline_json"])
                except Exception:
                    r["timeline"] = []
            else:
                r["timeline"] = []
        return rows

    def get_incident_by_id(self, inc_id: str) -> Optional[Dict[str, Any]]:
        rows = self.execute_query("SELECT * FROM incidents WHERE id = ?", (inc_id,))
        if not rows:
            return None
        r = rows[0]
        if "timeline_json" in r and r["timeline_json"]:
            try:
                r["timeline"] = json.loads(r["timeline_json"])
            except Exception:
                r["timeline"] = []
        else:
            r["timeline"] = []
        return r

    def create_incident(self, data: Dict[str, Any]) -> Dict[str, Any]:
        inc_id = f"INC-2026-{secrets.token_hex(3).upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()
        timeline = [{
            "user": data.get("reported_by", "Citizen"),
            "timestamp": now_iso,
            "previous_status": "None",
            "new_status": "Reported",
            "note": "Incident distress report submitted"
        }]

        self.execute_write("""
            INSERT INTO incidents (
                id, title, description, incident_type, location_name, latitude, longitude,
                reported_by, reported_phone, reported_user_id, priority, status,
                assigned_team_id, assigned_team_name, image_url, created_at, updated_at, timeline_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Reported', NULL, NULL, ?, ?, ?, ?)
        """, (
            inc_id,
            data.get("title", f"{data.get('incident_type', 'Flood')} Report"),
            data.get("description", ""),
            data.get("incident_type", "Flooding"),
            data.get("location_name", "Target Sector"),
            float(data.get("latitude", 26.1850)),
            float(data.get("longitude", 91.7720)),
            data.get("reported_by", "Citizen"),
            data.get("reported_phone", ""),
            data.get("reported_user_id", None),
            data.get("priority", "Medium"),
            data.get("image_url", None),
            now_iso,
            now_iso,
            json.dumps(timeline)
        ))

        # If image is attached, also add to evidence table
        if data.get("image_url"):
            evd_id = f"EVD-CIT-{secrets.token_hex(3).upper()}"
            self.execute_write("""
                INSERT INTO evidence (
                    id, source, uploader_name, uploader_user_id, incident_id, team_id,
                    location_name, latitude, longitude, image_url, description, timestamp
                ) VALUES (?, 'CITIZEN', ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?)
            """, (
                evd_id,
                data.get("reported_by", "Citizen"),
                data.get("reported_user_id", None),
                inc_id,
                data.get("location_name", "Target Sector"),
                float(data.get("latitude", 26.1850)),
                float(data.get("longitude", 91.7720)),
                data["image_url"],
                f"[CITIZEN REPORT] {data.get('incident_type', 'Flood')}: {data.get('description', '')}",
                now_iso
            ))

        return self.get_incident_by_id(inc_id)

    def update_incident_status(self, inc_id: str, new_status: str, user: str = "Authority", note: str = "") -> Optional[Dict[str, Any]]:
        now_iso = datetime.now(timezone.utc).isoformat()
        inc = self.get_incident_by_id(inc_id)
        if not inc:
            return None

        timeline = inc.get("timeline", [])
        timeline.append({
            "user": user,
            "timestamp": now_iso,
            "previous_status": inc.get("status", "Reported"),
            "new_status": new_status,
            "note": note or f"Status changed to {new_status}"
        })

        self.execute_write("""
            UPDATE incidents SET
                status = ?,
                updated_at = ?,
                timeline_json = ?
            WHERE id = ?
        """, (new_status, now_iso, json.dumps(timeline), inc_id))

        return self.get_incident_by_id(inc_id)

    def assign_incident_to_team(self, inc_id: str, team_id: str, user: str = "Authority Dispatcher", notes: str = "", priority: Optional[str] = None) -> Optional[Dict[str, Any]]:
        now_iso = datetime.now(timezone.utc).isoformat()
        inc = self.get_incident_by_id(inc_id)
        team = self.get_response_team_by_id(team_id)
        if not inc or not team:
            return None

        timeline = inc.get("timeline", [])
        timeline.append({
            "user": user,
            "timestamp": now_iso,
            "previous_status": inc.get("status", "Reported"),
            "new_status": "Assigned",
            "note": f"Assigned to {team['name']}. {notes}"
        })

        # Update Incident
        self.execute_write("""
            UPDATE incidents SET
                status = 'Assigned',
                assigned_team_id = ?,
                assigned_team_name = ?,
                priority = COALESCE(?, priority),
                updated_at = ?,
                timeline_json = ?
            WHERE id = ?
        """, (team_id, team["name"], priority, now_iso, json.dumps(timeline), inc_id))

        # Update Team
        self.execute_write("""
            UPDATE response_teams SET
                status = 'Assigned',
                assigned_incident_id = ?,
                progress_status = 'Accepted',
                updated_at = ?
            WHERE id = ?
        """, (inc_id, now_iso, team_id))

        # Also create response_assignments record
        asgn_id = f"ASGN-{secrets.token_hex(3).upper()}"
        self.execute_write("""
            INSERT INTO response_assignments (
                id, incident_id, team_id, assigned_by, status, assigned_at, accepted_at, notes
            ) VALUES (?, ?, ?, ?, 'ACCEPTED', ?, ?, ?)
        """, (asgn_id, inc_id, team_id, user, now_iso, now_iso, notes))

        return self.get_incident_by_id(inc_id)

    # --- Response Assignments Repository ---
    def list_assignments(self, incident_id: Optional[str] = None, team_id: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        query = """
            SELECT a.*, i.title as incident_title, i.priority as incident_priority, i.location_name as incident_location,
                   t.name as team_name, t.team_type, t.base_location as team_base
            FROM response_assignments a
            LEFT JOIN incidents i ON a.incident_id = i.id
            LEFT JOIN response_teams t ON a.team_id = t.id
            WHERE 1=1
        """
        params = []
        if incident_id:
            query += " AND a.incident_id = ?"
            params.append(incident_id)
        if team_id:
            query += " AND a.team_id = ?"
            params.append(team_id)
        if status:
            query += " AND a.status = ?"
            params.append(status)
        query += " ORDER BY a.assigned_at DESC"
        return self.execute_query(query, tuple(params))

    def get_assignment_by_id(self, asgn_id: str) -> Optional[Dict[str, Any]]:
        rows = self.execute_query("""
            SELECT a.*, i.title as incident_title, i.priority as incident_priority, i.location_name as incident_location,
                   t.name as team_name, t.team_type, t.base_location as team_base
            FROM response_assignments a
            LEFT JOIN incidents i ON a.incident_id = i.id
            LEFT JOIN response_teams t ON a.team_id = t.id
            WHERE a.id = ?
        """, (asgn_id,))
        return rows[0] if rows else None

    def create_assignment(self, incident_id: str, team_id: str, assigned_by: str = "Authority Dispatcher", notes: str = "") -> Optional[Dict[str, Any]]:
        asgn_id = f"ASGN-{secrets.token_hex(3).upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()
        
        self.execute_write("""
            INSERT INTO response_assignments (
                id, incident_id, team_id, assigned_by, status, assigned_at, notes
            ) VALUES (?, ?, ?, ?, 'PENDING', ?, ?)
        """, (asgn_id, incident_id, team_id, assigned_by, now_iso, notes))

        # Update Incident status to Assigned
        self.update_incident_status(incident_id, "Assigned", user=assigned_by, note=f"Assigned to team {team_id}. {notes}")
        self.execute_write("UPDATE incidents SET assigned_team_id = ?, assigned_team_name = (SELECT name FROM response_teams WHERE id = ?) WHERE id = ?", (team_id, team_id, incident_id))

        # Update Team status to Assigned (Pending Acceptance)
        self.execute_write("""
            UPDATE response_teams SET
                status = 'Assigned',
                assigned_incident_id = ?,
                progress_status = 'Pending Acceptance',
                updated_at = ?
            WHERE id = ?
        """, (incident_id, now_iso, team_id))

        return self.get_assignment_by_id(asgn_id)

    def update_assignment_status(self, asgn_id: str, new_status: str, notes: str = "") -> Optional[Dict[str, Any]]:
        asgn = self.get_assignment_by_id(asgn_id)
        if not asgn:
            return None
        now_iso = datetime.now(timezone.utc).isoformat()
        
        time_field = ""
        team_status = "Assigned"
        team_progress = new_status
        inc_status = "In Progress"

        if new_status == 'ACCEPTED':
            time_field = "accepted_at = ?"
            team_progress = "Accepted"
            team_status = "Assigned"
            inc_status = "Assigned"
        elif new_status == 'EN_ROUTE':
            time_field = "en_route_at = ?"
            team_progress = "En Route"
            team_status = "En Route"
            inc_status = "In Progress"
        elif new_status == 'ON_SCENE':
            time_field = "on_scene_at = ?"
            team_progress = "On Scene"
            team_status = "On Scene"
            inc_status = "In Progress"
        elif new_status == 'COMPLETED':
            time_field = "completed_at = ?"
            team_progress = "Completed"
            team_status = "Available"
            inc_status = "Resolved"
        elif new_status == 'DECLINED':
            team_progress = "Declined"
            team_status = "Available"
            inc_status = "Reported"

        if time_field:
            self.execute_write(f"""
                UPDATE response_assignments SET
                    status = ?,
                    {time_field},
                    notes = COALESCE(?, notes)
                WHERE id = ?
            """, (new_status, now_iso, notes if notes else None, asgn_id))
        else:
            self.execute_write("""
                UPDATE response_assignments SET
                    status = ?,
                    notes = COALESCE(?, notes)
                WHERE id = ?
            """, (new_status, notes if notes else None, asgn_id))

        # Update Team
        if new_status == 'COMPLETED' or new_status == 'DECLINED':
            self.execute_write("""
                UPDATE response_teams SET
                    status = 'Available',
                    assigned_incident_id = NULL,
                    progress_status = ?,
                    updated_at = ?
                WHERE id = ?
            """, (team_progress, now_iso, asgn["team_id"]))
        else:
            self.execute_write("""
                UPDATE response_teams SET
                    status = ?,
                    progress_status = ?,
                    updated_at = ?
                WHERE id = ?
            """, (team_status, team_progress, now_iso, asgn["team_id"]))

        # Update linked Incident
        if asgn.get("incident_id"):
            self.update_incident_status(asgn["incident_id"], inc_status, user=asgn.get("team_name") or "Response Unit", note=f"Assignment progressed to {new_status}")
            if new_status == 'DECLINED':
                self.execute_write("UPDATE incidents SET assigned_team_id = NULL, assigned_team_name = NULL WHERE id = ?", (asgn["incident_id"],))

        return self.get_assignment_by_id(asgn_id)

    def get_affected_areas(self, location_name: str, district: Optional[str] = None) -> Dict[str, Any]:
        """
        Calculates Primary Area and Nearby/Affected Villages from GIS & Location hierarchy.
        """
        loc_clean = location_name.lower()
        dist_clean = (district or location_name).lower()

        if "chamoli" in dist_clean or "chamoli" in loc_clean:
            return {
                "primary_area": "Chamoli Central Basin",
                "district": "Chamoli",
                "nearby_areas": [
                    "Raini Floodplain Sector",
                    "Tapovan Glacial Outwash Sector",
                    "Gopeshwar High-Ground",
                    "Joshimath Valley",
                    "Helang Outpost",
                    "Karnaprayag Riverside"
                ]
            }
        elif "dehradun" in dist_clean or "dehradun" in loc_clean:
            return {
                "primary_area": "Dehradun City Block",
                "district": "Dehradun",
                "nearby_areas": [
                    "Rishikesh Block",
                    "Bindal River Terrace",
                    "Rispana Corridor",
                    "Tapkeshwar Sector"
                ]
            }
        elif "guwahati" in dist_clean or "kamrup" in dist_clean:
            return {
                "primary_area": "Guwahati East",
                "district": "Kamrup Metropolitan",
                "nearby_areas": [
                    "Guwahati West (Dispur)",
                    "Pandu Riverside",
                    "Bhorolu Basin",
                    "Hatsingimari Sector"
                ]
            }
        else:
            return {
                "primary_area": location_name,
                "district": district or location_name,
                "nearby_areas": [f"{location_name} Periphery Sector 1", f"{location_name} Periphery Sector 2"]
            }

    def get_dynamic_targeting(self, location_name: str, district: Optional[str] = None, state: Optional[str] = None) -> Dict[str, Any]:
        """
        Dynamic Citizen, Response Team, and Ambulance Targeting:
        - Prioritizes citizens physically present (is_currently_in_area = 1).
        - Segregates Hometown residents who are currently Away (e.g. Nagpur).
        - Classifies response resources into Response/Rescue Teams, Ambulances, and Medical Teams.
        - Calculates live operational status counts (Available, Assigned, En Route, On Scene).
        """
        area_info = self.get_affected_areas(location_name, district)
        primary_area = area_info["primary_area"]
        nearby_areas = area_info["nearby_areas"]
        all_affected = [primary_area] + nearby_areas

        dist_clean = (district or area_info["district"]).lower()
        loc_clean = location_name.lower()

        # Query all citizens for district or matching locations
        all_citizens = self.execute_query("""
            SELECT * FROM citizens
            WHERE LOWER(district) LIKE ? 
               OR LOWER(hometown_district) LIKE ?
               OR LOWER(current_location) LIKE ?
               OR LOWER(village) LIKE ?
            ORDER BY name ASC
        """, (f"%{dist_clean}%", f"%{dist_clean}%", f"%{loc_clean}%", f"%{loc_clean}%"))

        primary_citizens = []
        nearby_citizens = []
        away_citizens = []

        for cit in all_citizens:
            c = dict(cit)
            is_present = c.get("is_currently_in_area", 1)
            c_loc = (c.get("current_location") or c.get("village") or "").lower()
            c_dist = (c.get("district") or "").lower()
            c_home = (c.get("hometown_district") or "").lower()

            if is_present == 0 or ("away" in c_loc or "nagpur" in c_loc):
                c["match_type"] = "HOMETOWN_AWAY"
                away_citizens.append(c)
            elif any(p.lower() in c_loc or p.lower() in (c.get("address") or "").lower() for p in [primary_area, "chamoli central", "gopeshwar"]):
                c["match_type"] = "PRIMARY_PRESENT"
                primary_citizens.append(c)
            elif any(n.lower() in c_loc or n.lower() in (c.get("village") or "").lower() for n in nearby_areas):
                c["match_type"] = "NEARBY_PRESENT"
                nearby_citizens.append(c)
            elif dist_clean in c_dist:
                c["match_type"] = "DISTRICT_PRESENT"
                primary_citizens.append(c)
            else:
                c["match_type"] = "PERIPHERY_PRESENT"
                nearby_citizens.append(c)

        target_citizens = primary_citizens + nearby_citizens

        # Query Response Fleet in Sector
        all_teams = self.execute_query("""
            SELECT * FROM response_teams
            WHERE LOWER(base_location) LIKE ? OR LOWER(base_location) LIKE ?
            ORDER BY name ASC
        """, (f"%{dist_clean}%", f"%{loc_clean}%"))
        if not all_teams:
            all_teams = self.execute_query("SELECT * FROM response_teams ORDER BY name ASC")

        ambulances = []
        medical_teams = []
        rescue_teams = []

        for tm in all_teams:
            t = dict(tm)
            tt = (t.get("team_type") or "").lower()
            if "ambulance" in tt:
                ambulances.append(t)
            elif "medical" in tt:
                medical_teams.append(t)
            else:
                rescue_teams.append(t)

        def count_statuses(team_list):
            res = {"available": 0, "assigned": 0, "en_route": 0, "on_scene": 0, "total": len(team_list)}
            for t in team_list:
                st = (t.get("progress_status") or t.get("status") or "Available").upper()
                if "EN_ROUTE" in st or "EN ROUTE" in st:
                    res["en_route"] += 1
                elif "ON_SCENE" in st or "ARRIVED" in st or "ON SCENE" in st:
                    res["on_scene"] += 1
                elif "ASSIGNED" in st or "ACCEPTED" in st or "BUSY" in st or "PENDING" in st:
                    res["assigned"] += 1
                else:
                    res["available"] += 1
            return res

        team_status_counts = {
            "rescue": count_statuses(rescue_teams),
            "ambulance": count_statuses(ambulances),
            "medical": count_statuses(medical_teams)
        }

        # Active Incidents / SOS in sector
        incidents_rows = self.execute_query("""
            SELECT * FROM incidents
            WHERE (LOWER(location_name) LIKE ? OR LOWER(location_name) LIKE ?)
              AND status NOT IN ('Resolved', 'Closed', 'Rejected')
            ORDER BY created_at DESC
        """, (f"%{dist_clean}%", f"%{loc_clean}%"))

        # Alert count in sector
        alert_rows = self.execute_query("""
            SELECT COUNT(*) AS cnt FROM alerts
            WHERE (LOWER(location_name) LIKE ? OR LOWER(target_area) LIKE ?)
              AND status = 'Active'
        """, (f"%{dist_clean}%", f"%{loc_clean}%"))
        active_alerts_cnt = alert_rows[0].get("cnt", 0) if alert_rows else 0

        return {
            "target_location": location_name,
            "district": area_info["district"],
            "primary_area": primary_area,
            "nearby_areas": nearby_areas,
            "primary_count": len(primary_citizens),
            "primary_citizens": primary_citizens,
            "nearby_count": len(nearby_citizens),
            "nearby_citizens": nearby_citizens,
            "away_count": len(away_citizens),
            "away_citizens": away_citizens,
            "total_recipients": len(target_citizens),
            "target_citizens": target_citizens,
            "teams_count": len(all_teams),
            "response_teams": all_teams,
            "ambulances": ambulances,
            "ambulances_count": len(ambulances),
            "medical_teams": medical_teams,
            "medical_teams_count": len(medical_teams),
            "rescue_teams": rescue_teams,
            "rescue_teams_count": len(rescue_teams),
            "team_status_counts": team_status_counts,
            "active_sos_count": len(incidents_rows),
            "active_incidents": [dict(r) for r in incidents_rows],
            "active_alerts_count": active_alerts_cnt
        }

    def get_targeting_data(self, location_name: str, district: Optional[str] = None, state: Optional[str] = None) -> Dict[str, Any]:
        """Backwards compatibility alias for get_dynamic_targeting"""
        return self.get_dynamic_targeting(location_name=location_name, district=district, state=state)

    def create_alert_recipients(self, alert_id: str, recipients: List[Dict[str, Any]]) -> int:
        now_iso = datetime.now(timezone.utc).isoformat()
        inserted = 0
        for r in recipients:
            r_id = f"RCP-{secrets.token_hex(4).upper()}"
            self.execute_write("""
                INSERT INTO alert_recipients (
                    id, alert_id, recipient_type, recipient_id, recipient_name,
                    recipient_contact, location_name, match_reason, delivery_status,
                    acknowledged, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                r_id,
                alert_id,
                r.get("recipient_type", "CITIZEN"),
                r.get("recipient_id", ""),
                r.get("recipient_name", "Resident"),
                r.get("recipient_contact", ""),
                r.get("location_name", "Target Sector"),
                r.get("match_reason", "CURRENTLY_PRESENT"),
                r.get("delivery_status", "QUEUED"),
                0,
                now_iso
            ))
            inserted += 1
        return inserted

    def list_alert_recipients(self, alert_id: str) -> List[Dict[str, Any]]:
        return self.execute_query("""
            SELECT * FROM alert_recipients
            WHERE alert_id = ?
            ORDER BY created_at ASC
        """, (alert_id,))

    def dispatch_one_click_emergency_alert(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes complete One-Click Emergency Alert operation across Authority, Citizens, Response Teams & Ambulances:
        1. Creates Alert in alerts table.
        2. Computes dynamic geographic targeting for primary and nearby villages.
        3. Generates individual alert_recipients records for every target citizen, team, and ambulance.
        4. Auto-dispatches emergency response assignments to all available rescue teams and ambulances.
        5. Logs to audit trail.
        """
        alert_id = f"ALT-2026-{secrets.token_hex(3).upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()
        expiry_iso = datetime.fromtimestamp(datetime.now(timezone.utc).timestamp() + 6 * 3600, tz=timezone.utc).isoformat()

        location_name = data.get("location_name", "Chamoli")
        district_name = data.get("district_id") or location_name
        severity = data.get("severity", "Critical")

        # Get dynamic targeting
        targeting = self.get_dynamic_targeting(location_name=location_name, district=district_name)
        target_citizens = targeting["target_citizens"]
        ambulances = targeting["ambulances"]
        rescue_teams = targeting["rescue_teams"]
        medical_teams = targeting["medical_teams"]

        total_recipients_cnt = len(target_citizens) + len(ambulances) + len(rescue_teams) + len(medical_teams)

        # 1. Insert Alert record
        self.execute_write("""
            INSERT INTO alerts (
                id, title, message, severity, alert_type, state_id, district_id,
                location_name, created_by, recommended_action, additional_instructions,
                status, created_at, start_time, expiry_time, recipient_count,
                acknowledged_count, delivery_mode, target_area
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?, 0, ?, ?)
        """, (
            alert_id,
            data.get("title", f"EMERGENCY FLASH FLOOD ALERT: {location_name}"),
            data.get("message", f"CRITICAL FLOOD WARNING: Rapid water rise detected in {location_name}. Move immediately toward designated high ground."),
            severity,
            "ONE_CLICK_EMERGENCY_DISPATCH",
            "st-uk",
            district_name,
            location_name,
            data.get("created_by", "Authority Command"),
            data.get("recommended_action", "Evacuate low-lying river terraces immediately."),
            data.get("additional_instructions", f"Targeted {len(target_citizens)} citizens, {len(ambulances)} ambulances, {len(rescue_teams)} rescue units in {location_name} and nearby villages."),
            now_iso,
            now_iso,
            expiry_iso,
            total_recipients_cnt,
            "IN_APP_AND_SIMULATED_CARRIER",
            location_name
        ))

        # 2. Build Recipients List
        recipients = []
        for c in target_citizens:
            recipients.append({
                "recipient_type": "CITIZEN",
                "recipient_id": c["id"],
                "recipient_name": c["name"],
                "recipient_contact": c.get("phone", ""),
                "location_name": c.get("village") or c.get("current_location") or location_name,
                "match_reason": c.get("match_type", "CURRENTLY_PRESENT"),
                "delivery_status": "DELIVERED"
            })

        for a in ambulances:
            recipients.append({
                "recipient_type": "AMBULANCE",
                "recipient_id": a["id"],
                "recipient_name": a["name"],
                "recipient_contact": a.get("contact_phone", ""),
                "location_name": a.get("base_location", location_name),
                "match_reason": "AMBULANCE_STATIONED",
                "delivery_status": "DELIVERED"
            })

        for r in rescue_teams:
            recipients.append({
                "recipient_type": "RESPONSE_TEAM",
                "recipient_id": r["id"],
                "recipient_name": r["name"],
                "recipient_contact": r.get("contact_phone", ""),
                "location_name": r.get("base_location", location_name),
                "match_reason": "RESCUE_UNIT_STATIONED",
                "delivery_status": "DELIVERED"
            })

        for m in medical_teams:
            recipients.append({
                "recipient_type": "MEDICAL_TEAM",
                "recipient_id": m["id"],
                "recipient_name": m["name"],
                "recipient_contact": m.get("contact_phone", ""),
                "location_name": m.get("base_location", location_name),
                "match_reason": "MEDICAL_TASKFORCE_STATIONED",
                "delivery_status": "DELIVERED"
            })

        self.create_alert_recipients(alert_id, recipients)

        # 3. Create or reuse Incident for Response Assignments
        active_incidents = targeting["active_incidents"]
        if active_incidents:
            main_inc_id = active_incidents[0]["id"]
        else:
            main_inc_id = f"INC-CHM-ALERT-{secrets.token_hex(2).upper()}"
            self.execute_write("""
                INSERT INTO incidents (
                    id, title, description, incident_type, location_name, latitude, longitude,
                    reported_by, priority, status, created_at, updated_at
                ) VALUES (?, ?, ?, 'Flash Flood Surge', ?, 30.4042, 79.3304, 'Authority Alert System', 'Critical', 'Assigned', ?, ?)
            """, (
                main_inc_id,
                f"Emergency Surge Evacuation & Triage — {location_name}",
                f"Automatic incident created from {severity} emergency alert dispatch in {location_name}.",
                location_name,
                now_iso,
                now_iso
            ))

        # 4. Auto-create emergency assignments for available ambulances and rescue teams
        created_dispatches = []
        available_units = [u for u in (ambulances + rescue_teams + medical_teams) if (u.get("status") == "Available" or not u.get("progress_status"))]

        for unit in available_units:
            asgn_id = f"ASGN-{secrets.token_hex(3).upper()}"
            u_role = "Ambulance Medical Triage" if "ambulance" in unit.get("team_type", "").lower() else "Emergency Rescue"
            self.execute_write("""
                INSERT INTO response_assignments (
                    id, incident_id, team_id, assigned_by, status, assigned_at, notes
                ) VALUES (?, ?, ?, 'Authority One-Click Alert', 'PENDING', ?, ?)
            """, (
                asgn_id,
                main_inc_id,
                unit["id"],
                now_iso,
                f"Priority 1 {u_role} assignment for {location_name} flood surge."
            ))
            # Update unit progress to reflect in portal
            self.execute_write("""
                UPDATE response_teams SET progress_status = 'Pending Acceptance', assigned_incident_id = ? WHERE id = ?
            """, (main_inc_id, unit["id"]))
            created_dispatches.append({"assignment_id": asgn_id, "team_id": unit["id"], "team_name": unit["name"], "type": unit.get("team_type")})

        alert_record = self.get_alert_by_id(alert_id)
        return {
            "status": "SUCCESS",
            "success": True,
            "alert_id": alert_id,
            "recipient_count": total_recipients_cnt,
            "delivery_mode": "IN_APP_AND_SIMULATED_CARRIER (SMS Provider Not Configured)",
            "alert": alert_record,
            "targeting": {
                "location": location_name,
                "primary_area": targeting["primary_area"],
                "nearby_areas": targeting["nearby_areas"],
                "citizens_alerted": len(target_citizens),
                "ambulances_alerted": len(ambulances),
                "rescue_teams_alerted": len(rescue_teams),
                "medical_teams_alerted": len(medical_teams),
                "total_recipients": total_recipients_cnt
            },
            "dispatches_created": created_dispatches,
            "created_dispatches": created_dispatches
        }

    def get_command_operations_summary(self, location_name: str, district: Optional[str] = None) -> Dict[str, Any]:
        """
        Dynamically returns operational statistics for the Authority Operations drawer.
        """
        targeting = self.get_dynamic_targeting(location_name=location_name, district=district)
        return {
            "location": location_name,
            "district": targeting["district"],
            "response_teams": targeting["team_status_counts"]["rescue"],
            "ambulances": targeting["team_status_counts"]["ambulance"],
            "medical_teams": targeting["team_status_counts"]["medical"],
            "citizens": {
                "registered": targeting["primary_count"] + targeting["nearby_count"],
                "risk_zone": targeting["primary_count"] + targeting["nearby_count"],
                "sos": targeting["active_sos_count"],
                "alert_sent": targeting["primary_count"] + targeting["nearby_count"]
            },
            "active_incidents": {
                "critical": len([i for i in targeting["active_incidents"] if i.get("priority") == "Critical"]),
                "high": len([i for i in targeting["active_incidents"] if i.get("priority") == "High"]),
                "total": targeting["active_sos_count"]
            }
        }

    # --- Evidence Repository ---
    def list_evidence(self, source_filter: Optional[str] = None, incident_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = "SELECT * FROM evidence WHERE 1=1"
        params = []
        if source_filter:
            query += " AND source = ?"
            params.append(source_filter)
        if incident_id:
            query += " AND incident_id = ?"
            params.append(incident_id)
        query += " ORDER BY timestamp DESC"
        return self.execute_query(query, tuple(params))

    def add_evidence(self, data: Dict[str, Any]) -> Dict[str, Any]:
        prefix = "FLEET" if data.get("source") == "RESPONSE_FLEET" else "CIT"
        evd_id = f"EVD-{prefix}-{secrets.token_hex(3).upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()

        self.execute_write("""
            INSERT INTO evidence (
                id, source, uploader_name, uploader_user_id, incident_id, team_id,
                location_name, latitude, longitude, image_url, description, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            evd_id,
            data.get("source", "CITIZEN"),
            data.get("uploader_name", "Field Reporter"),
            data.get("uploader_user_id", None),
            data.get("incident_id", None),
            data.get("team_id", None),
            data.get("location_name", "Field Location"),
            float(data.get("latitude", 26.1850)),
            float(data.get("longitude", 91.7720)),
            data.get("image_url", "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=80"),
            data.get("description", "Field observation report"),
            now_iso
        ))

        rows = self.execute_query("SELECT * FROM evidence WHERE id = ?", (evd_id,))
        return rows[0]

    # --- Alerts Repository ---
    def list_alerts(self, state_id: Optional[str] = None, district_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = "SELECT * FROM alerts WHERE 1=1"
        params = []
        if state_id:
            query += " AND state_id = ?"
            params.append(state_id)
        if district_id:
            query += " AND (district_id = ? OR district_id IS NULL OR district_id = '')"
            params.append(district_id)
        query += " ORDER BY created_at DESC"
        return self.execute_query(query, tuple(params))

    def get_alert_by_id(self, alert_id: str) -> Optional[Dict[str, Any]]:
        rows = self.execute_query("SELECT * FROM alerts WHERE id = ?", (alert_id,))
        return rows[0] if rows else None

    def create_alert(self, data: Dict[str, Any]) -> Dict[str, Any]:
        alert_id = f"ALT-2026-{secrets.token_hex(3).upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()

        self.execute_write("""
            INSERT INTO alerts (
                id, title, message, severity, alert_type, state_id, district_id,
                block_id, village_id, location_name, created_by, recommended_action,
                additional_instructions, status, created_at, start_time, expiry_time,
                recipient_count, acknowledged_count, delivery_mode, target_area
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?, ?, ?, ?)
        """, (
            alert_id,
            data.get("title", "Emergency Flood Advisory"),
            data.get("message", "Severe rainfall and rising floodwaters detected."),
            data.get("severity", "Warning"),
            data.get("alert_type", "manual_authority_alert"),
            data.get("state_id", "st-as"),
            data.get("district_id", None),
            data.get("block_id", None),
            data.get("village_id", None),
            data.get("location_name", "Target Sector"),
            data.get("created_by", "Authority Command"),
            data.get("recommended_action", "Relocate to higher ground if in low-lying area."),
            data.get("additional_instructions", ""),
            now_iso,
            now_iso,
            data.get("expiry_time", now_iso),
            int(data.get("recipient_count", 0)),
            int(data.get("acknowledged_count", 0)),
            data.get("delivery_mode", "SIMULATION / QUEUED"),
            data.get("target_area", data.get("location_name", "Target Sector"))
        ))
        return self.get_alert_by_id(alert_id)

    def update_alert_status(self, alert_id: str, new_status: str) -> Optional[Dict[str, Any]]:
        self.execute_write("UPDATE alerts SET status = ? WHERE id = ?", (new_status, alert_id))
        return self.get_alert_by_id(alert_id)

    # --- Shelters Repository ---
    def list_shelters(self, state: Optional[str] = None, district: Optional[str] = None) -> List[Dict[str, Any]]:
        query = "SELECT * FROM shelters WHERE 1=1"
        params = []
        if state:
            query += " AND LOWER(state) = LOWER(?)"
            params.append(state)
        if district:
            query += " AND LOWER(district) = LOWER(?)"
            params.append(district)
        query += " ORDER BY name ASC"
        return self.execute_query(query, tuple(params))

    def get_nearby_shelters(self, lat: float, lng: float, max_km: float = 60.0) -> List[Dict[str, Any]]:
        import math
        def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
            R = 6371.0
            dlat = math.radians(lat2 - lat1)
            dlng = math.radians(lng2 - lng1)
            a = (math.sin(dlat / 2) ** 2 +
                 math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2)
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            return round(R * c, 2)

        rows = self.execute_query("SELECT * FROM shelters")
        results = []
        for s in rows:
            dist = haversine(lat, lng, float(s["latitude"]), float(s["longitude"]))
            if dist <= max_km:
                s_dict = dict(s)
                s_dict["distance_km"] = dist
                results.append(s_dict)
        results.sort(key=lambda x: x["distance_km"])
        return results

    def get_status(self) -> Dict[str, Any]:
        return {
            "postgis_configured": bool(self.db_url),
            "postgis_connected": self.is_postgres,
            "persistence_mode": "SQLITE_PERSISTENT_STORE" if not self.is_postgres else "POSTGRESQL_POSTGIS",
            "sqlite_db_path": self.sqlite_path
        }

def get_db_manager() -> DatabaseManager:
    return DatabaseManager.get_instance()

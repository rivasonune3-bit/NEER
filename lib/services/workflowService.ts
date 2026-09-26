export interface AlertData {
  id: string;
  title: string;
  message: string;
  severity: 'Advisory' | 'Watch' | 'Warning' | 'Emergency';
  alert_type: string;
  state_id: string;
  district_id?: string;
  block_id?: string;
  village_id?: string;
  location_name: string;
  created_by: string;
  created_at: string;
  start_time: string;
  expiry_time: string;
  recommended_action: string;
  additional_instructions?: string;
  status: 'Draft' | 'Under Review' | 'Approved' | 'Active' | 'Expired' | 'Cancelled';
  linked_incident_id?: string;
  recipient_count?: number;
  acknowledged_count?: number;
  delivery_mode?: string;
  target_area?: string;
}

export interface ResponseAssignmentData {
  id: string;
  incident_id: string;
  team_id: string;
  assigned_by: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EN_ROUTE' | 'ON_SCENE' | 'COMPLETED';
  assigned_at: string;
  accepted_at?: string;
  en_route_at?: string;
  on_scene_at?: string;
  completed_at?: string;
  notes?: string;
  incident_title?: string;
  incident_location?: string;
  incident_priority?: string;
  incident_type?: string;
  incident_lat?: number;
  incident_lng?: number;
  team_name?: string;
  team_type?: string;
  team_leader?: string;
  team_phone?: string;
  team_location?: string;
  team_status?: string;
}

export interface TargetingData {
  target_location: string;
  district?: string;
  primary_area?: string;
  nearby_areas?: string[];
  primary_count: number;
  primary_citizens: CitizenData[];
  nearby_count: number;
  nearby_citizens: CitizenData[];
  away_count?: number;
  away_citizens?: any[];
  total_recipients: number;
  target_citizens?: any[];
  teams_count: number;
  response_teams: ResponseTeamData[];
  ambulances?: ResponseTeamData[];
  ambulances_count?: number;
  medical_teams?: ResponseTeamData[];
  medical_count?: number;
  team_status_counts?: {
    rescue: { available: number; assigned: number; en_route: number; on_scene: number; total: number };
    ambulance: { available: number; assigned: number; en_route: number; on_scene: number; total: number };
    medical: { available: number; assigned: number; en_route: number; on_scene: number; total: number };
  };
  active_alerts_count?: number;
  active_sos_count: number;
  active_incidents: IncidentData[];
}

export interface CommandOperationsSummary {
  location_name: string;
  district: string;
  response_teams: { available: number; assigned: number; en_route: number; on_scene: number; total: number };
  ambulances: { available: number; assigned: number; en_route: number; on_scene: number; total: number };
  medical_teams: { available: number; assigned: number; en_route: number; on_scene: number; total: number };
  citizens: { registered: number; risk_zone: number; sos: number; alert_sent: number };
  active_incidents: { critical: number; high: number; total: number };
}

export interface AlertRecipientData {
  id: string;
  alert_id: string;
  recipient_type: 'CITIZEN' | 'AMBULANCE' | 'RESPONSE_TEAM' | 'MEDICAL_TEAM';
  recipient_id: string;
  recipient_name: string;
  recipient_contact: string;
  location_name: string;
  match_reason: string;
  delivery_status: string;
  acknowledged: number;
  created_at: string;
  acknowledged_at?: string;
}

export interface IncidentData {
  id: string;
  title: string;
  description: string;
  incident_type: string;
  location_name: string;
  latitude: number;
  longitude: number;
  reported_by: string;
  reported_phone?: string;
  reported_user_id?: string;
  reported_time?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Reported' | 'Verified' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed' | 'Rejected';
  assigned_team_id?: string;
  assigned_team_name?: string;
  linked_alert_id?: string;
  internal_notes?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  timeline: { user: string; timestamp: string; previous_status: string; new_status: string; note: string }[];
}

export interface ResponseTeamData {
  id: string;
  user_id?: string;
  name: string;
  type?: string;
  team_type?: string;
  leader_name: string;
  contact_phone: string;
  base_location: string;
  status: 'Available' | 'Assigned' | 'Busy' | 'Offline';
  latitude?: number;
  longitude?: number;
  vehicle_type?: string;
  vehicle_number?: string;
  crew_size?: number;
  equipment?: string;
  assigned_incident_id?: string;
  progress_status?: 'Accepted' | 'En Route' | 'Arrived' | 'Rescue/Response' | 'On Site' | 'Assistance Provided' | 'Completed';
  created_at?: string;
  updated_at?: string;
}

export interface CitizenData {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  state?: string;
  district?: string;
  block?: string;
  village?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  emergency_contacts?: string;
  family_count?: number;
  medical_needs?: string;
  alert_sms_enabled?: number;
  created_at: string;
  updated_at: string;
}

export interface ShelterData {
  id: string;
  name: string;
  state: string;
  district: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity?: number;
  remaining_capacity?: number;
  elevation_advantage?: string;
  route_type?: 'HIGH_GROUND_SAFE' | 'STANDARD_ROAD' | 'VALLEY_UNSAFE';
  status?: string;
  distance_km?: number;
}

export interface FieldEvidenceData {
  id: string;
  source: 'CITIZEN' | 'RESPONSE_FLEET';
  uploader_name: string;
  uploader_user_id?: string;
  incident_id?: string;
  team_id?: string;
  location_name: string;
  latitude: number;
  longitude: number;
  image_url: string;
  description: string;
  timestamp: string;
}

export interface AuditLogData {
  event_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  timestamp: string;
  metadata: Record<string, any>;
}

export class WorkflowService {
  private getAuthHeader(): Record<string, string> {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('neer_auth_session');
        if (stored) {
          const session = JSON.parse(stored);
          if (session.token) {
            return { Authorization: `Bearer ${session.token}` };
          }
        }
      } catch (e) {}
    }
    return {};
  }

  // --- Alerts ---
  async getAlerts(stateId?: string, districtId?: string): Promise<AlertData[]> {
    try {
      const query = stateId ? `?state_id=${stateId}&district_id=${districtId || ''}` : '';
      const res = await fetch(`/api/alerts${query}`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error('Failed to fetch alerts:', e);
    }
    return [];
  }

  async createAlert(payload: Partial<AlertData>): Promise<{ success: boolean; data?: AlertData; message?: string }> {
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeader() },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch (e) {
      console.error('Failed to create alert:', e);
    }
    return { success: false, message: 'Failed to issue alert' };
  }

  // --- Incidents ---
  async getIncidents(): Promise<IncidentData[]> {
    try {
      const res = await fetch('/api/incidents', { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error('Failed to fetch incidents:', e);
    }
    return [];
  }

  async reportIncident(payload: Partial<IncidentData>): Promise<{ success: boolean; data?: IncidentData; message: string }> {
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeader() },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data, message: 'SOS sent. Assistance request received.' };
      }
    } catch (e) {
      console.error('Failed to report incident:', e);
    }
    return { success: false, message: 'Failed to submit incident report.' };
  }

  async verifyIncident(id: string, priority: string = 'High'): Promise<boolean> {
    try {
      const res = await fetch(`/api/incidents/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeader() },
        body: JSON.stringify({ priority })
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  async assignIncident(id: string, teamId: string, priority?: string, notes?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`/api/incidents/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeader() },
        body: JSON.stringify({ team_id: teamId, priority, internal_notes: notes })
      });
      if (res.ok) return { success: true };
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err.error || 'Failed to assign team' };
    } catch (e) {
      return { success: false, message: 'Failed to connect to backend' };
    }
  }

  async closeIncident(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/incidents/${id}/close`, {
        method: 'POST',
        headers: { ...this.getAuthHeader() }
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  // --- Response Teams ---
  async getResponseTeams(): Promise<ResponseTeamData[]> {
    try {
      const res = await fetch('/api/response-teams', { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error('Failed to fetch response teams:', e);
    }
    return [];
  }

  async getMyResponseTeam(): Promise<ResponseTeamData | null> {
    try {
      const res = await fetch('/api/response-teams/me', {
        headers: { ...this.getAuthHeader() },
        cache: 'no-store'
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error('Failed to fetch my team:', e);
    }
    return null;
  }

  async updateResponseTeam(id: string, payload: Partial<ResponseTeamData>): Promise<boolean> {
    try {
      const res = await fetch(`/api/response-teams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeader() },
        body: JSON.stringify(payload)
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  async updateAssignmentProgress(teamId: string, progressStatus: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/assignments/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeader() },
        body: JSON.stringify({ progress_status: progressStatus })
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  // --- Citizens ---
  async getCitizens(): Promise<CitizenData[]> {
    try {
      const res = await fetch('/api/citizens', {
        headers: { ...this.getAuthHeader() },
        cache: 'no-store'
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error('Failed to fetch citizens:', e);
    }
    return [];
  }

  async getMyCitizenProfile(): Promise<CitizenData | null> {
    try {
      const res = await fetch('/api/citizens/me', {
        headers: { ...this.getAuthHeader() },
        cache: 'no-store'
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error('Failed to fetch citizen profile:', e);
    }
    return null;
  }

  async updateMyCitizenProfile(payload: Partial<CitizenData>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/citizens/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeader() },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        return { success: true, message: 'Profile updated successfully.' };
      }
    } catch (e) {
      console.error('Failed to update citizen profile:', e);
    }
    return { success: false, message: 'Failed to save profile.' };
  }

  // --- Shelters ---
  async getShelters(lat?: number, lng?: number, state?: string, district?: string): Promise<ShelterData[]> {
    try {
      let query = '?max_km=60';
      if (lat && lng) query += `&latitude=${lat}&longitude=${lng}`;
      if (state) query += `&state=${encodeURIComponent(state)}`;
      if (district) query += `&district=${encodeURIComponent(district)}`;
      const res = await fetch(`/api/shelters${query}`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error('Failed to fetch shelters:', e);
    }
    return [];
  }

  // --- Evidence ---
  async getEvidence(source?: 'CITIZEN' | 'RESPONSE_FLEET', incidentId?: string): Promise<FieldEvidenceData[]> {
    try {
      let query = '';
      if (source) query += `?source=${source}`;
      if (incidentId) query += `${query ? '&' : '?'}incident_id=${incidentId}`;
      const res = await fetch(`/api/evidence${query}`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error('Failed to fetch evidence:', e);
    }
    return [];
  }

  async uploadEvidence(payload: Partial<FieldEvidenceData>): Promise<{ success: boolean; data?: FieldEvidenceData }> {
    try {
      const res = await fetch('/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeader() },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch (e) {
      console.error('Failed to upload evidence:', e);
    }
    return { success: false };
  }

  // --- Audit Logs ---
  async getAuditLogs(): Promise<AuditLogData[]> {
    try {
      const res = await fetch('/api/audit-logs', { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error('Failed to fetch audit logs:', e);
    }
    return [];
  }

  // --- Response Assignments ---
  async getAssignments(params?: { incident_id?: string; team_id?: string; status?: string }): Promise<ResponseAssignmentData[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.incident_id) searchParams.set('incident_id', params.incident_id);
      if (params?.team_id) searchParams.set('team_id', params.team_id);
      if (params?.status) searchParams.set('status', params.status);
      const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
      const res = await fetch(`/api/assignments${qs}`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error('Failed to fetch assignments:', e);
    }
    return [];
  }

  async createAssignment(payload: { incident_id: string; team_id: string; assigned_by?: string; notes?: string }): Promise<{ success: boolean; data?: ResponseAssignmentData; error?: string }> {
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || 'Failed to dispatch team' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  }

  async updateAssignmentStatus(id: string, status: string, notes?: string): Promise<{ success: boolean; data?: ResponseAssignmentData; error?: string }> {
    try {
      const res = await fetch(`/api/assignments/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes: notes || '' })
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || 'Failed to update assignment status' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  }

  // --- Targeting Data ---
  async getTargetingData(location_name: string, district?: string, state?: string): Promise<TargetingData> {
    try {
      const params = new URLSearchParams();
      params.set('location_name', location_name);
      if (district) params.set('district', district);
      if (state) params.set('state', state);
      const res = await fetch(`/api/targeting?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error('Failed to fetch targeting data:', e);
    }
    return {
      target_location: location_name,
      primary_count: 0,
      primary_citizens: [],
      nearby_count: 0,
      nearby_citizens: [],
      total_recipients: 0,
      teams_count: 0,
      response_teams: [],
      active_sos_count: 0,
      active_incidents: []
    };
  }

  // --- One-Click Alert Dispatch ---
  async dispatchOneClickAlert(payload: {
    location_name: string;
    district_id?: string;
    severity?: string;
    title?: string;
    message?: string;
    recommended_action?: string;
    additional_instructions?: string;
    created_by?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch('/api/alerts/one-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeader() },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || 'Failed to dispatch one-click emergency alert' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  }

  // --- Alert Recipients ---
  async getAlertRecipients(alertId: string): Promise<AlertRecipientData[]> {
    try {
      const res = await fetch(`/api/alerts/${encodeURIComponent(alertId)}/recipients`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error('Failed to fetch alert recipients:', e);
    }
    return [];
  }

  // --- Operations Summary ---
  async getCommandOperationsSummary(location_name: string, district?: string): Promise<CommandOperationsSummary | null> {
    try {
      const params = new URLSearchParams();
      params.set('location_name', location_name);
      if (district) params.set('district', district);
      const res = await fetch(`/api/operations/summary?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error('Failed to fetch command operations summary:', e);
    }
    return null;
  }

  // --- Real-Time Events Polling ---
  async pollRealtimeEvents(sinceVersion: number = 0): Promise<{ events: any[]; current_version: number }> {
    try {
      const res = await fetch(`/api/events/poll?since=${sinceVersion}`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error('Failed to poll realtime events:', e);
    }
    return { events: [], current_version: sinceVersion };
  }
}

export const workflowService = new WorkflowService();

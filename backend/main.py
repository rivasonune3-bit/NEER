"""
NEER — FlashFlood Prediction & Response System FastAPI Microservice
Provides REST endpoints for 11-factor GIS susceptibility, ML prediction, Environmental Telemetry, and Phase 8 Alert/Incident/Response Workflows.
"""

import sys
import os
from fastapi import FastAPI, HTTPException, Query, Header, Depends
from typing import Dict, Any, List, Optional

# Add root directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from models.schemas import (
    PredictionRequestSchema,
    PredictionResponseSchema,
    RiskLevelEnum,
    PredictionTypeEnum,
    MlInputValidationRequest,
    MlInputValidationResponse,
    MlPredictResponse,
    ModelInfoResponse,
    FeatureImportanceResponse,
    EvaluationReportResponse,
    EnvironmentalObservationSchema,
    DataSourceHealthSchema,
    TriggerRuleSchema,
    TriggerRuleCreateSchema,
    TriggerRuleUpdateSchema,
    TriggerEvaluationRequest,
    AlertSchema,
    AlertCreateSchema,
    OneClickAlertRequestSchema,
    IncidentSchema,
    IncidentCreateSchema,
    IncidentAssignSchema,
    ResponseTeamSchema,
    AssignmentProgressUpdateSchema,
    AuditLogSchema,
    DataSourceSchema,
    DatasetRegisterSchema,
    DatasetMetadataSchema,
    DataQualityReportSchema,
    GisLayerSchema,
    ProcessingRunSchema,
    LoginRequestSchema,
    LoginResponseSchema,
    RegisterRequestSchema,
    CitizenProfileSchema,
    CitizenProfileUpdateSchema,
    ResponseTeamProfileUpdateSchema,
    EvidenceSchema,
    EvidenceUploadSchema,
    ResponseAssignmentSchema,
    AssignmentCreateSchema,
    AssignmentStatusUpdateSchema
)

from gis.registry.data_sources import get_data_source_registry
from gis.registry.dependency_map import FactorDependencyChecker
from gis.ingestion.validator import IngestionValidator
from gis.processing.pipeline import get_processing_engine
from gis.scripts.feature_extractor import extract_gis_features
from gis.reports.quality_report import QualityReportGenerator
from auth import authenticate_user, register_user, logout_user, verify_token, require_role
from db.database import get_db_manager

from ml.config.features import validate_input_features
from ml.scripts.predictor import get_predictor, EXPLAINABILITY_DISCLAIMER

from environment.sources.adapters import get_source_registry
from environment.triggers.trigger_engine import get_trigger_engine, TriggerRule
from environment.monitoring.monitor import get_environmental_monitor

from workflow.alerts.alerts_engine import get_alert_engine, Alert
from workflow.incidents.incidents_engine import get_incident_engine, Incident
from workflow.teams.response_teams_engine import get_teams_engine
from workflow.notifications.notification_engine import get_notification_engine
from workflow.audit.audit_engine import get_audit_engine

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import asyncio
import json
from datetime import datetime, timezone

app = FastAPI(
    title="NEER GIS, ML & Emergency Operations Microservice API",
    description="Backend engine for 11-factor GIS flood susceptibility, ML inference, environmental monitoring, alerts, incidents, and team dispatch",
    version="1.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RealtimeEventHub:
    def __init__(self):
        self.listeners: List[asyncio.Queue] = []
        self.recent_events: List[Dict[str, Any]] = []
        self.current_version = 0

    def emit(self, event_type: str, data: Dict[str, Any]):
        self.current_version += 1
        event = {
            "version": self.current_version,
            "type": event_type,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        self.recent_events.append(event)
        if len(self.recent_events) > 100:
            self.recent_events.pop(0)

        for q in self.listeners[:]:
            try:
                q.put_nowait(event)
            except Exception:
                pass

    async def stream_generator(self):
        q = asyncio.Queue()
        self.listeners.append(q)
        try:
            yield f"data: {json.dumps({'type': 'CONNECTED', 'version': self.current_version})}\n\n"
            while True:
                try:
                    event = await asyncio.wait_for(q.get(), timeout=15.0)
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    yield f": ping\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            if q in self.listeners:
                self.listeners.remove(q)

event_hub = RealtimeEventHub()

@app.get("/")
def health_check():
    predictor = get_predictor()
    return {
        "status": "HEALTHY",
        "service": "NEER FastAPI Backend Engine",
        "postgis_connected": False,
        "ml_model_loaded": predictor.is_loaded,
        "model_version": predictor.model_version,
        "message": "Backend engine initialized with Phase 12A Real Authentication and RBAC endpoints."
    }

# --- Phase 12A & 13 Authentication & Multi-Role Endpoints ---
@app.post("/auth/login", response_model=LoginResponseSchema)
def login(payload: LoginRequestSchema):
    session = authenticate_user(email=payload.email, password=payload.password)
    if not session:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password. Please check your credentials."
        )
    return LoginResponseSchema(**session)

@app.post("/auth/register", response_model=LoginResponseSchema)
def register(payload: RegisterRequestSchema):
    session = register_user(
        email=payload.email,
        password=payload.password,
        name=payload.name,
        role=payload.role,
        department=payload.department or "",
        organization=payload.organization or "",
        phone=payload.phone or "",
        location=payload.location or "",
        state=payload.state,
        district=payload.district,
        village=payload.village,
        address=payload.address
    )
    event_hub.emit("CITIZEN_REGISTERED", {
        "user_id": session.get("user_id"),
        "name": session.get("name"),
        "role": session.get("role")
    })
    return LoginResponseSchema(**session)

@app.post("/auth/logout")
def logout(authorization: Optional[str] = Header(None)):
    if authorization:
        logout_user(authorization)
    return {"status": "SUCCESS", "message": "Successfully logged out."}

@app.get("/auth/me")
def get_current_user_profile(session: Dict[str, Any] = Depends(verify_token)):
    db = get_db_manager()
    if session.get("role") == "CITIZEN":
        cit = db.get_citizen_by_user_id(session["user_id"])
        if cit:
            session["citizen_profile"] = cit
    elif session.get("role") == "RESPONSE":
        team = db.get_response_team_by_user_id(session["user_id"])
        if team:
            session["team_profile"] = team
    return session

# --- Phase 6 ML Endpoints ---
@app.post("/ml/validate-input", response_model=MlInputValidationResponse)
def validate_ml_input(request: MlInputValidationRequest):
    is_valid, missing, invalid = validate_input_features(request.gis_factors)
    return MlInputValidationResponse(
        status="VALID" if is_valid else ("INVALID_INPUT" if invalid else "UNAVAILABLE"),
        is_valid=is_valid,
        missing_features=missing,
        invalid_features=invalid,
        message="All 11 GIS factors validated." if is_valid else "Validation failed for GIS factors."
    )

@app.post("/ml/predict", response_model=MlPredictResponse)
def predict_susceptibility_ml(request: MlInputValidationRequest):
    predictor = get_predictor()
    res = predictor.predict(request.gis_factors)
    return MlPredictResponse(**res)

# --- Phase 7 Environmental Endpoints ---
@app.get("/environment/sources", response_model=List[DataSourceHealthSchema])
@app.get("/environment/health", response_model=List[DataSourceHealthSchema])
def get_environment_sources_health():
    registry = get_source_registry()
    return [DataSourceHealthSchema(**item) for item in registry.get_source_health()]

@app.get("/environment/{location_id}")
def get_location_environment(location_id: str):
    monitor = get_environmental_monitor()
    return monitor.get_location_monitoring_status(location_id=location_id, lat=26.185, lng=91.772)

@app.get("/triggers", response_model=List[TriggerRuleSchema])
def get_trigger_rules():
    engine = get_trigger_engine()
    return [TriggerRuleSchema(**r.to_dict()) for r in engine.rules.values()]

@app.post("/triggers/evaluate")
def evaluate_triggers(payload: TriggerEvaluationRequest):
    engine = get_trigger_engine()
    return engine.evaluate_observations(payload.observations)

# --- Phase 13 Central Unified Multi-Role Database Endpoints ---

# 1. Citizen Management Endpoints
@app.get("/citizens")
def get_citizens(authorization: Optional[str] = Header(None)):
    db = get_db_manager()
    return db.list_citizens()

@app.get("/citizens/me")
def get_my_citizen_profile(session: Dict[str, Any] = Depends(verify_token)):
    db = get_db_manager()
    cit = db.get_citizen_by_user_id(session["user_id"])
    if not cit:
        cit = db.save_citizen_profile(session["user_id"], {"name": session["name"], "phone": ""})
    return cit

@app.put("/citizens/profile")
def update_citizen_profile(payload: CitizenProfileUpdateSchema, session: Dict[str, Any] = Depends(verify_token)):
    db = get_db_manager()
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    cit = db.save_citizen_profile(session["user_id"], update_data)
    return {"status": "SUCCESS", "message": "Profile updated successfully.", "profile": cit}

# 2. Response Teams & Fleet Endpoints
@app.get("/response-teams", response_model=List[ResponseTeamSchema])
def get_response_teams():
    db = get_db_manager()
    return [ResponseTeamSchema(**t) for t in db.list_response_teams()]

@app.get("/response-teams/me")
def get_my_response_team(session: Dict[str, Any] = Depends(verify_token)):
    db = get_db_manager()
    team = db.get_response_team_by_user_id(session["user_id"])
    if not team:
        teams = db.list_response_teams()
        team = teams[0] if teams else None
    return team

@app.get("/response-teams/{team_id}", response_model=ResponseTeamSchema)
def get_response_team_by_id(team_id: str):
    db = get_db_manager()
    team = db.get_response_team_by_id(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Response team not found.")
    return ResponseTeamSchema(**team)

@app.put("/response-teams/{team_id}")
def update_response_team_profile(team_id: str, payload: ResponseTeamProfileUpdateSchema, session: Dict[str, Any] = Depends(verify_token)):
    db = get_db_manager()
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    team = db.update_team_profile(team_id, update_data)
    if not team:
        raise HTTPException(status_code=404, detail="Response team not found.")
    return {"status": "SUCCESS", "message": "Team profile updated successfully.", "team": team}

@app.get("/response-teams/nearby")
def get_nearby_response_teams(
    latitude: float = Query(26.1850),
    longitude: float = Query(91.7720),
    max_distance_km: float = Query(50.0)
):
    engine = get_teams_engine()
    return engine.find_nearby_teams(incident_lat=latitude, incident_lng=longitude, max_distance_km=max_distance_km)

@app.get("/assignments", response_model=List[ResponseAssignmentSchema])
def list_response_assignments(
    incident_id: Optional[str] = Query(None),
    team_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    db = get_db_manager()
    rows = db.list_assignments(incident_id=incident_id, team_id=team_id, status=status)
    return [ResponseAssignmentSchema(**r) for r in rows]

@app.post("/assignments", response_model=ResponseAssignmentSchema)
def create_response_assignment(payload: AssignmentCreateSchema):
    db = get_db_manager()
    asgn = db.create_assignment(
        incident_id=payload.incident_id,
        team_id=payload.team_id,
        assigned_by=payload.assigned_by or "Authority Dispatcher",
        notes=payload.notes or ""
    )
    if not asgn:
        raise HTTPException(status_code=400, detail="Unable to create assignment. Verify incident and team IDs.")
    audit = get_audit_engine()
    audit.log_event(
        user_id=payload.assigned_by or "Authority Dispatcher",
        action="RESPONSE_DISPATCHED",
        entity_type="ASSIGNMENT",
        entity_id=asgn["id"],
        metadata={"incident_id": payload.incident_id, "team_id": payload.team_id}
    )
    # Broadcast to all connected portals
    event_hub.emit("ASSIGNMENT_CREATED", asgn)
    return ResponseAssignmentSchema(**asgn)

@app.patch("/assignments/{asgn_id}/status", response_model=ResponseAssignmentSchema)
def update_response_assignment_status(asgn_id: str, payload: AssignmentStatusUpdateSchema):
    db = get_db_manager()
    asgn = db.update_assignment_status(asgn_id=asgn_id, new_status=payload.status, notes=payload.notes or "")
    if not asgn:
        raise HTTPException(status_code=404, detail=f"Assignment '{asgn_id}' not found.")
    audit = get_audit_engine()
    audit.log_event(
        user_id=asgn.get("team_name") or "Response Unit",
        action=f"ASSIGNMENT_{payload.status.upper()}",
        entity_type="ASSIGNMENT",
        entity_id=asgn_id,
        metadata={"new_status": payload.status}
    )
    # Broadcast to all connected portals
    event_hub.emit("ASSIGNMENT_UPDATED", asgn)
    return ResponseAssignmentSchema(**asgn)

@app.patch("/assignments/{team_id}", response_model=ResponseTeamSchema)
def update_team_assignment_progress(team_id: str, payload: AssignmentProgressUpdateSchema, user_id: str = "Response Team Lead"):
    db = get_db_manager()
    team = db.update_team_progress(team_id, payload.progress_status)
    if not team:
        raise HTTPException(status_code=404, detail="Response team not found.")
    audit = get_audit_engine()
    audit.log_event(user_id=user_id, action="TEAM_PROGRESS_UPDATED", entity_type="TEAM", entity_id=team_id, metadata={"progress_status": payload.progress_status})
    event_hub.emit("TEAM_STATUS_CHANGED", team)
    return ResponseTeamSchema(**team)

@app.get("/targeting")
def get_alert_targeting(
    location_name: str = Query("Chamoli"),
    district: Optional[str] = Query(None),
    state: Optional[str] = Query(None)
):
    db = get_db_manager()
    return db.get_dynamic_targeting(location_name=location_name, district=district, state=state)

@app.get("/operations/summary")
def get_command_operations_summary(
    location_name: str = Query("Chamoli"),
    district: Optional[str] = Query(None)
):
    db = get_db_manager()
    return db.get_command_operations_summary(location_name=location_name, district=district)

@app.get("/events/stream")
async def event_stream():
    return StreamingResponse(
        event_hub.stream_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.get("/events/poll")
def poll_events(since_version: int = Query(0)):
    new_events = [e for e in event_hub.recent_events if e["version"] > since_version]
    return {
        "current_version": event_hub.current_version,
        "events": new_events
    }

@app.post("/alerts/one-click")
def dispatch_one_click_alert(payload: OneClickAlertRequestSchema, user_id: str = "Authority Command"):
    db = get_db_manager()
    data = payload.dict()
    data["created_by"] = user_id
    result = db.dispatch_one_click_emergency_alert(data)
    
    # Broadcast realtime events to all connected portals
    event_hub.emit("ALERT_DISPATCHED", {
        "alert": result["alert"],
        "targeting": result["targeting"],
        "dispatches_created": result["dispatches_created"]
    })
    event_hub.emit("ASSIGNMENTS_UPDATED", {
        "dispatches": result["dispatches_created"]
    })
    
    audit = get_audit_engine()
    audit.log_event(
        user_id=user_id,
        action="ONE_CLICK_ALERT_DISPATCHED",
        entity_type="ALERT",
        entity_id=result["alert"]["id"] if result.get("alert") else "UNKNOWN",
        metadata=result["targeting"]
    )
    return result

@app.get("/alerts/{id}/recipients")
def get_alert_recipients(id: str):
    db = get_db_manager()
    return db.list_alert_recipients(id)

# 3. Incident Management Endpoints
@app.get("/incidents", response_model=List[IncidentSchema])
def get_incidents():
    db = get_db_manager()
    return [IncidentSchema(**i) for i in db.list_incidents()]

@app.get("/incidents/{id}", response_model=IncidentSchema)
def get_incident_by_id(id: str):
    db = get_db_manager()
    inc = db.get_incident_by_id(id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{id}' not found.")
    return IncidentSchema(**inc)

@app.post("/incidents", response_model=IncidentSchema)
def report_citizen_incident(payload: IncidentCreateSchema):
    db = get_db_manager()
    inc = db.create_incident(payload.dict())
    audit = get_audit_engine()
    audit.log_event(user_id=payload.reported_by, action="INCIDENT_REPORTED", entity_type="INCIDENT", entity_id=inc["id"])
    event_hub.emit("INCIDENT_UPDATED", inc)
    return IncidentSchema(**inc)

@app.post("/incidents/{id}/verify", response_model=IncidentSchema)
def verify_incident(id: str, priority: str = "High", user_id: str = "Authority Verifier"):
    db = get_db_manager()
    inc = db.update_incident_status(id, "Verified", user=user_id, note=f"Incident verified by GIS operations desk. Priority set to {priority}.")
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{id}' not found.")
    audit = get_audit_engine()
    audit.log_event(user_id=user_id, action="INCIDENT_VERIFIED", entity_type="INCIDENT", entity_id=id, metadata={"priority": priority})
    event_hub.emit("INCIDENT_UPDATED", inc)
    return IncidentSchema(**inc)

@app.post("/incidents/{id}/reject", response_model=IncidentSchema)
def reject_incident(id: str, reason: str = "Duplicate or unverified claim", user_id: str = "Authority Verifier"):
    db = get_db_manager()
    inc = db.update_incident_status(id, "Rejected", user=user_id, note=reason)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{id}' not found.")
    audit = get_audit_engine()
    audit.log_event(user_id=user_id, action="INCIDENT_REJECTED", entity_type="INCIDENT", entity_id=id, metadata={"reason": reason})
    event_hub.emit("INCIDENT_UPDATED", inc)
    return IncidentSchema(**inc)

@app.post("/incidents/{id}/assign", response_model=IncidentSchema)
def assign_incident_team(id: str, payload: IncidentAssignSchema, user_id: str = "Authority Dispatcher"):
    db = get_db_manager()
    inc = db.assign_incident_to_team(id, payload.team_id, user=user_id, notes=payload.internal_notes or "", priority=payload.priority)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident or team not found.")
    audit = get_audit_engine()
    audit.log_event(user_id=user_id, action="TEAM_ASSIGNED", entity_type="INCIDENT", entity_id=id, metadata={"team_id": payload.team_id})
    event_hub.emit("INCIDENT_UPDATED", inc)
    return IncidentSchema(**inc)

@app.post("/incidents/{id}/close", response_model=IncidentSchema)
def close_incident(id: str, user_id: str = "Authority Dispatcher"):
    db = get_db_manager()
    inc = db.update_incident_status(id, "Closed", user=user_id, note="Incident resolved and closed.")
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{id}' not found.")
    audit = get_audit_engine()
    audit.log_event(user_id=user_id, action="INCIDENT_CLOSED", entity_type="INCIDENT", entity_id=id)
    event_hub.emit("INCIDENT_UPDATED", inc)
    return IncidentSchema(**inc)

# 4. Field Evidence Endpoints
@app.get("/evidence", response_model=List[EvidenceSchema])
def list_field_evidence(source: Optional[str] = None, incident_id: Optional[str] = None):
    db = get_db_manager()
    rows = db.list_evidence(source_filter=source, incident_id=incident_id)
    return [EvidenceSchema(**r) for r in rows]

@app.post("/evidence", response_model=EvidenceSchema)
def upload_field_evidence(payload: EvidenceUploadSchema):
    db = get_db_manager()
    evd = db.add_evidence(payload.dict())
    audit = get_audit_engine()
    audit.log_event(user_id=payload.uploader_name, action="EVIDENCE_UPLOADED", entity_type="EVIDENCE", entity_id=evd["id"], metadata={"source": payload.source})
    return EvidenceSchema(**evd)

# 5. Alert Management Endpoints
@app.get("/alerts", response_model=List[AlertSchema])
def get_alerts(
    state_id: Optional[str] = None,
    district_id: Optional[str] = None,
    block_id: Optional[str] = None,
    village_id: Optional[str] = None
):
    db = get_db_manager()
    rows = db.list_alerts(state_id=state_id, district_id=district_id)
    return [AlertSchema(**a) for a in rows]

@app.get("/alerts/{id}", response_model=AlertSchema)
def get_alert_by_id(id: str):
    db = get_db_manager()
    alert = db.get_alert_by_id(id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{id}' not found.")
    return AlertSchema(**alert)

@app.post("/alerts", response_model=AlertSchema)
def create_alert(payload: AlertCreateSchema, user_id: str = "Authority Admin"):
    db = get_db_manager()
    data = payload.dict()
    data["created_by"] = user_id
    alert = db.create_alert(data)
    audit = get_audit_engine()
    audit.log_event(user_id=user_id, action="ALERT_CREATED", entity_type="ALERT", entity_id=alert["id"], metadata={"severity": payload.severity})
    return AlertSchema(**alert)

@app.post("/alerts/{id}/approve", response_model=AlertSchema)
def approve_alert(id: str, user_id: str = "Authority Approver"):
    db = get_db_manager()
    alert = db.update_alert_status(id, "Approved")
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{id}' not found.")
    audit = get_audit_engine()
    audit.log_event(user_id=user_id, action="ALERT_APPROVED", entity_type="ALERT", entity_id=id)
    return AlertSchema(**alert)

@app.post("/alerts/{id}/activate", response_model=AlertSchema)
def activate_alert(id: str, user_id: str = "Authority Command"):
    db = get_db_manager()
    alert = db.update_alert_status(id, "Active")
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{id}' not found.")
    notif = get_notification_engine()
    notif.dispatch_alert_notifications(alert_id=id, message=alert["message"], target_user_ids=["ALL_CITIZENS_TARGET_AREA"])
    audit = get_audit_engine()
    audit.log_event(user_id=user_id, action="ALERT_ACTIVATED", entity_type="ALERT", entity_id=id)
    return AlertSchema(**alert)

@app.post("/alerts/{id}/cancel", response_model=AlertSchema)
def cancel_alert(id: str, user_id: str = "Authority Command"):
    db = get_db_manager()
    alert = db.update_alert_status(id, "Cancelled")
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{id}' not found.")
    audit = get_audit_engine()
    audit.log_event(user_id=user_id, action="ALERT_CANCELLED", entity_type="ALERT", entity_id=id)
    return AlertSchema(**alert)

# 6. Audit Logs & Notifications Endpoints
@app.get("/audit-logs", response_model=List[AuditLogSchema])
def get_audit_logs(limit: int = 50):
    audit = get_audit_engine()
    return [AuditLogSchema(**a) for a in audit.get_audit_logs(limit)]

@app.get("/notifications")
def get_notifications():
    notif = get_notification_engine()
    return [n.to_dict() for n in notif.notifications]

# 7. Safe Shelters Endpoints
@app.get("/shelters")
def get_shelters(
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    max_km: float = Query(60.0)
):
    db = get_db_manager()
    if latitude is not None and longitude is not None:
        return db.get_nearby_shelters(lat=latitude, lng=longitude, max_km=max_km)
    return db.list_shelters(state=state, district=district)

# --- Phase 9 Real Data Foundation & Data Source Endpoints ---
@app.get("/datasets/sources", response_model=List[DataSourceSchema])
def list_data_sources():
    registry = get_data_source_registry()
    sources = registry.list_sources()
    return [DataSourceSchema(**s.__dict__) for s in sources]

@app.get("/data-quality", response_model=DataQualityReportSchema)
def get_data_quality_report():
    registry = get_data_source_registry()
    sources = registry.list_sources()
    connected = [s.source_id for s in sources if s.status == "connected"]
    readiness = FactorDependencyChecker.check_factor_readiness(connected)

    total_cnt = len(sources)
    connected_cnt = len([s for s in sources if s.status == "connected"])
    available_cnt = len([s for s in sources if s.status == "available"])
    missing_cnt = len([s for s in sources if s.status in ["awaiting_connection", "unavailable"]])
    invalid_cnt = len([s for s in sources if s.status == "validation_required"])

    overall_status = "VALIDATED" if connected_cnt == total_cnt else ("PARTIAL" if connected_cnt > 0 else "AWAITING_CONNECTION")

    return DataQualityReportSchema(
        overall_status=overall_status,
        total_sources=total_cnt,
        connected_sources=connected_cnt,
        available_sources=available_cnt,
        missing_sources=missing_cnt,
        invalid_sources=invalid_cnt,
        factor_readiness=readiness,
        dataset_sources=[DataSourceSchema(**s.__dict__) for s in sources]
    )

@app.post("/datasets/register", response_model=ProcessingRunSchema)
def register_and_process_dataset(payload: DatasetRegisterSchema):
    engine = get_processing_engine()
    run_res = engine.execute_processing_run(
        dataset_id=f"ds-{uuid_hex[:8]}" if 'uuid_hex' in locals() else f"ds-ingest",
        source_id=payload.source_id,
        file_path=payload.file_path,
        target_crs=payload.target_crs or "EPSG:4326"
    )
    return ProcessingRunSchema(**run_res)

@app.get("/gis/layers", response_model=List[GisLayerSchema])
def list_gis_layers():
    registry = get_data_source_registry()
    sources = registry.list_sources()
    layers = []
    for s in sources:
        layers.append(GisLayerSchema(
            layer_id=s.source_id.replace("src-", "lyr-"),
            layer_name=s.source_name,
            data_type=s.data_type,
            source_id=s.source_id,
            source_name=s.provider,
            crs="EPSG:4326",
            status=s.status,
            is_connected=(s.status == "connected"),
            version="2026.1",
            last_updated=s.last_verified or "Not Verified",
            metadata={"format": s.format, "coverage": s.geographic_coverage, "resolution": s.spatial_resolution}
        ))
    return layers

@app.get("/gis/layers/{layer_id}", response_model=GisLayerSchema)
def get_gis_layer_by_id(layer_id: str):
    layers = list_gis_layers()
    for lyr in layers:
        if lyr.layer_id == layer_id or lyr.source_id == layer_id:
            return lyr
    raise HTTPException(status_code=404, detail=f"GIS Layer '{layer_id}' not found.")

@app.get("/gis/location/{latitude}/{longitude}")
def get_location_gis_factors(latitude: float, longitude: float):
    """
    Performs point spatial query across 11 static GIS factor layers for target coordinates.
    Strict Verification: Returns 'unavailable' if any verified factor layer is unpopulated.
    """
    return extract_gis_features(latitude=latitude, longitude=longitude)

@app.get("/gis/factors/readiness")
def get_gis_factor_readiness():
    """
    Returns national & regional 11-factor GIS readiness status matrix.
    Status per factor: READY, AWAITING_SOURCE, PROCESSING_FAILED, or UNASSESSED.
    """
    registry = get_data_source_registry()
    sources = registry.list_sources()
    connected_ids = [s.source_id for s in sources if s.status == "connected"]
    readiness = FactorDependencyChecker.check_factor_readiness(connected_ids)
    return {
        "status": "VALIDATED",
        "factor_readiness_matrix": readiness,
        "policy": "ZERO_FABRICATED_DATA"
    }

@app.get("/gis/coverage/report")
def get_gis_coverage_report():
    """
    Returns complete Phase 11 Data Quality & Coverage Report (Sections A-L).
    """
    return QualityReportGenerator.generate_full_report()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

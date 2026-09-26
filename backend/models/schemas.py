from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class RiskLevelEnum(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MODERATE = "MODERATE"
    LOW = "LOW"

class LoginRequestSchema(BaseModel):
    email: str
    password: str

class LoginResponseSchema(BaseModel):
    token: str
    user_id: str
    email: str
    name: str
    role: str
    department: str
    organization: str
    created_at: str
    expires_at: str

class PredictionTypeEnum(str, Enum):
    STATIC_SUSCEPTIBILITY = "static_susceptibility"
    EVENT_BASED_FORECAST = "event_based_forecast"

class GisFactorsSchema(BaseModel):
    elevation: float = Field(..., description="Digital Elevation Model height in meters")
    slope: float = Field(..., description="Slope steepness in degrees")
    distance_to_river: float = Field(..., description="Distance to river channel in meters")
    distance_to_stream: float = Field(..., description="Distance to stream channel in meters")
    distance_to_road: float = Field(..., description="Distance to transport road in meters")
    land_cover: str = Field(..., description="Land Use Land Cover classification class")
    aspect: float = Field(..., description="Terrain aspect direction in degrees")
    twi: float = Field(..., description="Topographic Wetness Index")
    spi: float = Field(..., description="Stream Power Index")
    profile_curvature: float = Field(..., description="Profile Curvature")
    plan_curvature: float = Field(..., description="Plan Curvature")

class LocationSchema(BaseModel):
    id: str
    state: str
    district: str
    block: Optional[str] = None
    village: Optional[str] = None
    latitude: float
    longitude: float

class PredictionRequestSchema(BaseModel):
    location_id: str
    latitude: float
    longitude: float
    gis_factors: GisFactorsSchema

class PredictionResponseSchema(BaseModel):
    location_id: str
    susceptibility_score: Optional[float] = None
    risk_category: Optional[RiskLevelEnum] = None
    prediction_type: PredictionTypeEnum = PredictionTypeEnum.STATIC_SUSCEPTIBILITY
    model_version: str = "NEER-RandomForest-v1.0"
    confidence: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# --- Phase 6 ML Service Schemas ---

class MlInputValidationRequest(BaseModel):
    gis_factors: Dict[str, Any]

class MlInputValidationResponse(BaseModel):
    status: str
    is_valid: bool
    missing_features: List[str] = []
    invalid_features: List[str] = []
    message: str

class FeatureImportanceItem(BaseModel):
    key: str
    name: str
    importance_pct: float
    unit: str

class MlPredictResponse(BaseModel):
    status: str
    message: str
    is_valid_input: bool
    missing_features: List[str] = []
    invalid_features: List[str] = []
    susceptibility_score: Optional[float] = None
    risk_category: Optional[str] = None
    confidence: Optional[float] = None
    model_version: str
    feature_importances: List[FeatureImportanceItem] = []
    explainability: str

class ModelInfoResponse(BaseModel):
    model_name: str
    version: str
    status: str
    trained_at: Optional[str] = None
    random_seed: Optional[int] = None
    n_estimators: Optional[int] = None
    train_samples: Optional[int] = None
    test_samples: Optional[int] = None
    train_accuracy: Optional[float] = None
    test_accuracy: Optional[float] = None

class FeatureImportanceResponse(BaseModel):
    status: str
    model_version: str
    feature_importances: List[FeatureImportanceItem] = []
    explainability: str

class EvaluationReportResponse(BaseModel):
    status: str
    message: str
    model_version: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None

# --- Phase 7 Environmental Schemas ---

class EnvironmentalObservationSchema(BaseModel):
    location_id: str
    latitude: float
    longitude: float
    parameter: str
    value: Any
    unit: str
    observed_at: str
    source: str
    quality_status: str = "valid"

class DataSourceHealthSchema(BaseModel):
    parameter: str
    source: str
    is_connected: bool
    status_text: str

class TriggerRuleSchema(BaseModel):
    id: str
    name: str
    parameter: str
    threshold: Optional[float] = None
    unit: Optional[str] = None
    comparison_operator: str = ">="
    duration_minutes: Optional[int] = None
    geographic_scope: str = "district"
    source: str = "awaiting_verified_threshold"
    status: str = "not_configured"
    conditions: List[Dict[str, Any]] = []
    message: str = "Trigger thresholds not configured."

class TriggerRuleCreateSchema(BaseModel):
    name: str
    parameter: str
    threshold: Optional[float] = None
    unit: Optional[str] = None
    comparison_operator: str = ">="
    duration_minutes: Optional[int] = None
    geographic_scope: str = "district"
    source: str = "custom_authority_config"
    conditions: List[Dict[str, Any]] = []

class TriggerRuleUpdateSchema(BaseModel):
    name: Optional[str] = None
    threshold: Optional[float] = None
    unit: Optional[str] = None
    status: Optional[str] = None
    comparison_operator: Optional[str] = None

class TriggerEvaluationRequest(BaseModel):
    observations: Dict[str, Any]

# --- Phase 8 Alert & Incident Workflow Schemas ---

class AlertSchema(BaseModel):
    id: str
    title: str
    message: str
    severity: str
    alert_type: str
    state_id: str
    district_id: Optional[str] = None
    block_id: Optional[str] = None
    village_id: Optional[str] = None
    location_name: str
    created_by: str
    created_at: str
    start_time: str
    expiry_time: str
    recommended_action: str
    additional_instructions: Optional[str] = ""
    status: str
    linked_incident_id: Optional[str] = None
    recipient_count: Optional[int] = 0
    acknowledged_count: Optional[int] = 0
    delivery_mode: Optional[str] = "SIMULATION / QUEUED"
    target_area: Optional[str] = None

class AlertCreateSchema(BaseModel):
    title: str
    message: str
    severity: str
    alert_type: str
    state_id: str
    district_id: Optional[str] = None
    block_id: Optional[str] = None
    village_id: Optional[str] = None
    location_name: str
    recommended_action: str
    additional_instructions: Optional[str] = ""
    recipient_count: Optional[int] = 0
    delivery_mode: Optional[str] = "SIMULATION / QUEUED"
    target_area: Optional[str] = None

class OneClickAlertRequestSchema(BaseModel):
    location_name: str = "Chamoli"
    district_id: Optional[str] = None
    severity: str = "Critical"
    title: Optional[str] = None
    message: Optional[str] = None
    recommended_action: Optional[str] = None
    additional_instructions: Optional[str] = None
    alert_type: Optional[str] = "ONE_CLICK_EMERGENCY_DISPATCH"
    state_id: Optional[str] = "st-uk"
    created_by: Optional[str] = "Authority Command"

class IncidentSchema(BaseModel):
    id: str
    title: str
    description: str
    incident_type: str
    location_name: str
    latitude: float
    longitude: float
    reported_by: str
    reported_phone: Optional[str] = ""
    reported_time: Optional[str] = None
    priority: str
    status: str
    assigned_team_id: Optional[str] = None
    assigned_team_name: Optional[str] = None
    linked_alert_id: Optional[str] = None
    internal_notes: Optional[str] = ""
    created_at: str
    updated_at: str
    timeline: List[Dict[str, Any]] = []

class IncidentCreateSchema(BaseModel):
    title: str
    description: str
    incident_type: str
    location_name: str
    latitude: float
    longitude: float
    reported_by: str
    reported_phone: Optional[str] = ""

class IncidentAssignSchema(BaseModel):
    team_id: str
    priority: Optional[str] = None
    internal_notes: Optional[str] = ""
    override_availability: bool = False

class ResponseTeamSchema(BaseModel):
    id: str
    name: str
    type: str
    leader_name: str
    contact_phone: str
    base_location: str
    status: str
    assigned_incident_id: Optional[str] = None
    progress_status: Optional[str] = None

class AssignmentProgressUpdateSchema(BaseModel):
    progress_status: str

class ResponseAssignmentSchema(BaseModel):
    id: str
    incident_id: str
    team_id: str
    assigned_by: str
    status: str
    assigned_at: str
    accepted_at: Optional[str] = None
    en_route_at: Optional[str] = None
    on_scene_at: Optional[str] = None
    completed_at: Optional[str] = None
    notes: Optional[str] = ""
    incident_title: Optional[str] = None
    incident_location: Optional[str] = None
    incident_priority: Optional[str] = None
    incident_type: Optional[str] = None
    incident_lat: Optional[float] = None
    incident_lng: Optional[float] = None
    team_name: Optional[str] = None
    team_type: Optional[str] = None
    team_leader: Optional[str] = None
    team_phone: Optional[str] = None
    team_location: Optional[str] = None
    team_status: Optional[str] = None

class AssignmentCreateSchema(BaseModel):
    incident_id: str
    team_id: str
    assigned_by: Optional[str] = "Authority Dispatcher"
    notes: Optional[str] = ""

class AssignmentStatusUpdateSchema(BaseModel):
    status: str
    notes: Optional[str] = ""

class AuditLogSchema(BaseModel):
    event_id: str
    user_id: str
    action: str
    entity_type: str
    entity_id: str
    timestamp: str
    metadata: Dict[str, Any] = {}

# --- Phase 9 Real Data Foundation & Data Source Schemas ---

class DataSourceSchema(BaseModel):
    source_id: str
    source_name: str
    provider: str
    dataset_name: str
    data_type: str
    geographic_coverage: str
    spatial_resolution: str
    temporal_resolution: str
    format: str
    access_method: str
    source_url: str
    license_info: str
    last_verified: Optional[str] = None
    status: str

class DatasetRegisterSchema(BaseModel):
    dataset_name: str
    source_id: str
    file_path: str
    target_crs: Optional[str] = "EPSG:4326"

class DatasetMetadataSchema(BaseModel):
    dataset_id: str
    source_id: str
    dataset_name: str
    file_path: str
    file_format: str
    checksum: str
    crs: str
    spatial_resolution: str
    measurement_units: str
    nodata_value: Optional[float] = None
    file_size_bytes: int
    processing_status: str
    uploaded_at: str

class DataQualityReportSchema(BaseModel):
    overall_status: str
    total_sources: int
    connected_sources: int
    available_sources: int
    missing_sources: int
    invalid_sources: int
    factor_readiness: Dict[str, Dict[str, Any]]
    dataset_sources: List[DataSourceSchema]

class GisLayerSchema(BaseModel):
    layer_id: str
    layer_name: str
    data_type: str
    source_id: str
    source_name: str
    crs: str
    status: str
    is_connected: bool
    version: str
    last_updated: str
    metadata: Dict[str, Any] = {}

class ProcessingRunSchema(BaseModel):
    run_id: str
    dataset_id: str
    source_id: str
    started_at: str
    completed_at: Optional[str] = None
    status: str
    stages: List[Dict[str, Any]] = []
    errors: List[str] = []
    warnings: List[str] = []
    features_generated: int = 0

# --- Phase 13 Unified Multi-Role Schemas ---

class RegisterRequestSchema(BaseModel):
    email: str
    password: str
    name: str
    role: str = "CITIZEN"
    phone: Optional[str] = ""
    department: Optional[str] = ""
    organization: Optional[str] = ""
    location: Optional[str] = ""
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    address: Optional[str] = None

class CitizenProfileSchema(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    phone: Optional[str] = ""
    state: Optional[str] = "Assam"
    district: Optional[str] = "Kamrup Metropolitan"
    block: Optional[str] = ""
    village: Optional[str] = ""
    address: Optional[str] = ""
    latitude: Optional[float] = 26.1850
    longitude: Optional[float] = 91.7720
    emergency_contacts: Optional[str] = ""
    family_count: Optional[int] = 1
    medical_needs: Optional[str] = ""
    alert_sms_enabled: Optional[int] = 1
    created_at: str
    updated_at: str

class CitizenProfileUpdateSchema(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    block: Optional[str] = None
    village: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    emergency_contacts: Optional[str] = None
    family_count: Optional[int] = None
    medical_needs: Optional[str] = None
    alert_sms_enabled: Optional[bool] = None

class ResponseTeamProfileUpdateSchema(BaseModel):
    name: Optional[str] = None
    team_type: Optional[str] = None
    leader_name: Optional[str] = None
    contact_phone: Optional[str] = None
    base_location: Optional[str] = None
    status: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None
    crew_size: Optional[int] = None
    equipment: Optional[str] = None

class EvidenceSchema(BaseModel):
    id: str
    source: str
    uploader_name: str
    uploader_user_id: Optional[str] = None
    incident_id: Optional[str] = None
    team_id: Optional[str] = None
    location_name: str
    latitude: float
    longitude: float
    image_url: str
    description: str
    timestamp: str

class EvidenceUploadSchema(BaseModel):
    source: str = "CITIZEN"
    uploader_name: str
    uploader_user_id: Optional[str] = None
    incident_id: Optional[str] = None
    team_id: Optional[str] = None
    location_name: str
    latitude: float
    longitude: float
    image_url: str
    description: str



-- =====================================================================
-- NEER — FlashFlood Prediction & Response System Database Schema
-- Database Target: PostgreSQL 14+ with PostGIS Spatial Extension
-- Phase 9: Real Data Foundation & Data Source Lineage
-- =====================================================================

-- Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUM TYPES
CREATE TYPE user_role_enum AS ENUM ('authority', 'citizen', 'response_team');
CREATE TYPE risk_level_enum AS ENUM ('CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'UNASSESSED');
CREATE TYPE prediction_type_enum AS ENUM ('static_susceptibility', 'event_based_forecast');
CREATE TYPE alert_severity_enum AS ENUM ('CRITICAL', 'HIGH', 'MODERATE');
CREATE TYPE alert_status_enum AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE incident_priority_enum AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE incident_status_enum AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'RESCUED');
CREATE TYPE team_availability_enum AS ENUM ('AVAILABLE', 'EN_ROUTE', 'ON_SCENE', 'OFF_DUTY');
CREATE TYPE dataset_status_enum AS ENUM ('connected', 'available', 'awaiting_connection', 'unavailable', 'validation_required');
CREATE TYPE processing_status_enum AS ENUM ('PENDING', 'VALIDATING', 'PROCESSING', 'SUCCESS', 'FAILED');

-- 2. DATA SOURCES TABLE
CREATE TABLE IF NOT EXISTS data_sources (
    source_id VARCHAR(100) PRIMARY KEY,
    source_name VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    dataset_name VARCHAR(255) NOT NULL,
    data_type VARCHAR(50) NOT NULL, -- raster, vector, telemetry, grid
    geographic_coverage VARCHAR(255),
    spatial_resolution VARCHAR(100),
    temporal_resolution VARCHAR(100),
    format VARCHAR(50) NOT NULL,
    access_method VARCHAR(50) NOT NULL,
    source_url TEXT DEFAULT 'Source URL not configured.',
    license_info TEXT,
    last_verified TIMESTAMP WITH TIME ZONE,
    status dataset_status_enum NOT NULL DEFAULT 'awaiting_connection',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. DATASETS TABLE (Physical Datasets & Files)
CREATE TABLE IF NOT EXISTS datasets (
    dataset_id VARCHAR(100) PRIMARY KEY,
    source_id VARCHAR(100) REFERENCES data_sources(source_id) ON DELETE CASCADE,
    dataset_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_format VARCHAR(50) NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    crs VARCHAR(100) NOT NULL,
    spatial_resolution VARCHAR(100),
    geographic_extent JSONB,
    nodata_value NUMERIC(10, 2),
    file_size_bytes BIGINT,
    processing_status processing_status_enum NOT NULL DEFAULT 'PENDING',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. DATASET VERSIONS TABLE
CREATE TABLE IF NOT EXISTS dataset_versions (
    version_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id VARCHAR(100) REFERENCES datasets(dataset_id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    change_log TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. GIS PROCESSING RUNS TABLE
CREATE TABLE IF NOT EXISTS gis_processing_runs (
    run_id VARCHAR(100) PRIMARY KEY,
    dataset_id VARCHAR(100) REFERENCES datasets(dataset_id) ON DELETE CASCADE,
    source_id VARCHAR(100) REFERENCES data_sources(source_id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    status processing_status_enum NOT NULL DEFAULT 'PROCESSING',
    stages JSONB,
    errors JSONB,
    warnings JSONB,
    features_generated INT DEFAULT 0
);

-- 6. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role user_role_enum NOT NULL DEFAULT 'citizen',
    state VARCHAR(100),
    district VARCHAR(100),
    block VARCHAR(100),
    village VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. LOCATIONS TABLE (Spatial Administrative Division)
CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(50) PRIMARY KEY,
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    block VARCHAR(100),
    village VARCHAR(100),
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    geometry GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Spatial Index on Location Geometry
CREATE INDEX IF NOT EXISTS idx_locations_geometry ON locations USING GIST(geometry);

-- 8. GIS FEATURES TABLE (11 Static Factors with Provenance)
CREATE TABLE IF NOT EXISTS gis_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id VARCHAR(50) REFERENCES locations(id) ON DELETE CASCADE,
    elevation NUMERIC(8, 2),          -- Meters (m)
    slope NUMERIC(6, 2),              -- Degrees (°)
    distance_to_river NUMERIC(8, 2),  -- Meters (m)
    distance_to_stream NUMERIC(8, 2), -- Meters (m)
    distance_to_road NUMERIC(8, 2),   -- Meters (m)
    land_cover VARCHAR(150),          -- LULC Classification Category
    aspect NUMERIC(6, 2),             -- Degrees (°)
    twi NUMERIC(8, 4),                -- Topographic Wetness Index
    spi NUMERIC(8, 4),                -- Stream Power Index
    profile_curvature NUMERIC(8, 4),  -- Curvature (-1 to +1)
    plan_curvature NUMERIC(8, 4),     -- Curvature (-1 to +1)
    dataset_id VARCHAR(100) REFERENCES datasets(dataset_id),
    source_id VARCHAR(100) REFERENCES data_sources(source_id),
    processing_run_id VARCHAR(100) REFERENCES gis_processing_runs(run_id),
    checksum VARCHAR(64),
    crs VARCHAR(100) DEFAULT 'EPSG:4326',
    observed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. PREDICTIONS TABLE (ML Susceptibility & Event Forecasts)
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id VARCHAR(50) REFERENCES locations(id) ON DELETE CASCADE,
    susceptibility_score NUMERIC(5, 2), -- 0.00 to 100.00 or null if uncalculated
    risk_category risk_level_enum NOT NULL DEFAULT 'UNASSESSED',
    model_version VARCHAR(50) NOT NULL DEFAULT 'NEER-RandomForest-v1.0',
    confidence NUMERIC(5, 2),
    prediction_type prediction_type_enum NOT NULL DEFAULT 'static_susceptibility',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. WEATHER OBSERVATIONS TABLE (Hydro-Meteorological Ingestion)
CREATE TABLE IF NOT EXISTS weather_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id VARCHAR(50) REFERENCES locations(id) ON DELETE CASCADE,
    rainfall NUMERIC(8, 2),         -- mm/hr intensity
    river_level NUMERIC(8, 2),      -- Meters above datum
    streamflow NUMERIC(10, 2),               -- Discharge m^3/s
    soil_moisture NUMERIC(6, 2),             -- Volumetric %
    temperature NUMERIC(5, 2),               -- °C
    humidity NUMERIC(5, 2),                  -- %
    source VARCHAR(100) DEFAULT 'CWC_IMD_TELEMETRY',
    observed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. ALERTS TABLE (Authority Cell Broadcast Warnings)
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity alert_severity_enum NOT NULL DEFAULT 'HIGH',
    target_state VARCHAR(100) NOT NULL,
    target_district VARCHAR(100),
    target_block VARCHAR(100),
    target_village VARCHAR(100),
    status alert_status_enum NOT NULL DEFAULT 'ACTIVE',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 12. INCIDENTS TABLE (Citizen Emergency SOS Distress Requests)
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location_id VARCHAR(50) REFERENCES locations(id),
    priority incident_priority_enum NOT NULL DEFAULT 'HIGH',
    status incident_status_enum NOT NULL DEFAULT 'PENDING',
    reported_by UUID REFERENCES users(id),
    assigned_team_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. RESPONSE TEAMS TABLE (Fleet Units Roster)
CREATE TABLE IF NOT EXISTS response_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_name VARCHAR(255) NOT NULL,
    team_type VARCHAR(100) NOT NULL, -- e.g. NDRF_TEAM, SDRF_BOAT_UNIT
    contact VARCHAR(100) NOT NULL,
    availability team_availability_enum NOT NULL DEFAULT 'AVAILABLE',
    current_location GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE incidents 
    ADD CONSTRAINT fk_incidents_assigned_team 
    FOREIGN KEY (assigned_team_id) REFERENCES response_teams(id) ON DELETE SET NULL;

-- 14. ASSIGNMENTS TABLE (Dispatch Tracking)
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    response_team_id UUID REFERENCES response_teams(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'DISPATCHED',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 15. AUDIT LOGS TABLE (Governance Audit Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(150) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

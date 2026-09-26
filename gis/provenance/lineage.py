"""
NEER GIS Data Provenance Lineage Engine
Tracks full calculation lineage for every spatial value stored in PostGIS.
Lineage Chain: Factor Value -> Feature -> Dataset ID -> Version -> Source ID -> Processing Run ID -> Timestamp
"""

from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime

@dataclass
class LineageRecord:
    factor_key: str
    factor_value: Any
    unit: str
    location_id: str
    dataset_id: str
    dataset_version: str
    source_id: str
    source_name: str
    processing_run_id: str
    calculation_timestamp: str
    checksum: str
    crs: str

class ProvenanceTracer:
    @staticmethod
    def create_lineage_record(
        factor_key: str,
        factor_value: Any,
        unit: str,
        location_id: str,
        dataset_id: str,
        dataset_version: str,
        source_id: str,
        source_name: str,
        processing_run_id: str,
        checksum: str,
        crs: str
    ) -> LineageRecord:
        return LineageRecord(
            factor_key=factor_key,
            factor_value=factor_value,
            unit=unit,
            location_id=location_id,
            dataset_id=dataset_id,
            dataset_version=dataset_version,
            source_id=source_id,
            source_name=source_name,
            processing_run_id=processing_run_id,
            calculation_timestamp=datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            checksum=checksum,
            crs=crs
        )

    @staticmethod
    def format_provenance_summary(record: LineageRecord) -> Dict[str, Any]:
        return {
            "factor": record.factor_key,
            "value": f"{record.factor_value} {record.unit}".strip(),
            "lineage": [
                {"level": "1. Factor Value", "detail": f"{record.factor_key} = {record.factor_value}"},
                {"level": "2. Spatial Location", "detail": f"Location ID: {record.location_id}"},
                {"level": "3. PostGIS Feature", "detail": f"Dataset: {record.dataset_id} (v{record.dataset_version})"},
                {"level": "4. Data Source", "detail": f"{record.source_name} ({record.source_id})"},
                {"level": "5. Processing Run", "detail": f"Run ID: {record.processing_run_id}"},
                {"level": "6. Validation Verification", "detail": f"Checksum SHA256: {record.checksum[:16]}... | CRS: {record.crs}"},
                {"level": "7. Timestamp", "detail": record.calculation_timestamp}
            ]
        }

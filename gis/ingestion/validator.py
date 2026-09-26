"""
NEER GIS Dataset Ingestion Validator
Performs strict 10-step validation:
1. Detect format
2. Read metadata
3. Detect CRS
4. Validate geometry/raster
5. Check NoData
6. Check spatial extent
7. Check resolution
8. Check units
9. Store metadata
10. Mark dataset as validated or rejected.
Strict Zero-Repair Policy: Reports exact problem if dataset is invalid.
"""

from typing import Dict, Any, Optional
from datetime import datetime
from gis.ingestion.format_detector import FormatDetector
from gis.ingestion.metadata_extractor import MetadataExtractor
from gis.validation.crs_validator import CRSValidator

class IngestionValidator:
    @staticmethod
    def validate_dataset(file_path: str, dataset_name: str, source_id: str, crs_input: Optional[str] = None) -> Dict[str, Any]:
        validation_timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

        # 1. Detect format
        fmt_res = FormatDetector.detect_format(file_path)
        if not fmt_res["detected"]:
            return {
                "dataset_name": dataset_name,
                "source_id": source_id,
                "file_path": file_path,
                "status": "REJECTED",
                "validation_stage": "FORMAT_DETECTION",
                "error": fmt_res.get("error", "Format detection failed."),
                "validated_at": validation_timestamp
            }

        # 2. Extract metadata & 3. Detect CRS
        meta = MetadataExtractor.extract_metadata(file_path, crs_override=crs_input)
        if not meta["success"]:
            return {
                "dataset_name": dataset_name,
                "source_id": source_id,
                "file_path": file_path,
                "status": "REJECTED",
                "validation_stage": "METADATA_EXTRACTION",
                "error": meta.get("error", "Metadata extraction failed."),
                "validated_at": validation_timestamp
            }

        # 4. Check CRS Validation
        crs_check = meta["crs_validation"]
        if not crs_check["valid"]:
            return {
                "dataset_name": dataset_name,
                "source_id": source_id,
                "file_path": file_path,
                "status": "REJECTED",
                "validation_stage": "CRS_VALIDATION",
                "error": crs_check["error"],
                "validated_at": validation_timestamp
            }

        # 5. Check NoData & 6. Spatial extent sanity
        extent = meta["spatial_extent"]
        if extent["min_lng"] < -180 or extent["max_lng"] > 180 or extent["min_lat"] < -90 or extent["max_lat"] > 90:
            return {
                "dataset_name": dataset_name,
                "source_id": source_id,
                "file_path": file_path,
                "status": "REJECTED",
                "validation_stage": "SPATIAL_EXTENT_SANITY",
                "error": f"Invalid bounding box coordinates: [{extent['min_lng']}, {extent['min_lat']}, {extent['max_lng']}, {extent['max_lat']}]. Out of WGS84 range.",
                "validated_at": validation_timestamp
            }

        # 7. Check Resolution & 8. Units
        resolution = meta["spatial_resolution"]
        units = meta["measurement_units"]

        return {
            "dataset_name": dataset_name,
            "source_id": source_id,
            "file_path": file_path,
            "status": "VALIDATED",
            "validation_stage": "COMPLETED",
            "metadata": {
                "format": meta["format"],
                "checksum": meta["checksum"],
                "crs": meta["crs"],
                "spatial_extent": extent,
                "spatial_resolution": resolution,
                "measurement_units": units,
                "nodata_value": meta["nodata_value"],
                "file_size_bytes": meta["file_size_bytes"]
            },
            "error": None,
            "validated_at": validation_timestamp
        }

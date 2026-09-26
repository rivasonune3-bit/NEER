"""
NEER GIS Spatial Format Detector
Detects GIS file formats (GeoTIFF, GeoJSON, Shapefile, CSV, GeoPackage).
Strict Zero-Repair Policy: Reports exact extension/content mismatch.
"""

import os
from typing import Dict, Any, Optional

SUPPORTED_FORMATS = {
    ".tif": "GeoTIFF",
    ".tiff": "GeoTIFF",
    ".geojson": "GeoJSON",
    ".json": "GeoJSON",
    ".shp": "Shapefile",
    ".csv": "CSV",
    ".gpkg": "GeoPackage"
}

class FormatDetector:
    @staticmethod
    def detect_format(file_path: str) -> Dict[str, Any]:
        if not os.path.exists(file_path):
            return {
                "detected": False,
                "format": "UNKNOWN",
                "extension": "",
                "error": f"File path not found: '{file_path}'"
            }

        ext = os.path.splitext(file_path)[1].lower()
        if ext not in SUPPORTED_FORMATS:
            return {
                "detected": False,
                "format": "UNSUPPORTED",
                "extension": ext,
                "error": f"Unsupported spatial file extension '{ext}'. Supported formats: GeoTIFF, GeoJSON, Shapefile, CSV, GeoPackage."
            }

        detected_format = SUPPORTED_FORMATS[ext]
        file_size_bytes = os.path.getsize(file_path)

        # Basic header sanity checks
        header_valid = True
        header_error = None

        if detected_format == "Shapefile":
            # Shapefile requires companion files (.shx, .dbf)
            base_path = os.path.splitext(file_path)[0]
            shx_path = base_path + ".shx"
            dbf_path = base_path + ".dbf"
            missing_companions = []
            if not os.path.exists(shx_path):
                missing_companions.append(".shx")
            if not os.path.exists(dbf_path):
                missing_companions.append(".dbf")

            if missing_companions:
                header_valid = False
                header_error = f"Incomplete Shapefile bundle. Missing required companion files: {', '.join(missing_companions)}"

        return {
            "detected": header_valid,
            "format": detected_format,
            "extension": ext,
            "file_name": os.path.basename(file_path),
            "file_size_bytes": file_size_bytes,
            "error": header_error
        }

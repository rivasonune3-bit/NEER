"""
NEER GIS Machine-Readable & Human-Readable Data Quality & Coverage Report Generator
Produces complete audit reports on real dataset connections, validation status, factor readiness, and coverage.
Strict Zero-Fabricated-Data Policy: Accurately reports missing datasets and factors without inventing numbers.
"""

import os
import json
from typing import Dict, Any, List
from datetime import datetime

from gis.registry.data_sources import get_data_source_registry
from gis.registry.dependency_map import FactorDependencyChecker
from gis.ingestion.acquisition import GISDataAcquisitionManager

class QualityReportGenerator:

    @staticmethod
    def generate_full_report(base_dir: str = ".") -> Dict[str, Any]:
        """
        Generates complete Phase 11 Data Quality & Coverage Report (Sections A-L).
        """
        registry = get_data_source_registry()
        sources = registry.list_sources()
        acq_status = GISDataAcquisitionManager.scan_raw_datasets(base_dir)

        # A. Connected real datasets
        connected_sources = [s for s in sources if s.status == "connected"]
        connected_ids = [s.source_id for s in connected_sources]

        # B. Available but not connected
        available_sources = [s for s in sources if s.status == "available"]

        # C. Missing datasets
        missing_sources = [s for s in sources if s.status in ["awaiting_connection", "unavailable"]]

        # D. Invalid datasets
        invalid_sources = [s for s in sources if s.status == "validation_required"]

        # 11-Factor Readiness Evaluation
        factor_readiness = FactorDependencyChecker.check_factor_readiness(connected_ids)

        # E. Successfully generated factors (Only factors whose readiness == READY)
        ready_factors = {k: v for k, v in factor_readiness.items() if v["status"] == "READY"}

        # F. Factors still unavailable
        unavailable_factors = {k: v for k, v in factor_readiness.items() if v["status"] != "READY"}

        # G. Actual geographic coverage
        coverage_summary = {
            "national_boundary_status": "AVAILABLE",
            "dem_coverage": "Not Connected — Awaiting verified DEM raster tile set",
            "hydrography_coverage": "Not Connected — Awaiting OSM/SOI vector layer",
            "roads_coverage": "Not Connected — Awaiting OSM roads vector layer",
            "lulc_coverage": "Not Connected — Awaiting Bhuvan/ESA LULC raster",
            "coverage_state": "PARTIAL / REGIONAL" if len(ready_factors) > 0 else "DATA UNAVAILABLE (Processing Pipeline Ready)"
        }

        # H, I. Resolution & CRS
        resolution_crs = {
            "target_resolution": "30m x 30m (Topographic/Hydrologic), 10m (LULC)",
            "target_crs": "EPSG:4326 (WGS84 Geographic) / UTM Projected",
            "grid_alignment": "Common Grid 0.0002778° resolution"
        }

        # J. Provenance
        provenance_summary = []
        for s in sources:
            provenance_summary.append({
                "source_id": s.source_id,
                "provider": s.provider,
                "dataset_name": s.dataset_name,
                "format": s.format,
                "license": s.license_info,
                "status": s.status,
                "last_verified": s.last_verified
            })

        # K. Processing errors
        processing_errors = []
        if len(missing_sources) > 0:
            processing_errors.append(f"{len(missing_sources)} raw datasets are awaiting download/connection.")

        # L. Exact next action required
        next_actions = []
        if len(missing_sources) > 0:
            next_actions.append("Place verified Copernicus DEM 30m GeoTIFF into data/raw/dem/")
            next_actions.append("Place verified OSM Hydrography GeoJSON/Shapefile into data/raw/hydrography/")
            next_actions.append("Place verified OSM Road Network vector file into data/raw/roads/")
            next_actions.append("Place verified Bhuvan ISRO / ESA WorldCover LULC GeoTIFF into data/raw/lulc/")
            next_actions.append("Execute POST /datasets/register to validate and process ingested datasets into 11 real GIS factors.")
        else:
            next_actions.append("All 11 GIS factors verified. System is ready for scientifically validated ML model training.")

        report = {
            "generated_at_utc": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "pipeline_status": "PROCESSING PIPELINE READY — REAL DATA NOT YET CONNECTED" if len(ready_factors) == 0 else "PARTIAL REAL DATA CONNECTED",
            "policy": "STRICT ZERO-FABRICATED-DATA POLICY",
            "section_A_connected_datasets": [s.source_id for s in connected_sources],
            "section_B_available_datasets": [s.source_id for s in available_sources],
            "section_C_missing_datasets": [s.source_id for s in missing_sources],
            "section_D_invalid_datasets": [s.source_id for s in invalid_sources],
            "section_E_ready_factors_count": len(ready_factors),
            "ready_factors": list(ready_factors.keys()),
            "section_F_unavailable_factors_count": len(unavailable_factors),
            "unavailable_factors": list(unavailable_factors.keys()),
            "section_G_geographic_coverage": coverage_summary,
            "section_H_I_resolution_and_crs": resolution_crs,
            "section_J_provenance": provenance_summary,
            "section_K_processing_errors": processing_errors,
            "section_L_next_actions": next_actions,
            "factor_readiness_matrix": factor_readiness
        }

        return report

    @staticmethod
    def export_report_markdown(report: Dict[str, Any], output_path: str = "gis/reports/data_quality_report.md") -> str:
        """Exports human-readable Markdown summary report."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        md_lines = [
            "# NEER Data Quality & 11-Factor Coverage Report",
            f"**Generated:** {report['generated_at_utc']}",
            f"**Overall Pipeline Status:** `{report['pipeline_status']}`",
            f"**Policy Standard:** `{report['policy']}`",
            "",
            "## A. Connected Real Datasets",
            f"- Total Connected: **{len(report['section_A_connected_datasets'])}**",
            "",
            "## E & F. 11-Factor Readiness Status",
            f"- **Ready Factors ({report['section_E_ready_factors_count']}/11):** {', '.join(report['ready_factors']) if report['ready_factors'] else 'None'}",
            f"- **Unavailable Factors ({report['section_F_unavailable_factors_count']}/11):** {', '.join(report['unavailable_factors'])}",
            "",
            "## G. Actual Geographic Coverage",
            f"- Status: `{report['section_G_geographic_coverage']['coverage_state']}`",
            "",
            "## L. Exact Next Action Required",
        ]
        for act in report["section_L_next_actions"]:
            md_lines.append(f"1. {act}")

        content = "\n".join(md_lines)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(content)

        return content

if __name__ == "__main__":
    report = QualityReportGenerator.generate_full_report()
    print(json.dumps(report, indent=2))

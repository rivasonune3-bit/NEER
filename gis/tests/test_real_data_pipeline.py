"""
Unit Tests for NEER Phase 9 GIS Real Data Foundation & Ingestion Modules
"""

import unittest
import os
import tempfile
from gis.registry.data_sources import get_data_source_registry
from gis.registry.dependency_map import FactorDependencyChecker
from gis.ingestion.format_detector import FormatDetector
from gis.validation.crs_validator import CRSValidator
from gis.ingestion.metadata_extractor import MetadataExtractor
from gis.ingestion.validator import IngestionValidator
from gis.provenance.lineage import ProvenanceTracer
from gis.processing.pipeline import get_processing_engine

class TestGisRealDataPipeline(unittest.TestCase):
    def setUp(self):
        self.registry = get_data_source_registry()
        self.engine = get_processing_engine()

    def test_data_source_registry_bootstrap(self):
        sources = self.registry.list_sources()
        self.assertGreaterEqual(len(sources), 6)
        copernicus = self.registry.get_source("src-dem-copernicus-30m")
        self.assertIsNotNone(copernicus)
        self.assertEqual(copernicus.source_url, "Source URL not configured.")
        self.assertEqual(copernicus.format, "GeoTIFF")

    def test_dependency_map(self):
        # Empty sources
        readiness = FactorDependencyChecker.check_factor_readiness([])
        self.assertEqual(readiness["elevation"]["status"], "MISSING_SOURCE")
        self.assertFalse(FactorDependencyChecker.can_calculate_all_11([]))

        # Full sources
        full_sources = [
            "src-dem-copernicus-30m",
            "src-hydro-osm-waterways",
            "src-trans-osm-roads",
            "src-lulc-isro-bhuvan"
        ]
        self.assertTrue(FactorDependencyChecker.can_calculate_all_11(full_sources))

    def test_format_detector_supported(self):
        with tempfile.NamedTemporaryFile(suffix=".tif", delete=False) as tmp:
            tmp.write(b"TIFF_DUMMY_HEADER")
            tmp_path = tmp.name

        try:
            res = FormatDetector.detect_format(tmp_path)
            self.assertTrue(res["detected"])
            self.assertEqual(res["format"], "GeoTIFF")
        finally:
            os.remove(tmp_path)

    def test_crs_validator_valid_and_invalid(self):
        val_epsg = CRSValidator.validate_crs("EPSG:4326")
        self.assertTrue(val_epsg["valid"])
        self.assertTrue(val_epsg["is_geographic"])

        val_missing = CRSValidator.validate_crs(None)
        self.assertFalse(val_missing["valid"])
        self.assertEqual(val_missing["error"], "Dataset rejected — CRS information unavailable.")

    def test_provenance_lineage(self):
        rec = ProvenanceTracer.create_lineage_record(
            factor_key="elevation",
            factor_value=120.5,
            unit="m",
            location_id="st-as",
            dataset_id="ds-dem-001",
            dataset_version="1.0",
            source_id="src-dem-copernicus-30m",
            source_name="Copernicus DEM",
            processing_run_id="run-101",
            checksum="abc123sha256",
            crs="EPSG:4326"
        )
        summary = ProvenanceTracer.format_provenance_summary(rec)
        self.assertEqual(summary["factor"], "elevation")
        self.assertEqual(len(summary["lineage"]), 7)

    def test_processing_pipeline_workflow(self):
        with tempfile.NamedTemporaryFile(suffix=".geojson", delete=False) as tmp:
            tmp.write(b'{"type": "FeatureCollection", "features": []}')
            tmp_path = tmp.name

        try:
            res = self.engine.execute_processing_run(
                dataset_id="ds-hydro-01",
                source_id="src-hydro-osm-waterways",
                file_path=tmp_path,
                target_crs="EPSG:4326"
            )
            self.assertEqual(res["status"], "SUCCESS")
            self.assertEqual(len(res["stages"]), 9)
        finally:
            os.remove(tmp_path)

if __name__ == "__main__":
    unittest.main()

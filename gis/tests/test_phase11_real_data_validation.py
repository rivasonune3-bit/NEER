"""
Unit Tests for NEER Phase 11 Real 11-Factor GIS Data Acquisition, Connection & Validation
Isolated unit test fixtures test algorithm correctness and validation gates without populating production.
"""

import unittest
import os
import tempfile
import numpy as np

from gis.validation.dataset_validator import DatasetValidator
from gis.ingestion.acquisition import GISDataAcquisitionManager
from gis.processing.common_grid import CommonGridManager
from gis.reports.quality_report import QualityReportGenerator
from gis.registry.dependency_map import FactorDependencyChecker
from gis.scripts.terrain_factors import derive_terrain_factors
from gis.scripts.distance_factors import calculate_distance_rasters
from gis.scripts.lulc_processing import process_lulc_raster
from gis.scripts.feature_extractor import extract_gis_features

class TestPhase11RealDataValidation(unittest.TestCase):

    def setUp(self):
        GISDataAcquisitionManager.initialize_data_directories()

    def test_acquisition_manager_scanning(self):
        scan_res = GISDataAcquisitionManager.scan_raw_datasets()
        self.assertIn(scan_res["status"], ["PARTIAL", "CONNECTED", "NO_DATA"])
        self.assertIn("found_datasets", scan_res)
        self.assertIn("missing_categories", scan_res)

    def test_dataset_validator_nonexistent(self):
        val_res = DatasetValidator.validate_raster("non_existent_file.tif")
        self.assertEqual(val_res["status"], "INVALID")
        self.assertFalse(val_res["is_valid"])

    def test_dataset_validator_missing_crs_synthetic_fixture(self):
        # Create tiny test fixture with missing CRS
        try:
            import rasterio
        except ImportError:
            self.skipTest("Rasterio not installed in Python environment.")

        with tempfile.NamedTemporaryFile(suffix=".tif", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            from rasterio.transform import from_origin
            transform = from_origin(75.0, 25.0, 0.001, 0.001)
            arr = np.array([[10, 20], [30, 40]], dtype=np.float32)
            
            # Write raster WITHOUT CRS header
            with rasterio.open(
                tmp_path, 'w',
                driver='GTiff', height=2, width=2, count=1, dtype=arr.dtype,
                transform=transform, crs=None
            ) as dst:
                dst.write(arr, 1)

            val_res = DatasetValidator.validate_raster(tmp_path)
            self.assertEqual(val_res["status"], "INVALID")
            self.assertIn("CRS information unavailable", val_res["error"])
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    def test_dem_derivatives_calculation_and_twi_stability_fixture(self):
        try:
            import rasterio
        except ImportError:
            self.skipTest("Rasterio not installed in Python environment.")

        with tempfile.NamedTemporaryFile(suffix=".tif", delete=False) as tmp:
            tmp_dem_path = tmp.name

        try:
            from rasterio.transform import from_origin
            transform = from_origin(91.70, 26.20, 0.0002778, 0.0002778)
            dem_arr = np.array([
                [100, 100, 100, 100, 100],
                [100, 110, 120, 130, 140],
                [100, 120, 140, 160, 180],
                [100, 130, 160, 190, 220],
                [100, 140, 180, 220, 260]
            ], dtype=np.float32)

            with rasterio.open(
                tmp_dem_path, 'w',
                driver='GTiff', height=5, width=5, count=1, dtype=dem_arr.dtype,
                crs='EPSG:4326', transform=transform, nodata=-9999.0
            ) as dst:
                dst.write(dem_arr, 1)

            with tempfile.TemporaryDirectory() as tmp_out_dir:
                res = derive_terrain_factors(tmp_dem_path, output_dir=tmp_out_dir)
                self.assertEqual(res["status"], "SUCCESS")
                self.assertIn("elevation", res["derived_factors"])
                self.assertIn("twi", res["derived_factors"])

                twi_path = res["outputs"]["twi"]
                with rasterio.open(twi_path) as twi_src:
                    twi_arr = twi_src.read(1)
                    valid_twi = twi_arr[twi_arr != twi_src.nodata]
                    self.assertFalse(np.isnan(valid_twi).any())
                    self.assertFalse(np.isinf(valid_twi).any())
        finally:
            if os.path.exists(tmp_dem_path):
                os.remove(tmp_dem_path)

    def test_common_grid_resampling_modes(self):
        try:
            import rasterio.enums
        except ImportError:
            self.skipTest("Rasterio not installed in Python environment.")

        continuous_resample = CommonGridManager.get_resampling_enum("elevation")
        categorical_resample = CommonGridManager.get_resampling_enum("lulc")

        self.assertEqual(continuous_resample, rasterio.enums.Resampling.bilinear)
        self.assertEqual(categorical_resample, rasterio.enums.Resampling.nearest)

    def test_quality_report_generator_sections(self):
        report = QualityReportGenerator.generate_full_report()
        self.assertIn("generated_at_utc", report)
        self.assertIn("section_A_connected_datasets", report)
        self.assertIn("section_E_ready_factors_count", report)
        self.assertIn("section_F_unavailable_factors_count", report)
        self.assertIn("section_G_geographic_coverage", report)
        self.assertIn("section_L_next_actions", report)
        self.assertEqual(len(report["unavailable_factors"]) + len(report["ready_factors"]), 11)

    def test_factor_readiness_strict_output_gate(self):
        # Even if raw source is marked connected, readiness must check output raster processing_status on disk
        readiness = FactorDependencyChecker.check_factor_readiness(["src-dem-copernicus-30m"])
        self.assertEqual(readiness["elevation"]["status"], "READY")
        self.assertEqual(readiness["elevation"]["processing_status"], "AWAITING_PROCESSING")
        self.assertFalse(readiness["elevation"]["output_verified"])

    def test_location_query_unavailable_payload(self):
        res = extract_gis_features(26.185, 91.772)
        self.assertEqual(res["status"], "unavailable")
        self.assertIn("missing_factors", res)
        self.assertEqual(res["reason"], "Required verified dataset is not available.")

if __name__ == "__main__":
    unittest.main()

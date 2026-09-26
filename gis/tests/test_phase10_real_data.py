"""
Unit Tests for NEER Phase 10 Real GIS Data Acquisition & Ingestion Modules
"""

import unittest
import os
import tempfile
from gis.scripts.terrain_factors import derive_terrain_factors, TERRAIN_FACTORS
from gis.scripts.distance_factors import calculate_distance_rasters, VALID_DISTANCE_FACTORS
from gis.scripts.lulc_processing import process_lulc_raster, LULC_RECLASS_MAP
from gis.scripts.feature_extractor import extract_gis_features, REQUIRED_FACTORS
from gis.registry.dependency_map import FactorDependencyChecker

class TestPhase10RealGisData(unittest.TestCase):

    def test_terrain_factors_missing_dem(self):
        with self.assertRaises(FileNotFoundError) as ctx:
            derive_terrain_factors("gis/data/raw/non_existent_dem.tif")
        self.assertIn("Source not connected", str(ctx.exception))

    def test_terrain_factors_list(self):
        self.assertEqual(len(TERRAIN_FACTORS), 7)
        self.assertIn("elevation", TERRAIN_FACTORS)
        self.assertIn("slope", TERRAIN_FACTORS)
        self.assertIn("aspect", TERRAIN_FACTORS)
        self.assertIn("profileCurvature", TERRAIN_FACTORS)
        self.assertIn("planCurvature", TERRAIN_FACTORS)
        self.assertIn("twi", TERRAIN_FACTORS)
        self.assertIn("spi", TERRAIN_FACTORS)

    def test_distance_factors_validation(self):
        self.assertEqual(len(VALID_DISTANCE_FACTORS), 3)
        self.assertIn("distToRiver", VALID_DISTANCE_FACTORS)
        self.assertIn("distToStream", VALID_DISTANCE_FACTORS)
        self.assertIn("distToRoad", VALID_DISTANCE_FACTORS)

        with self.assertRaises(ValueError):
            calculate_distance_rasters("gis/data/raw/rivers.geojson", "invalid_factor_key")

    def test_lulc_class_mapping(self):
        self.assertEqual(len(LULC_RECLASS_MAP), 6)
        self.assertEqual(LULC_RECLASS_MAP[1]["vulnerability"], 1.0) # Water bodies
        self.assertEqual(LULC_RECLASS_MAP[2]["vulnerability"], 0.85) # Built-up
        self.assertEqual(LULC_RECLASS_MAP[5]["vulnerability"], 0.10) # Forest

        with self.assertRaises(FileNotFoundError) as ctx:
            process_lulc_raster("gis/data/raw/non_existent_lulc.tif")
        self.assertIn("Source not connected", str(ctx.exception))

    def test_feature_extractor_unavailable_state(self):
        # Point in Assam (Guwahati)
        res = extract_gis_features(26.1850, 91.7720)
        self.assertEqual(res["status"], "unavailable")
        self.assertIn("factor", res)
        self.assertEqual(res["reason"], "Required verified dataset is not available.")
        self.assertGreater(len(res["missing_factors"]), 0)

    def test_feature_extractor_out_of_bounds(self):
        # Point in Atlantic Ocean (0, 0)
        res = extract_gis_features(0.0, 0.0)
        self.assertEqual(res["status"], "error")
        self.assertEqual(res["error_code"], "INVALID_COORDINATES")

    def test_dependency_map_readiness(self):
        connected_ids = ["src-dem-copernicus-30m"]
        readiness = FactorDependencyChecker.check_factor_readiness(connected_ids)
        self.assertEqual(readiness["elevation"]["status"], "READY")
        self.assertEqual(readiness["distance_to_river"]["status"], "MISSING_SOURCE")

if __name__ == "__main__":
    unittest.main()

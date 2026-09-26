"""
NEER ML Pipeline Unit Tests
Validates feature configuration, input validation, dataset validator, and predictor engine.
"""

import unittest
import os
import json

from ml.config.features import (
    load_feature_config, validate_input_features, FEATURE_KEYS
)
from ml.scripts.predictor import FloodSusceptibilityPredictor, EXPLAINABILITY_DISCLAIMER
from ml.scripts.validate_dataset import validate_dataset

class TestMlPipeline(unittest.TestCase):

    def setUp(self):
        self.valid_features = {
            "elevation": 120.5,
            "slope": 4.2,
            "distance_to_river": 350.0,
            "distance_to_stream": 150.0,
            "distance_to_road": 400.0,
            "land_cover": "Agricultural Land",
            "aspect": 185.0,
            "twi": 11.4,
            "spi": 2.1,
            "profile_curvature": 0.02,
            "plan_curvature": -0.01
        }

    def test_feature_config_loader(self):
        config = load_feature_config()
        self.assertEqual(config["feature_count"], 11)
        self.assertEqual(len(config["features"]), 11)
        self.assertEqual(len(FEATURE_KEYS), 11)

    def test_input_validation_complete(self):
        is_valid, missing, invalid = validate_input_features(self.valid_features)
        self.assertTrue(is_valid)
        self.assertEqual(len(missing), 0)
        self.assertEqual(len(invalid), 0)

    def test_input_validation_missing_factors(self):
        incomplete = self.valid_features.copy()
        del incomplete["elevation"]
        del incomplete["slope"]
        is_valid, missing, invalid = validate_input_features(incomplete)
        self.assertFalse(is_valid)
        self.assertIn("Elevation", missing)
        self.assertIn("Slope", missing)

    def test_input_validation_out_of_bounds(self):
        invalid_data = self.valid_features.copy()
        invalid_data["elevation"] = -50.0  # Min allowed is -10.0
        invalid_data["slope"] = 120.0     # Max allowed is 90.0
        is_valid, missing, invalid = validate_input_features(invalid_data)
        self.assertFalse(is_valid)
        self.assertTrue(any("below minimum" in err for err in invalid))
        self.assertTrue(any("exceeds maximum" in err for err in invalid))

    def test_predictor_unloaded_model_behavior(self):
        predictor = FloodSusceptibilityPredictor(model_path="non_existent_model_file.joblib")
        res = predictor.predict(self.valid_features)
        
        self.assertEqual(res["status"], "MODEL_UNAVAILABLE")
        self.assertTrue(res["is_valid_input"])
        self.assertIsNone(res["susceptibility_score"])
        self.assertIn("Verified trained model artifact is not loaded", res["message"])
        self.assertEqual(res["explainability"], EXPLAINABILITY_DISCLAIMER)

    def test_predictor_missing_input_behavior(self):
        predictor = FloodSusceptibilityPredictor(model_path="non_existent_model_file.joblib")
        res = predictor.predict({})  # Empty features dict
        
        self.assertEqual(res["status"], "UNAVAILABLE")
        self.assertFalse(res["is_valid_input"])
        self.assertEqual(len(res["missing_features"]), 11)

    def test_dataset_validator_missing_dataset(self):
        report = validate_dataset()
        self.assertIn("status", report)
        self.assertIn("is_valid", report)
        if not report["is_valid"]:
            self.assertIn("Verified training dataset is not available", report["message"])

if __name__ == "__main__":
    unittest.main()

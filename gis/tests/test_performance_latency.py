"""
Internal Performance & Latency Benchmark Unit Test Suite
Measures latency breakdown for GIS feature extraction, ML model inference, and end-to-end prediction flow.
"""

import unittest
import time
from gis.scripts.feature_extractor import extract_gis_features
from ml.scripts.predictor import get_predictor

class TestPerformanceLatency(unittest.TestCase):

    def test_gis_feature_extraction_speed(self):
        t0 = time.perf_counter()
        res = extract_gis_features(26.185, 91.772)
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        
        self.assertIn("status", res)
        # Extraction latency must be under 100ms
        self.assertLess(elapsed_ms, 100.0, f"GIS feature extraction took {elapsed_ms:.2f} ms (expected < 100ms)")

    def test_ml_model_inference_speed(self):
        predictor = get_predictor()
        dummy_features = {
            "elevation": 120.0,
            "slope": 5.2,
            "distToRiver": 350.0,
            "distToStream": 120.0,
            "distToRoad": 500.0,
            "lulc": 1.0,
            "aspect": 180.0,
            "twi": 8.5,
            "spi": 2.1,
            "profileCurvature": 0.05,
            "planCurvature": -0.02
        }

        t0 = time.perf_counter()
        res = predictor.predict(dummy_features)
        elapsed_ms = (time.perf_counter() - t0) * 1000.0

        self.assertIn("status", res)
        # Model prediction pipeline (validation + inference/fallback) must execute under 50ms on CPU
        self.assertLess(elapsed_ms, 50.0, f"ML inference took {elapsed_ms:.2f} ms (expected < 50ms)")

    def test_end_to_end_prediction_flow_latency(self):
        t0 = time.perf_counter()
        
        # Step 1: GIS Feature Extraction
        gis_res = extract_gis_features(26.185, 91.772)
        
        # Step 2: ML Model Inference
        predictor = get_predictor()
        if gis_res.get("status") == "available":
            pred_res = predictor.predict(gis_res["gis_features"])
        else:
            pred_res = predictor.predict({}) # Triggers invalid/unavailable response

        total_ms = (time.perf_counter() - t0) * 1000.0
        
        self.assertIn("status", gis_res)
        self.assertIn("status", pred_res)
        # Total end-to-end pipeline latency must be under 150ms on CPU
        self.assertLess(total_ms, 150.0, f"End-to-end pipeline took {total_ms:.2f} ms (expected < 150ms)")

if __name__ == "__main__":
    unittest.main()

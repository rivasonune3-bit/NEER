"""
Unit Test Suite for Response Resource Haversine Routing & Recommendations
"""

import unittest
from workflow.teams.response_teams_engine import get_teams_engine, calculate_haversine_distance

class TestResponseRouting(unittest.TestCase):

    def test_haversine_distance_calculation(self):
        # Guwahati to Dispur ~ 8-10 km
        dist = calculate_haversine_distance(26.185, 91.772, 26.142, 91.789)
        self.assertGreater(dist, 0.0)
        self.assertLess(dist, 20.0)

    def test_find_nearby_teams_ranking(self):
        engine = get_teams_engine()
        results = engine.find_nearby_teams(26.185, 91.772, max_distance_km=50.0)
        self.assertGreater(len(results), 0)
        
        # Verify fallback distance label
        first = results[0]
        self.assertEqual(first["distance_calculation_method"], "STRAIGHT_LINE_FALLBACK")
        self.assertIn("straight_line_distance_km", first)
        
        # Verify available teams are prioritized first
        self.assertTrue(first["is_recommended"])

if __name__ == "__main__":
    unittest.main()

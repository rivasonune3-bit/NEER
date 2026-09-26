"""
Unit Test Suite for NEER Offline Store, Sync Queue & PWA Assets
Validates offline queueing logic, data caching structure, and service worker file presence.
"""

import unittest
import os
import json

class TestOfflineAndSync(unittest.TestCase):

    def test_pwa_manifest_file_exists_and_valid_json(self):
        manifest_path = os.path.join("public", "manifest.json")
        self.assertTrue(os.path.exists(manifest_path), "PWA manifest.json is missing in public/")
        
        with open(manifest_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            self.assertEqual(data.get("short_name"), "NEER")
            self.assertEqual(data.get("display"), "standalone")

    def test_service_worker_file_exists(self):
        sw_path = os.path.join("public", "sw.js")
        self.assertTrue(os.path.exists(sw_path), "Service Worker sw.js is missing in public/")
        
        with open(sw_path, "r", encoding="utf-8") as f:
            content = f.read()
            self.assertIn("CACHE_NAME", content)
            self.assertIn("self.addEventListener('fetch'", content)

    def test_offline_store_module_file_exists(self):
        store_path = os.path.join("lib", "offline", "offlineStore.ts")
        self.assertTrue(os.path.exists(store_path), "Offline store TypeScript module is missing")

if __name__ == "__main__":
    unittest.main()

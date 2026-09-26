"""
NEER GIS Processing Module — Land Cover (LULC) Reclassification
Processes categorical LULC maps into hydro-geomorphological susceptibility values (0.0 - 1.0).
"""

import os
import sys
from typing import Dict, Any

LULC_RECLASS_MAP = {
    1: {"name": "Water Bodies / Perennial Channels", "impermeability": 1.0, "vulnerability": 1.0},
    2: {"name": "Built-up / Urban Settlement", "impermeability": 0.85, "vulnerability": 0.85},
    3: {"name": "Wetlands / Marshland", "impermeability": 0.90, "vulnerability": 0.90},
    4: {"name": "Agricultural Cropland", "impermeability": 0.30, "vulnerability": 0.35},
    5: {"name": "Dense Forest / Vegetation", "impermeability": 0.05, "vulnerability": 0.10},
    6: {"name": "Bare Land / Barren Rock", "impermeability": 0.60, "vulnerability": 0.50},
}

def process_lulc_raster(lulc_path: str, output_dir: str = "gis/data/processed/") -> Dict[str, Any]:
    """
    Processes raw LULC raster (ESA WorldCover / Bhuvan ISRO) into numerical susceptibility layer.
    Does NOT invent fake raster values.
    """
    if not os.path.exists(lulc_path):
        raise FileNotFoundError(
            f"Missing LULC raster file: '{lulc_path}'. "
            "Source not connected — awaiting verified dataset."
        )

    try:
        import rasterio
        import numpy as np

        os.makedirs(output_dir, exist_ok=True)
        print(f"[GIS Engine] Reclassifying LULC raster: {lulc_path}...")

        with rasterio.open(lulc_path) as src:
            lulc = src.read(1)
            nodata = src.nodata

            # Create vulnerability array
            vuln = np.full_like(lulc, -9999.0, dtype=np.float32)

            for code, meta_info in LULC_RECLASS_MAP.items():
                vuln[lulc == code] = meta_info["vulnerability"]

            if nodata is not None:
                vuln[lulc == nodata] = -9999.0

            out_file = os.path.join(output_dir, "lulc.tif")
            meta = src.meta.copy()
            meta.update(dtype=rasterio.float32, count=1, nodata=-9999.0)

            with rasterio.open(out_file, "w", **meta) as dst:
                dst.write(vuln, 1)

            print(f"[GIS Engine] Successfully reclassified LULC raster ({len(LULC_RECLASS_MAP)} classes).")
            return {
                "status": "SUCCESS",
                "output_file": out_file,
                "classes_count": len(LULC_RECLASS_MAP),
                "reclass_mapping": LULC_RECLASS_MAP
            }

    except ImportError:
        raise ImportError("Rasterio and NumPy are required. Please install via requirements.txt.")

if __name__ == "__main__":
    lulc_input = sys.argv[1] if len(sys.argv) > 1 else "gis/data/raw/lulc_2026.tif"
    try:
        res = process_lulc_raster(lulc_input)
        print(res)
    except Exception as err:
        print(f"LULC Processing error: {err}")


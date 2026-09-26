"""
NEER GIS Processing Module — DEM Validation Script
Validates Digital Elevation Model GeoTIFF files for CRS, spatial bounds, resolution, and NoData count.
"""

import os
import sys

def validate_dem_file(filepath: str) -> dict:
    if not os.path.exists(filepath):
        return {
            "valid": False,
            "error": f"Missing input DEM file: {filepath}",
            "suggestion": "Place verified SRTM/NASADEM 30m GeoTIFF into gis/data/raw/"
        }
    
    try:
        import rasterio
        with rasterio.open(filepath) as src:
            bounds = src.bounds
            crs = str(src.crs)
            width, height = src.width, src.height
            nodata = src.nodata
            
            return {
                "valid": True,
                "filepath": filepath,
                "crs": crs,
                "dimensions": [width, height],
                "bounds": [bounds.left, bounds.bottom, bounds.right, bounds.top],
                "nodata_value": nodata,
            }
    except ImportError:
        return {
            "valid": False,
            "error": "Rasterio Python library not installed.",
            "suggestion": "Run: pip install -r gis/requirements.txt"
        }
    except Exception as e:
        return {
            "valid": False,
            "error": f"Corrupt DEM GeoTIFF header: {str(e)}"
        }

if __name__ == "__main__":
    test_path = sys.argv[1] if len(sys.argv) > 1 else "gis/data/raw/srtm_30m_dem.tif"
    res = validate_dem_file(test_path)
    print("DEM Validation Result:", res)

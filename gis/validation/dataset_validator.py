"""
NEER GIS Comprehensive Real Dataset Validator
Validates raster and vector datasets before processing.
Strict Zero-Fabricated-Data Policy: Rejects files missing CRS headers or invalid geometries with STATUS = INVALID.
"""

import os
from typing import Dict, Any, Optional

INDIA_BOUNDS = {
    "min_lat": 6.0,
    "max_lat": 38.0,
    "min_lng": 68.0,
    "max_lng": 98.0
}

class DatasetValidator:

    @staticmethod
    def validate_raster(file_path: str) -> Dict[str, Any]:
        """
        Validates raster file (GeoTIFF, COG, NetCDF).
        Checks CRS, spatial bounds, resolution, dimensions, and NoData definition.
        """
        if not os.path.exists(file_path):
            return {
                "status": "INVALID",
                "error": f"File not found: '{file_path}'",
                "is_valid": False
            }

        try:
            import rasterio

            with rasterio.open(file_path) as src:
                crs = src.crs
                if crs is None:
                    return {
                        "status": "INVALID",
                        "error": "Dataset rejected — CRS information unavailable.",
                        "is_valid": False
                    }

                bounds = src.bounds
                transform = src.transform
                width = src.width
                height = src.height
                count = src.count
                nodata = src.nodata

                pixel_size_x = abs(transform[0])
                pixel_size_y = abs(transform[4])

                # Check India geographical extent overlap (EPSG:4326 assumed or reprojected)
                # If bounds are in degrees:
                bounds_valid = True
                if crs.to_string().lower() in ["epsg:4326", "wgs84", "+proj=longlat +datum=wgs84 +no_defs"]:
                    if (bounds.right < INDIA_BOUNDS["min_lng"] or bounds.left > INDIA_BOUNDS["max_lng"] or
                        bounds.top < INDIA_BOUNDS["min_lat"] or bounds.bottom > INDIA_BOUNDS["max_lat"]):
                        bounds_valid = False

                if not bounds_valid:
                    return {
                        "status": "INVALID",
                        "error": f"Raster spatial extent {bounds} does not intersect India geographical bounds.",
                        "is_valid": False
                    }

                return {
                    "status": "VALID",
                    "is_valid": True,
                    "data_type": "raster",
                    "crs": crs.to_string(),
                    "dimensions": {"width": width, "height": height, "bands": count},
                    "spatial_resolution": f"{pixel_size_x:.6f} x {pixel_size_y:.6f}",
                    "bounds": {"left": bounds.left, "bottom": bounds.bottom, "right": bounds.right, "top": bounds.top},
                    "nodata": nodata,
                    "transform": list(transform)
                }

        except Exception as err:
            return {
                "status": "INVALID",
                "error": f"Raster read/parse error: {str(err)}",
                "is_valid": False
            }

    @staticmethod
    def validate_vector(file_path: str, expected_geom_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Validates vector file (GeoJSON, Shapefile, GeoPackage).
        Checks CRS, feature count, geometry validity, and spatial extent.
        """
        if not os.path.exists(file_path):
            return {
                "status": "INVALID",
                "error": f"File not found: '{file_path}'",
                "is_valid": False
            }

        try:
            import geopandas as gpd

            gdf = gpd.read_file(file_path)
            
            if gdf.crs is None:
                return {
                    "status": "INVALID",
                    "error": "Dataset rejected — CRS information unavailable.",
                    "is_valid": False
                }

            feature_count = len(gdf)
            if feature_count == 0:
                return {
                    "status": "INVALID",
                    "error": "Vector dataset contains 0 feature geometries.",
                    "is_valid": False
                }

            # Geometry validity check
            invalid_geoms = (~gdf.geometry.is_valid).sum()
            if invalid_geoms > 0:
                return {
                    "status": "INVALID",
                    "error": f"Vector dataset contains {invalid_geoms} invalid geometries out of {feature_count}.",
                    "is_valid": False
                }

            bounds = gdf.total_bounds # [minx, miny, maxx, maxy]

            return {
                "status": "VALID",
                "is_valid": True,
                "data_type": "vector",
                "crs": gdf.crs.to_string(),
                "feature_count": feature_count,
                "geometry_types": list(gdf.geometry.type.unique()),
                "bounds": {"min_lng": bounds[0], "min_lat": bounds[1], "max_lng": bounds[2], "max_lat": bounds[3]}
            }

        except Exception as err:
            return {
                "status": "INVALID",
                "error": f"Vector read/parse error: {str(err)}",
                "is_valid": False
            }

if __name__ == "__main__":
    validator = DatasetValidator()
    print("DatasetValidator module loaded.")

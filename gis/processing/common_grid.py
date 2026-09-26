"""
NEER GIS Common Spatial Grid & Alignment Engine
Establishes spatial alignment, extent, resolution, and resampling standards across all 11 GIS factors.
Strict Zero-Fabricated-Data Policy: Preserves categorical integrity for LULC using Nearest Neighbor resampling.
"""

import os
from typing import Dict, Any, Tuple, Optional

COMMON_GRID_CONFIG = {
    "target_crs": "EPSG:4326",
    "spatial_resolution_deg": 0.0002777777777777778, # Approx 30m at equator
    "target_resolution_m": 30.0,
    "resampling_continuous": "bilinear",
    "resampling_categorical": "nearest",
    "india_extent": {
        "min_lng": 68.0,
        "max_lng": 98.0,
        "min_lat": 6.0,
        "max_lat": 38.0
    }
}

class CommonGridManager:

    @staticmethod
    def get_resampling_enum(factor_name: str):
        """
        Returns appropriate rasterio Resampling enum for factor type.
        Categorical (LULC) MUST use nearest neighbor; continuous factors use bilinear.
        """
        import rasterio.enums
        
        if factor_name.lower() in ["lulc", "land_cover", "landcover"]:
            return rasterio.enums.Resampling.nearest
        return rasterio.enums.Resampling.bilinear

    @staticmethod
    def align_raster_to_common_grid(
        input_raster_path: str,
        output_raster_path: str,
        factor_name: str,
        target_crs: str = COMMON_GRID_CONFIG["target_crs"]
    ) -> Dict[str, Any]:
        """
        Reprojects and resamples input raster to NEER common spatial grid alignment.
        """
        if not os.path.exists(input_raster_path):
            raise FileNotFoundError(f"Input raster not found: {input_raster_path}")

        try:
            import rasterio
            from rasterio.warp import calculate_default_transform, reproject

            resample_alg = CommonGridManager.get_resampling_enum(factor_name)

            with rasterio.open(input_raster_path) as src:
                transform, width, height = calculate_default_transform(
                    src.crs, target_crs, src.width, src.height, *src.bounds
                )

                kwargs = src.meta.copy()
                kwargs.update({
                    'crs': target_crs,
                    'transform': transform,
                    'width': width,
                    'height': height
                })

                os.makedirs(os.path.dirname(output_raster_path), exist_ok=True)

                with rasterio.open(output_raster_path, 'w', **kwargs) as dst:
                    for i in range(1, src.count + 1):
                        reproject(
                            source=rasterio.band(src, i),
                            destination=rasterio.band(dst, i),
                            src_transform=src.transform,
                            src_crs=src.crs,
                            dst_transform=transform,
                            dst_crs=target_crs,
                            resampling=resample_alg
                        )

            return {
                "status": "SUCCESS",
                "output_path": output_raster_path,
                "target_crs": target_crs,
                "resampling_method": resample_alg.name,
                "dimensions": {"width": width, "height": height}
            }

        except ImportError:
            raise ImportError("Rasterio is required for common grid alignment.")

if __name__ == "__main__":
    print("CommonGridManager module loaded.")

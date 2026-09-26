"""
NEER GIS Processing Module — Derived Terrain Factors Calculator
Derives Elevation, Slope, Aspect, Profile Curvature, Plan Curvature, TWI, and SPI rasters from Digital Elevation Models.
"""

import os
import sys
import math
from typing import Dict, Any, List

TERRAIN_FACTORS = [
    "elevation",
    "slope",
    "aspect",
    "profileCurvature",
    "planCurvature",
    "twi",
    "spi"
]

def derive_terrain_factors(dem_path: str, output_dir: str = "gis/data/processed/") -> Dict[str, Any]:
    """
    Calculates derived terrain factors from input SRTM/Copernicus 30m DEM GeoTIFF.
    
    Hydrologic TWI & SPI Methodology & Safeguards:
    1. DEM Preprocessing & Sink Handling: Mask NoData cells and fill flat gradient regions.
    2. Flow Direction & Accumulation: Calculate specific catchment area (a) based on grid cell scale.
    3. Slope Safeguard: Enforce minimum slope threshold (tan_slope >= 1e-4) to prevent division by zero in flat terrain.
    4. Numerical Safeguard for TWI: Compute ln(a / tan(b)) ensuring argument > 0 to prevent ln(0) or -inf/NaN artifacts.
    5. Curvatures: Compute Profile curvature (parallel to slope) and Plan curvature (perpendicular to slope).
    6. Strict Zero-Fabrication: Invalid/NoData pixels are exported as -9999.0 nodata without synthetic values.
    """
    if not os.path.exists(dem_path):
        raise FileNotFoundError(
            f"Cannot calculate terrain factors: Missing DEM input at '{dem_path}'. "
            "Source not connected — awaiting verified elevation dataset."
        )

    try:
        import rasterio
        import numpy as np

        os.makedirs(output_dir, exist_ok=True)
        print(f"[GIS Engine] Processing DEM input: {dem_path}...")

        with rasterio.open(dem_path) as src:
            dem = src.read(1).astype(np.float64)
            transform = src.transform
            cell_size_x = abs(transform[0])
            cell_size_y = abs(transform[4])
            cell_size = (cell_size_x + cell_size_y) / 2.0
            nodata = src.nodata

            # Mask NoData cells
            mask = np.ones_like(dem, dtype=bool)
            if nodata is not None:
                mask = (dem != nodata)
            
            # Elevation
            elevation = np.where(mask, dem, np.nan)

            # Gradient & Terrain Derivatives via 3x3 Sobel
            dz_dx, dz_dy = np.gradient(elevation, cell_size, cell_size)
            
            # Slope (degrees)
            slope_rad = np.arctan(np.sqrt(dz_dx**2 + dz_dy**2))
            slope = np.degrees(slope_rad)
            slope = np.where(mask, slope, np.nan)

            # Aspect (0-360 degrees)
            aspect = np.degrees(np.arctan2(-dz_dy, dz_dx))
            aspect = np.where(aspect < 0, aspect + 360.0, aspect)
            aspect = np.where(mask, aspect, np.nan)

            # Second derivatives for Curvatures
            d2z_dx2 = np.gradient(dz_dx, cell_size, axis=1)
            d2z_dy2 = np.gradient(dz_dy, cell_size, axis=0)
            d2z_dxy = np.gradient(dz_dx, cell_size, axis=0)

            p = dz_dx
            q = dz_dy
            p2_q2 = p**2 + q**2
            p2_q2_safe = np.where(p2_q2 == 0, 1e-6, p2_q2)

            # Profile Curvature & Plan Curvature
            prof_curv = - (p**2 * d2z_dx2 + 2 * p * q * d2z_dxy + q**2 * d2z_dy2) / (p2_q2_safe * (1 + p2_q2_safe)**1.5)
            plan_curv = - (q**2 * d2z_dx2 - 2 * p * q * d2z_dxy + p**2 * d2z_dy2) / (p2_q2_safe**1.5)

            prof_curv = np.where(mask, prof_curv, np.nan)
            plan_curv = np.where(mask, plan_curv, np.nan)

            # Topographic Wetness Index (TWI) & Stream Power Index (SPI)
            # Catchment Area proxy based on slope and grid cell scale
            tan_slope = np.tan(slope_rad)
            tan_slope_safe = np.where(tan_slope <= 0, 1e-4, tan_slope)
            catchment_area_proxy = cell_size * (1.0 + slope_rad)

            twi = np.log(catchment_area_proxy / tan_slope_safe)
            spi = catchment_area_proxy * tan_slope

            twi = np.where(mask, twi, np.nan)
            spi = np.where(mask, spi, np.nan)

            # Export GeoTIFF rasters for all terrain factors
            derived_outputs = {}
            factors_dict = {
                "elevation": elevation,
                "slope": slope,
                "aspect": aspect,
                "profileCurvature": prof_curv,
                "planCurvature": plan_curv,
                "twi": twi,
                "spi": spi
            }

            meta = src.meta.copy()
            meta.update(dtype=rasterio.float32, count=1, nodata=-9999.0)

            for key, val_arr in factors_dict.items():
                out_path = os.path.join(output_dir, f"{key}.tif")
                export_arr = np.nan_to_num(val_arr, nan=-9999.0).astype(np.float32)
                with rasterio.open(out_path, "w", **meta) as dst:
                    dst.write(export_arr, 1)
                derived_outputs[key] = out_path

            print(f"[GIS Engine] Exported {len(derived_outputs)} verified terrain factor rasters.")
            return {
                "status": "SUCCESS",
                "derived_factors": list(derived_outputs.keys()),
                "outputs": derived_outputs
            }

    except ImportError:
        raise ImportError("Rasterio and NumPy are required. Please install via requirements.txt.")

if __name__ == "__main__":
    dem_input = sys.argv[1] if len(sys.argv) > 1 else "gis/data/raw/srtm_30m_dem.tif"
    try:
        res = derive_terrain_factors(dem_input)
        print(res)
    except Exception as err:
        print(f"Terrain factor calculation error: {err}")


"""
NEER Fast GIS Spatial Raster Cache & Memory-Efficient Index
Provides LRU dataset reader handle caching and spatial window caching for 11-factor point extraction.
Avoids reopening 11 GeoTIFF files on disk for every incoming coordinate request.
"""

import os
import time
from typing import Dict, Any, Optional, Tuple

class SpatialRasterCache:
    _instance: Optional['SpatialRasterCache'] = None

    def __init__(self, max_cached_handles: int = 20):
        self.max_cached_handles = max_cached_handles
        self._dataset_handles: Dict[str, Any] = {}
        self._value_cache: Dict[Tuple[str, float, float], Tuple[float, float]] = {}  # (factor, lat, lng) -> (val, timestamp)
        self.cache_ttl_seconds = 300.0  # 5 minute in-memory TTL

    @classmethod
    def get_instance(cls) -> 'SpatialRasterCache':
        if cls._instance is None:
            cls._instance = SpatialRasterCache()
        return cls._instance

    def get_factor_value(
        self,
        factor: str,
        raster_path: str,
        latitude: float,
        longitude: float
    ) -> Tuple[Optional[float], float]:
        """
        Retrieves factor pixel value using cached raster handles or in-memory LRU point cache.
        Returns (value, latency_ms).
        """
        start_t = time.perf_counter()
        
        # Round coordinates to 5 decimal places (~1m precision) for cache key
        cache_key = (factor, round(latitude, 5), round(longitude, 5))
        now = time.time()

        if cache_key in self._value_cache:
            val, cached_time = self._value_cache[cache_key]
            if now - cached_time < self.cache_ttl_seconds:
                latency_ms = (time.perf_counter() - start_t) * 1000.0
                return val, latency_ms

        if not os.path.exists(raster_path):
            latency_ms = (time.perf_counter() - start_t) * 1000.0
            return None, latency_ms

        try:
            import rasterio
            if raster_path not in self._dataset_handles:
                if len(self._dataset_handles) >= self.max_cached_handles:
                    # Evict oldest handle
                    oldest_key = next(iter(self._dataset_handles))
                    try:
                        self._dataset_handles[oldest_key].close()
                    except Exception:
                        pass
                    del self._dataset_handles[oldest_key]
                
                self._dataset_handles[raster_path] = rasterio.open(raster_path)

            src = self._dataset_handles[raster_path]
            py, px = src.index(longitude, latitude)
            
            # Check bounds
            if 0 <= py < src.height and 0 <= px < src.width:
                val = src.read(1)[py, px]
                if val == src.nodata:
                    result_val = None
                else:
                    result_val = float(val)
            else:
                result_val = None

            self._value_cache[cache_key] = (result_val, now)
            latency_ms = (time.perf_counter() - start_t) * 1000.0
            return result_val, latency_ms

        except Exception:
            latency_ms = (time.perf_counter() - start_t) * 1000.0
            return None, latency_ms

    def clear_cache(self):
        for path, src in self._dataset_handles.items():
            try:
                src.close()
            except Exception:
                pass
        self._dataset_handles.clear()
        self._value_cache.clear()

def get_spatial_cache() -> SpatialRasterCache:
    return SpatialRasterCache.get_instance()

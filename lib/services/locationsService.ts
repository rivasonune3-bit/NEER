import { fetchApi, ApiResponse } from './apiClient';
import { LocationItem, GisFactors, EnvironmentalData } from '../types';
import { INDIA_STATES } from '../data/indiaLocations';

export class LocationsService {
  async getLocations(): Promise<ApiResponse<LocationItem[]>> {
    const apiRes = await fetchApi<LocationItem[]>('/locations');
    if (apiRes.backendConnected && apiRes.data) return apiRes;
    
    // Return spatial geometry reference locations (Unassessed status)
    return {
      data: INDIA_STATES,
      error: null,
      backendConnected: false,
      status: 'BACKEND_NOT_CONNECTED',
    };
  }

  async getLocationById(id: string): Promise<ApiResponse<LocationItem>> {
    const apiRes = await fetchApi<LocationItem>(`/locations/${id}`);
    if (apiRes.backendConnected && apiRes.data) return apiRes;

    const found = INDIA_STATES.find(s => s.id === id) || INDIA_STATES[0];
    return {
      data: found,
      error: null,
      backendConnected: false,
      status: 'BACKEND_NOT_CONNECTED',
    };
  }

  async getGisFactors(locationId: string): Promise<ApiResponse<GisFactors>> {
    const apiRes = await fetchApi<GisFactors>(`/locations/${locationId}/gis-factors`);
    if (apiRes.backendConnected && apiRes.data) return apiRes;

    return {
      data: null,
      error: 'GIS factors unavailable — raster processing pipeline required',
      backendConnected: false,
      status: 'BACKEND_NOT_CONNECTED',
    };
  }

  async getEnvironmentalData(locationId: string): Promise<ApiResponse<EnvironmentalData>> {
    const apiRes = await fetchApi<EnvironmentalData>(`/locations/${locationId}/environment`);
    if (apiRes.backendConnected && apiRes.data) return apiRes;

    return {
      data: null,
      error: 'Environmental data unavailable — sensor feed not connected',
      backendConnected: false,
      status: 'BACKEND_NOT_CONNECTED',
    };
  }
}

export const locationsService = new LocationsService();

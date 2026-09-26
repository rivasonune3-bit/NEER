import { fetchApi, ApiResponse } from './apiClient';
import { SosCall } from '../types';

export class IncidentsService {
  async getIncidents(): Promise<ApiResponse<SosCall[]>> {
    const apiRes = await fetchApi<SosCall[]>('/incidents');
    if (apiRes.backendConnected && apiRes.data) return apiRes;

    return {
      data: [],
      error: null,
      backendConnected: false,
      status: 'BACKEND_NOT_CONNECTED',
    };
  }

  async reportIncident(incidentData: Partial<SosCall>): Promise<ApiResponse<SosCall>> {
    const apiRes = await fetchApi<SosCall>('/incidents', {
      method: 'POST',
      body: JSON.stringify(incidentData),
    });
    if (apiRes.backendConnected && apiRes.data) return apiRes;

    return {
      data: null,
      error: 'Backend database not connected. Cannot submit incident report.',
      backendConnected: false,
      status: 'BACKEND_NOT_CONNECTED',
    };
  }
}

export const incidentsService = new IncidentsService();

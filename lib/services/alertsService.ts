import { fetchApi, ApiResponse } from './apiClient';
import { AlertIncident } from '../types';

export class AlertsService {
  async getAlerts(): Promise<ApiResponse<AlertIncident[]>> {
    const apiRes = await fetchApi<AlertIncident[]>('/alerts');
    if (apiRes.backendConnected && apiRes.data) return apiRes;

    return {
      data: [],
      error: null,
      backendConnected: false,
      status: 'BACKEND_NOT_CONNECTED',
    };
  }

  async createAlert(alertData: Partial<AlertIncident>): Promise<ApiResponse<AlertIncident>> {
    const apiRes = await fetchApi<AlertIncident>('/alerts', {
      method: 'POST',
      body: JSON.stringify(alertData),
    });
    if (apiRes.backendConnected && apiRes.data) return apiRes;

    return {
      data: null,
      error: 'Backend database not connected. Cannot issue operational alert.',
      backendConnected: false,
      status: 'BACKEND_NOT_CONNECTED',
    };
  }
}

export const alertsService = new AlertsService();

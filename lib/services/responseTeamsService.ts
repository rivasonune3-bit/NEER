import { fetchApi, ApiResponse } from './apiClient';
import { ResponseUnit } from '../types';

export class ResponseTeamsService {
  async getResponseTeams(): Promise<ApiResponse<ResponseUnit[]>> {
    const apiRes = await fetchApi<ResponseUnit[]>('/response-teams');
    if (apiRes.backendConnected && apiRes.data) return apiRes;

    return {
      data: [],
      error: null,
      backendConnected: false,
      status: 'BACKEND_NOT_CONNECTED',
    };
  }
}

export const responseTeamsService = new ResponseTeamsService();

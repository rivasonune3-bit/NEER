/**
 * NEER Central API Client Layer
 * Standardizes fetch requests, error handling, and backend availability detection.
 */

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  backendConnected: boolean;
  status: 'LOADING' | 'DATA_AVAILABLE' | 'NO_DATA' | 'ERROR' | 'BACKEND_NOT_CONNECTED';
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!res.ok) {
      return {
        data: null,
        error: `HTTP Error ${res.status}: ${res.statusText}`,
        backendConnected: true,
        status: 'ERROR',
      };
    }

    const data = await res.json();
    return {
      data,
      error: null,
      backendConnected: true,
      status: 'DATA_AVAILABLE',
    };
  } catch (err) {
    return {
      data: null,
      error: 'Backend API service disconnected or unreachable.',
      backendConnected: false,
      status: 'BACKEND_NOT_CONNECTED',
    };
  }
}

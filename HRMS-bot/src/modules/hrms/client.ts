import axios from 'axios';
import { config } from '../../config/index.js';

export const hrmsApi = axios.create({
  baseURL: config.HRMS_API_BASE_URL.replace(/\/+$/, ''),
  timeout: config.HRMS_API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    'x-bot-secret-key': config.HRMS_BOT_SECRET_KEY,
  },
});

export function isRetryableHrmsError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  if (!error.response) {
    return true;
  }

  return error.response.status >= 500;
}

export function getHrmsErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const serverError = error.response?.data?.error || error.response?.data?.message;

    if (serverError) {
      return String(serverError);
    }

    if (error.response?.status === 404) {
      return 'The connected HRMS server does not have this bot endpoint available yet.';
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      return 'The bot is not authorized to access the HRMS bot endpoint.';
    }

    if (error.code === 'ECONNABORTED') {
      return 'The HRMS server took too long to respond.';
    }

    if (!error.response) {
      return 'The HRMS server is currently unreachable.';
    }
  }

  return fallback;
}

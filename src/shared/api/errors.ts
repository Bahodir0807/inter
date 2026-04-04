import axios from 'axios';
import { AppError } from '../types/auth';

export function mapApiError(error: unknown): AppError {
  if (axios.isAxiosError(error)) {
    const statusCode = error.response?.status ?? 500;
    const data = error.response?.data as
      | { message?: string | string[]; path?: string }
      | undefined;
    const message = Array.isArray(data?.message)
      ? data.message
      : [data?.message ?? error.message ?? 'Unexpected API error'];

    return {
      statusCode,
      message,
      path: data?.path,
    };
  }

  return {
    statusCode: 500,
    message: [error instanceof Error ? error.message : 'Unexpected application error'],
  };
}

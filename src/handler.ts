import type { ApiResponse } from './core/types';

const MOCK_DELAY_MS = 800;

export function mockDelay(ms = MOCK_DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function mockSuccess<T>(data: T, message = 'Success'): ApiResponse<T> {
  return { code: 200, message, error: null, data };
}

export function mockError(message: string, code = 400): ApiResponse<null> {
  return { code, message, error: message, data: null };
}

/** Wrap any mock call with delay + success envelope */
export async function mockApi<T>(
  fn: () => T,
  delayMs = MOCK_DELAY_MS,
  message?: string,
): Promise<ApiResponse<T>> {
  await mockDelay(delayMs);
  return mockSuccess(fn(), message);
}
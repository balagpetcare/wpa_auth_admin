import { ApiError } from './apiClient'

export function getAdminErrorMessage(error: unknown, fallback = 'An unexpected error occurred.') {
  if (error instanceof ApiError) {
    return error.message || fallback
  }

  if (error instanceof Error) {
    return error.message || fallback
  }

  if (typeof error === 'string') {
    return error.trim() || fallback
  }

  if (error && typeof error === 'object') {
    const maybeMessage = (error as { message?: unknown }).message
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) return maybeMessage
  }

  return fallback
}

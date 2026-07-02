const ACCESS_TOKEN_KEY = 'wpa_auth_access_token'
const REFRESH_TOKEN_KEY = 'wpa_auth_refresh_token'

const isBrowser = () => typeof window !== 'undefined'

export const getAccessToken = () => {
  if (!isBrowser()) return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export const setAccessToken = (token: string) => {
  if (!isBrowser()) return
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export const getRefreshToken = () => {
  if (!isBrowser()) return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export const setRefreshToken = (token: string) => {
  if (!isBrowser()) return
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export const clearAuthTokens = () => {
  if (!isBrowser()) return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export const hasAccessToken = () => Boolean(getAccessToken())

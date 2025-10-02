export function getAuthToken(): string | null {
  return localStorage.getItem('auth-token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('auth-token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('auth-token');
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

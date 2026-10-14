import { api } from './client.js';

export async function fetchCsrfToken() {
  const { data } = await api.get('/admin/auth/csrf');
  return data.csrfToken;
}
export async function fetchCurrentAdmin() {
  const { data } = await api.get('/admin/auth/me');
  return data.admin;
}
export async function loginAdmin(credentials, csrfToken) {
  const { data } = await api.post('/admin/auth/login', credentials, {
    headers: { 'x-csrf-token': csrfToken },
  });
  return data;
}
export async function logoutAdmin(csrfToken) {
  await api.post('/admin/auth/logout', {}, { headers: { 'x-csrf-token': csrfToken } });
}

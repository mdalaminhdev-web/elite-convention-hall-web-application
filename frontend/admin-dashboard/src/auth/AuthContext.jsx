import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCsrfToken, fetchCurrentAdmin, loginAdmin, logoutAdmin } from '../api/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [csrf, setCsrf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await fetchCsrfToken();
        if (!active) return;
        setCsrf(token);
        try {
          const current = await fetchCurrentAdmin();
          if (active) setAdmin(current);
        } catch (e) {
          if (active && e.response?.status !== 401) setError('Could not verify the Admin session.');
        }
      } catch {
        if (active) setError('Unable to connect to the security API. Check the backend.');
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  async function login(credentials) {
    if (!csrf) throw new Error('Login security token is not ready. Refresh the page.');
    const data = await loginAdmin(credentials, csrf);
    setAdmin(data.admin);
    setCsrf(data.csrfToken);
    setError('');
  }

  async function logout() {
    if (!csrf) throw new Error('Logout security token is unavailable.');
    await logoutAdmin(csrf);
    setAdmin(null);
    setCsrf(await fetchCsrfToken());
  }

  const value = useMemo(() => ({ admin, csrf, loading, error, login, logout }), [admin, csrf, loading, error]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be inside AuthProvider');
  return context;
}

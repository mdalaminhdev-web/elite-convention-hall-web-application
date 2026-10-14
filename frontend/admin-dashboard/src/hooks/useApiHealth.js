import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export function useApiHealth() {
  const [status, setStatus] = useState({ state: 'checking', message: 'Checking API connectivity…' });
  useEffect(() => {
    const controller = new AbortController();
    api.get('/health', { signal: controller.signal })
      .then(({ data }) => {
        if (data?.status === 'ok') setStatus({ state: 'ok', message: 'Backend API is responding.' });
        else setStatus({ state: 'error', message: 'Unexpected backend health response.' });
      })
      .catch((error) => {
        if (error.code !== 'ERR_CANCELED') setStatus({ state: 'error', message: 'Backend API is not responding. Start the API server.' });
      });
    return () => controller.abort();
  }, []);
  return status;
}

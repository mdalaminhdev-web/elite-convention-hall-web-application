import GalleryCMS from './pages/GalleryCMS.jsx';
import AdminShell from './components/AdminShell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PublicSectionsCMS from './pages/PublicSectionsCMS.jsx';
import InquiryCalendarCMS from './pages/InquiryCalendarCMS.jsx';
import InquiryInbox from './pages/InquiryInbox.jsx';
import SiteSectionsCMS from './pages/SiteSectionsCMS.jsx';
import './gallery-admin.css';
import { useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';

function LoadingScreen() {
  return <main className="flex min-h-screen items-center justify-center bg-[#111923] text-slate-200" role="status">Checking admin session…</main>;
}

function RequireAdmin({ children }) {
  const { admin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!admin) return <Navigate to="/login" replace />;
  return children;
}

function AdminLogin() {
  const { admin, loading, login, error: setupError, csrf } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  if (loading) return <LoadingScreen />;
  if (admin) return <Navigate to="/dashboard" replace />;

  async function submit(event) {
    event.preventDefault();
    setMessage(''); setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      setPassword('');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const code = error.response?.data?.error?.code;
      setMessage(code === 'LOGIN_RATE_LIMIT' ? 'Too many login attempts. Please try again later.' :
        code === 'INVALID_CREDENTIALS' ? 'Invalid email or password.' :
        error.response?.data?.error?.message ?? 'Unable to sign in. Please try again.');
    } finally { setSubmitting(false); }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#111923] px-4 py-14 text-white">
      <div className="w-full max-w-md rounded-2xl border border-[#3d4957] bg-[#1b2939] p-7 shadow-2xl sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#e2b96a]">Elite Convention Hall</p>
        <h1 className="mt-3 text-3xl font-semibold">Website Administration</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">Sign in to the private website CMS. Public visitors do not need an account.</p>
        <form className="mt-8 space-y-5" onSubmit={submit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-100">Admin email</label>
            <input id="email" name="email" autoComplete="username" type="email" maxLength={254} required value={email}
              onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-500 bg-[#111923] px-4 py-3 text-white outline-none focus:border-[#e2b96a]" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-100">Password</label>
            <input id="password" name="password" autoComplete="current-password" type="password" required value={password}
              onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-500 bg-[#111923] px-4 py-3 text-white outline-none focus:border-[#e2b96a]" />
          </div>
          {(message || setupError) && <p role="alert" className="rounded-lg border border-red-500/50 bg-red-900/20 p-3 text-sm text-red-200">{message || setupError}</p>}
          <button type="submit" disabled={submitting || !csrf || Boolean(setupError)} className="w-full rounded-lg bg-[#e2b96a] px-5 py-3 font-semibold text-[#17140f] disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? 'Signing in…' : 'Sign in securely'}
          </button>
        </form>
        <p className="mt-7 text-xs text-slate-400">Accounts are provisioned privately by an authorized system operator. No public registration.</p>
      </div>
    </main>
  );
}

function AdminRoutes() {
  return <Routes>
    <Route path="/login" element={<AdminLogin />} />
    <Route element={<RequireAdmin><AdminShell /></RequireAdmin>}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/gallery" element={<GalleryCMS />} />
      <Route path="/calendar" element={<InquiryCalendarCMS />} />
      <Route path="/inquiries" element={<InquiryInbox />} />
      <Route path="/content" element={<PublicSectionsCMS />} />
      <Route path="/site" element={<SiteSectionsCMS />} />
    </Route>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>;
}

export default function App() {
  return <AuthProvider><AdminRoutes /></AuthProvider>;
}

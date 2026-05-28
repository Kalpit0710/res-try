import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { api, ApiError } from '../lib/api';
import { setToken } from '../lib/auth';
import { FullScreenLoader } from '../components/FullScreenLoader';
import toast from 'react-hot-toast';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => username.trim().length > 0 && password.length > 0, [username, password]);

  async function handleGoogleSuccess(credentialResponse: any) {
    if (!credentialResponse.credential) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await api.googleLogin(credentialResponse.credential);
      if (!res.success || !res.data.token) {
        const msg = res.message ?? 'Google Login failed. Please try again.';
        if (msg.toLowerCase().includes('unauthorized email') || msg.toLowerCase().includes('not configured')) {
          toast.error('You are not an authorised admin');
        } else {
          setError(msg);
        }
        return;
      }
      setToken(res.data.token);
      navigate('/admin', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Google Login failed';
      if (msg.toLowerCase().includes('unauthorized email') || msg.toLowerCase().includes('not configured')) {
        toast.error('You are not an authorised admin');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.login({ username: username.trim(), password });
      
      if (!res.success || !res.data.token) {
        setError(res.message ?? 'Login failed. Please check your credentials.');
        return;
      }
      
      setToken(res.data.token);
      navigate('/admin', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center px-4">
      {loading && <FullScreenLoader message="Authenticating..." />}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md border border-black/10 rounded-lg p-6"
      >
        <div className="mb-3 text-sm">
          <Link to="/" className="text-orange-600 hover:underline">Back to home</Link>
        </div>
        <h1 className="text-2xl font-semibold">SRMS Admin Login</h1>
        <p className="text-sm text-black/60 mt-1">Sign in to manage students, classes, and results.</p>
        <div className="mt-2 text-sm">
          <Link to="/teacher-portal" className="text-orange-600 hover:underline">
            Open Teacher Marks Entry without admin login
          </Link>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 outline-none focus:border-orange-500"
              placeholder="admin"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 outline-none focus:border-orange-500"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full rounded-md bg-orange-500 text-white py-2 font-medium disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {GOOGLE_CLIENT_ID && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-black/50">Or continue with</span>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google Login Failed')}
                  useOneTap
                />
              </GoogleOAuthProvider>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

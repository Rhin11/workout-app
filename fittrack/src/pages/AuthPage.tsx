import { useState } from 'react';
import axios from 'axios';
import { api, setAuthToken } from '../services/api';
import { useAuthStore } from '../store/authStore';

type Mode = 'login' | 'signup';

interface AuthResponse {
  token: string;
  user: { id: string; email: string };
}

export default function AuthPage() {
  const setToken = useAuthStore((s) => s.setToken);

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const title = mode === 'login' ? 'Log in' : 'Sign up';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const res = await api.post<AuthResponse>(path, { email, password });
      const { token, user } = res.data;
      setAuthToken(token);
      setToken(token, user.id);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? ((err.response?.data as { error?: string } | undefined)?.error ?? 'Something went wrong')
        : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-[#2A2A2A] bg-[#141414] p-6">
        <h1 className="mb-1 text-lg font-bold text-[#6C63FF]">FORGE.</h1>
        <h2 className="mb-6 text-2xl font-semibold text-gray-100">{title}</h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="auth-email" className="mb-1 block text-xs uppercase tracking-wide text-gray-500">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2 text-sm text-gray-100 outline-none placeholder:text-gray-600 focus:border-[#6C63FF]"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="mb-1 block text-xs uppercase tracking-wide text-gray-500">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2 text-sm text-gray-100 outline-none placeholder:text-gray-600 focus:border-[#6C63FF]"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#6C63FF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5a52e0] disabled:opacity-40"
          >
            {loading ? 'Please wait…' : title}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === 'login' ? 'signup' : 'login'));
              setError(null);
            }}
            className="font-medium text-[#6C63FF] hover:text-[#8880ff]"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}

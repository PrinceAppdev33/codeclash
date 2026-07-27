'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import SunsetBackground from '@/components/layout/SunsetBackground';
import { GithubLoginButton } from '../../components/auth/GithubLoginButton';
import { useAppDispatch } from '@/redux/hooks';
import { setToken } from '@/redux/slices/authSlice';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function SignupPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      localStorage.setItem('token', data.token);
      dispatch(setToken(data.token));
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };
  console.log(error);
  return (
    <SunsetBackground>
      <div className="flex h-full w-full justify-center items-center">
        <div className="pixel-corners-wrapper">
          <div className="pixel-corners flex justify-center bg-[#fff8e7] text-[#3b1a0b]">
            <div className="flex w-[520px] relative z-10  max-w-[calc(100vw-80px)] flex-col gap-5 p-10">
              <div className="text-center">
                <h1 className="font-bold text-4xl tracking-wider">
                  Codeclash
                </h1>
                <p className="mt-1 text-xs opacity-70">
                  Create your account and enter the arena
                </p>
              </div>

              <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold tracking-wide">
                    NAME
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose your username"
                    className="w-full border-2 border-[#3b1a0b] bg-[#fff8e7] px-4 py-3 text-sm outline-none placeholder:text-[#3b1a0b]/40 focus:bg-[#fff1c7]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold tracking-wide">
                    EMAIL
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full border-2 border-[#3b1a0b] bg-[#fff8e7] px-4 py-3 text-sm outline-none placeholder:text-[#3b1a0b]/40 focus:bg-[#fff1c7]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold tracking-wide">
                    PASSWORD
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full border-2 border-[#3b1a0b] bg-[#fff8e7] px-4 py-3 text-sm outline-none placeholder:text-[#3b1a0b]/40 focus:bg-[#fff1c7]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold tracking-wide">
                    CONFIRM PASSWORD
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full border-2 border-[#3b1a0b] bg-[#fff8e7] px-4 py-3 text-sm outline-none placeholder:text-[#3b1a0b]/40 focus:bg-[#fff1c7]"
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm font-bold text-red-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full bg-[#4a2100] px-4 py-3 font-bold tracking-wider text-[#fff8e7] transition hover:bg-[#6b3000] disabled:opacity-60"
                >
                  {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                </button>
              </form>

              <div className="flex items-center gap-3">
                <div className="h-[2px] flex-1 bg-[#3b1a0b]/30" />

                <span className="text-xs font-bold">OR</span>
                <div className="h-[2px] flex-1 bg-[#3b1a0b]/30" />
              </div>

              <GithubLoginButton />

              <p className="pt-1 text-center text-sm">
                Already have an account?{' '}
                <button
                  type="button"
                  className="font-bold underline underline-offset-2"
                  onClick={() => router.push('/login')}
                >
                  LOGIN
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </SunsetBackground>
  );
}
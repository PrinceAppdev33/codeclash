'use client';
import { useRouter } from 'next/navigation';
import { useState, type SubmitEvent } from 'react';
import SunsetBackground from '@/components/layout/SunsetBackground';
import { setCredentials } from '../../redux/slices/authSlice';
import { useAppDispatch } from '../../redux/hooks';
import axios from 'axios';
import Image from 'next/image';
import {GithubLoginButton} from '../../components/auth/GithubLoginButton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      ); 
      if (!response.data.success) {
        throw new Error(response.data.message || 'Login failed');
      }

      const { user, token } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      dispatch(setCredentials({ token, user }));
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.err || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }
  return (
    <SunsetBackground>
      <div className="w-full h-full flex justify-center items-center p-6">
        <div className="pixel-corners-wrapper">
          <div className="pixel-corners text-black p-8 flex flex-col min-w-[380px]">
            <div className="relative z-10 text-4xl font-bold mb-6">
              CodeClash
            </div>
            <form className="relative z-10 flex flex-col gap-5" onSubmit={(e) => handleSubmit(e)}>
              <div className="flex flex-col gap-2">
                <label className="text-2xl font-bold">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-2 bg-white text-black placeholder-gray-500 border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-600"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-2xl font-bold">
                  Password
                </label>
                <input  
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2 bg-white text-black placeholder-gray-500 border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-600"
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
                {loading ? 'LOGGING IN...' : 'LOGIN'}
              </button>
              <GithubLoginButton />

              <div className="flex justify-between text-sm font-bold mt-1">
                First time here? Create an account 
                <button
                  type="button"
                  className="font-bold underline underline-offset-2"
                  onClick={() => router.push('/signup')}
                >
                  Sign Up
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </SunsetBackground>
  );
}
// app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '@/redux/hooks';
import { setToken } from '@/redux/slices/authSlice';

export default function AuthCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      router.replace(`/login?error=${error}`);
      return;
    }

    if (token) {
      localStorage.setItem('token', token);
      dispatch(setToken(token));
      router.replace('/');
    } else {
      router.replace('/login?error=missing_token');
    }
  }, [dispatch, router, searchParams]);

  return <p>Signing you in...</p>;
}
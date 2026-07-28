'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '@/redux/hooks';
import { setCredentials } from '@/redux/slices/authSlice';
import axios from 'axios';

function AuthCallbackContent() {
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

    if(!token) {
      router.replace(`/login?error=missing_token`);
      return;
    }
    const authToken: string = token;
    const handleAuth = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        localStorage.setItem('token', authToken);
        dispatch(setCredentials({ token: authToken, user: response.data.data }));
        router.replace('/');
      } catch (err) {
        console.error(err);
        console.log(authToken)
        router.replace('/login?error=profile_fetch_failed');
      }
    };

    handleAuth();
  }, [dispatch, router, searchParams]);

  return <p>Signing you in...</p>;
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<p>Signing you in...</p>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
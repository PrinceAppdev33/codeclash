'use client';

import { useState } from 'react';
import { useAppSelector } from '../../redux/hooks';
import { useRouter } from 'next/navigation';
import { getSocket } from '../../lib/socket';

const StartMatchButton = () => {
  const isAuthenticated = useAppSelector(
    (state) => state.auth.isAuthenticated
  );
  const token = useAppSelector((state) => state.auth.token);

  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStartMatch = () => {
    if (!isAuthenticated || !token) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);

      const socket = getSocket(token);

      const handleMatchFound = (match: { id: string }) => {
        socket.off('match:found', handleMatchFound);
        socket.off('queue:error', handleQueueError);

        router.push(`/matches/${match.id}`);
      };

      const handleQueueError = (error: { message: string }) => {
        console.error('Queue error:', error);

        socket.off('match:found', handleMatchFound);
        socket.off('queue:error', handleQueueError);

        setLoading(false);
      };

      socket.once('match:found', handleMatchFound);
      socket.once('queue:error', handleQueueError);

      socket.emit('queue:join');
    } catch (error) {
      console.error('Failed to start match:', error);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      className="mb-[32vh] bg-[#fff8e7] text-[#a80f00] border-[5px] border-[#4a2100] px-8 py-4 text-base md:text-xl shadow-[0_6px_0_#000] hover:bg-white hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_#000] transition-all cursor-pointer pointer-events-auto disabled:opacity-50"
      style={{
        clipPath: `polygon(
          0 8px, 8px 8px, 8px 0,
          calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px,
          100% calc(100% - 8px),
          calc(100% - 8px) calc(100% - 8px),
          calc(100% - 8px) 100%,
          8px 100%, 8px calc(100% - 8px),
          0 calc(100% - 8px)
        )`,
      }}
      onClick={handleStartMatch}
    >
      {loading ? 'SEARCHING...' : 'START MATCH'}
    </button>
  );
};

export default StartMatchButton;
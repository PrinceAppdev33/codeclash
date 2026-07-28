'use client';

import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/redux/hooks';

export default function ProfileButton() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) return null;

  return (
    <button
      type="button"
      onClick={() => router.push('/profile')}
      className="bg-[#4a2100] text-[#fff8e7] border-[4px] border-[#2a1204] px-6 py-3 text-sm md:text-lg font-bold shadow-[0_5px_0_#000] hover:bg-[#6b3000] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_2px_0_#000] transition-all cursor-pointer pointer-events-auto tracking-wider uppercase flex items-center gap-3"
      style={{
        clipPath: `polygon(
          0 6px, 6px 6px, 6px 0,
          calc(100% - 6px) 0, calc(100% - 6px) 6px, 100% 6px,
          100% calc(100% - 6px), calc(100% - 6px) calc(100% - 6px), calc(100% - 6px) 100%,
          6px 100%, 6px calc(100% - 6px), 0 calc(100% - 6px)
        )`,
      }}
    >
      {/* Optional Pixel Avatar Preview */}
      {user?.avatarUrl && (
        <img
          src={user.avatarUrl}
          alt={user.username || 'Profile'}
          className="w-6 h-6 rounded-none border border-[#fff8e7] object-cover"
        />
      )}
      PROFILE
    </button>
  );
}
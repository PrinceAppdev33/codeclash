'use client';

import { useRouter } from 'next/navigation';

export default function LoginButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push('/login')}
      className="bg-[#f0a830] text-[#3d1e03] border-[4px] border-[#4a2100] px-6 py-3 text-sm md:text-lg font-bold shadow-[0_5px_0_#000] hover:bg-[#ffbe4d] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_2px_0_#000] transition-all cursor-pointer pointer-events-auto tracking-wider uppercase"
      style={{
        clipPath: `polygon(
          0 6px, 6px 6px, 6px 0,
          calc(100% - 6px) 0, calc(100% - 6px) 6px, 100% 6px,
          100% calc(100% - 6px), calc(100% - 6px) calc(100% - 6px), calc(100% - 6px) 100%,
          6px 100%, 6px calc(100% - 6px), 0 calc(100% - 6px)
        )`,
      }}
    >
      LOG IN
    </button>
  );
}
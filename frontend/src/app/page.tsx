import Image from 'next/image';
import type { Metadata } from 'next';
import SunsetBackground from '@/components/layout/SunsetBackground';

export const metadata: Metadata = {
  title: 'CodeClash - 8-Bit Developer Duels',
  description: 'Enter CodeClash for real-time 8-bit competitive coding duels.',
};

export default function CodeClashHero() {
  return (
    <SunsetBackground>
      <div className="absolute bottom-[6%] w-full flex justify-between px-[1%] z-50 pointer-events-none">
        <Image
          src="/images/cowboy.png"
          alt="CodeClash Cowboy Fighter"
          width={320}
          height={340}
          priority
          className="h-[58vh] min-h-[320px] w-auto pixel-art animate-retro-idle"
        />
        <Image
          src="/images/sheriff.png"
          alt="CodeClash Sheriff Opponent"
          width={320}
          height={340}
          priority
          className="h-[58vh] min-h-[320px] w-auto pixel-art animate-retro-idle-delayed"
        />
      </div>

      <div className="relative z-[60] w-full h-full flex flex-col items-center justify-between py-[6vh]">
        <header className="flex items-center gap-4 md:gap-6 mt-4">
          <Image
            src="/images/crow.png"
            alt=""
            width={48}
            height={48}
            className="h-[8vh] w-auto pixel-art"
            aria-hidden="true"
          />
          <h1 className="text-[3.5vw] min-text-[1.8rem] text-yellow-400 uppercase tracking-widest [text-shadow:_4px_4px_0_#000,_-4px_-4px_0_#000,_4px_-4px_0_#000,_-4px_4px_0_#000,_0_6px_0_#000]">
            CODECLASH
          </h1>
        </header>

       <button
          type="button"
          className="mb-[32vh] bg-[#fff8e7] text-[#a80f00] border-[5px] border-[#4a2100] px-8 py-4 text-base md:text-xl shadow-[0_6px_0_#000] hover:bg-white hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_#000] transition-all cursor-pointer pointer-events-auto"
          style={{
            clipPath: `polygon(
              0 8px, 8px 8px, 8px 0,
              calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px,
              100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) 100%,
              8px 100%, 8px calc(100% - 8px), 0 calc(100% - 8px)
            )`,
          }}
        >
          START MATCH
      </button>
      </div>
    </SunsetBackground>
  );
}
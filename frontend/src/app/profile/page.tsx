'use client';
import Link from 'next/link';
import { useAppSelector } from '@/redux/hooks';
import StatCard from '@/components/profile/StatCard';

export default function ProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const wins = user?.wins ?? 0;
  const losses = user?.losses ?? 0;
  const totalGames = wins + losses;
  const winRate = totalGames > 0 ? `${Math.round((wins / totalGames) * 100)}%` : '0%';

  return (
    <div
      className="relative flex-col min-h-screen items-center justify-center px-6 py-8"
      style={{
        fontFamily: "'Press Start 2P', 'VT323', monospace",
        backgroundColor: '#5a2c10',
        backgroundImage: "url('/images/profileWall.png')",
        backgroundSize: '128px 128px',
        backgroundRepeat: 'repeat',
        backgroundPosition: 'top left',
      }}
    >
        <div className="mb-6 w-full ">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#2a1204] px-5 py-3 text-xs font-black uppercase text-[#f9ecbf] shadow-[4px_4px_0_0_rgba(0,0,0,0.6)] transition-all hover:bg-[#3d1a06] hover:text-[#ffffff] active:translate-y-1 active:shadow-none"
          >
            <span>&lt;</span> BACK TO TOWN
          </Link>
        </div>
      <div className="pointer-events-none flex justify-center  absolute inset-0 bg-black/10" />
      <div className="w-full flex items-center justify-center">
      <div className="relative z-10 my-auto w-full max-w-4xl">
        <div className="pixel-corners-wrapper mx-auto shadow-[12px_12px_0_0_rgba(25,8,0,0.75)]">
          <div className="pixel-corners relative w-full">
            <div className="relative z-10 bg-[#f9ecbf] px-8 py-8 sm:px-12 sm:py-10">
              <div className="border-2 border-dashed border-[#2a1204]/70 px-6 py-6 sm:px-8 sm:py-7">
                <h1 className="text-center text-4xl font-black uppercase tracking-[0.18em] text-[#241004] sm:text-5xl">
                  WANTED
                </h1>
                <div className="my-6 flex items-center gap-4">
                  <div className="h-[4px] flex-1 bg-[#2a1204]" />
                  <div className="h-4 w-4 bg-[#2a1204]" />
                  <div className="h-[4px] flex-1 bg-[#2a1204]" />
                </div>
                <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:gap-12">
                  <div className="pixel-corners-wrapper !w-auto shrink-0 !p-[6px] shadow-[7px_7px_0_0_#5a2c10]">
                    <div className="pixel-corners relative !min-h-0">
                      <div className="relative z-10 flex h-44 w-44 items-center justify-center bg-[#f4c57f] sm:h-48 sm:w-48 overflow-hidden">
                        {user?.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.username || 'User Avatar'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl text-[#2a1204]">
                            {user?.username?.[0]?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-center text-center uppercase sm:text-left">
                    <div>
                      <p className="text-xs font-black tracking-wider text-[#71401f] sm:text-sm">
                        Username
                      </p>
                      <p className="mt-3 break-all text-lg font-black leading-relaxed text-[#211004] sm:text-2xl">
                        {user?.username || 'ANONYMOUS'}
                      </p>
                    </div>
                    <div className="my-6 h-[3px] w-full bg-[#2a1204]/30" />
                    <div>
                      <p className="text-xs font-black tracking-wider text-[#71401f] sm:text-sm">
                        Bounty (ELO)
                      </p>
                      <p className="mt-3 text-3xl font-black text-[#211004] sm:text-4xl">
                        {user?.elo ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <StatCard label="Wins" value={wins} />
          <StatCard label="Losses" value={losses} />
          <StatCard label="Win Rate" value={winRate} />
        </div>
      </div>
      </div>
    </div>
  );
}

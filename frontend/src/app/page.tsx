'use client';
import Image from 'next/image';
import SunsetBackground from '@/components/layout/SunsetBackground';
import  LoginButton from '@/components/auth/LoginButton';
import SignupButton  from '@/components/auth/SignupButton';
import StartMatchButton from '@/components/match/StartMatchButton';
import LogoutButton from '@/components/auth/LogoutButton';
import ProfileButton from '@/components/auth/ProfileButton';
import { useAppSelector } from '../redux/hooks';




export default function CodeClashHero() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);  
  console.log('isAuthenticated:', isAuthenticated);
  return (
    <SunsetBackground>
      {!isAuthenticated?(
          <div className="m-[2vh] flex  flex-wrap items-center justify-end gap-4 z-50">
            <LoginButton />
            <SignupButton />
          </div>
        ):(
          <div className="m-[2vh] flex  items-center justify-between gap-4 z-50">
            <ProfileButton />
            <LogoutButton />
          </div>
        )
      }
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
          <h1 className="text-[6vw] min-text-[1.8rem] text-yellow-400 uppercase tracking-widest [text-shadow:_4px_4px_0_#000,_-4px_-4px_0_#000,_4px_-4px_0_#000,_-4px_4px_0_#000,_0_6px_0_#000]">
            CODECLASH
          </h1>
        </header>

        <StartMatchButton />
      </div>
    </SunsetBackground>
  );
}
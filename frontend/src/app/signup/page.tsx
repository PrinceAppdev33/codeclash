import SunsetBackground from '@/components/layout/SunsetBackground';

export default function SignupPage() {
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
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold tracking-wide">
                    NAME
                </label>
                <input
                  type="text"
                  placeholder="Choose your username"
                  className="w-full border-2 border-[#3b1a0b] bg-[#fff8e7] px-4 py-3 text-sm outline-none placeholder:text-[#3b1a0b]/40 focus:bg-[#fff1c7]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold tracking-wide">
                  EMAIL
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full border-2 border-[#3b1a0b] bg-[#fff8e7] px-4 py-3 text-sm outline-none placeholder:text-[#3b1a0b]/40 focus:bg-[#fff1c7]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold tracking-wide">
                  PASSWORD
                </label>
                <input
                  type="password"
                  placeholder="Create a password"
                  className="w-full border-2 border-[#3b1a0b] bg-[#fff8e7] px-4 py-3 text-sm outline-none placeholder:text-[#3b1a0b]/40 focus:bg-[#fff1c7]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold tracking-wide">
                  CONFIRM PASSWORD
                </label>
                <input
                  type="password"
                  placeholder="Repeat your password"
                  className="w-full border-2 border-[#3b1a0b] bg-[#fff8e7] px-4 py-3 text-sm outline-none placeholder:text-[#3b1a0b]/40 focus:bg-[#fff1c7]"
                />
              </div>
              <button
                type="button"
                className="mt-2 w-full bg-[#4a2100] px-4 py-3 font-bold tracking-wider text-[#fff8e7] transition hover:bg-[#6b3000]"
              >
                CREATE ACCOUNT
              </button>
              <div className="flex items-center gap-3">
                <div className="h-[2px] flex-1 bg-[#3b1a0b]/30" />

                <span className="text-xs font-bold">
                  OR
                </span>
                <div className="h-[2px] flex-1 bg-[#3b1a0b]/30" />
              </div>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 border-2 border-[#3b1a0b] bg-transparent px-4 py-3 font-bold tracking-wide transition hover:bg-[#3b1a0b] hover:text-[#fff8e7]"
              >
                SIGN UP WITH GITHUB
              </button>
              <p className="pt-1 text-center text-sm">
                Already have an account?{' '}
                <button
                  type="button"
                  className="font-bold underline underline-offset-2"
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
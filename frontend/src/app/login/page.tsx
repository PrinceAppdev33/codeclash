import SunsetBackground from '@/components/layout/SunsetBackground';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <SunsetBackground>
      <div className="w-full h-full flex justify-center items-center p-6">
        <div className="pixel-corners-wrapper">
          <div className="pixel-corners text-black p-8 flex flex-col min-w-[380px]">
            <div className="relative z-10 text-4xl font-bold mb-6">
              CodeClash
            </div>
            <form className="relative z-10 flex flex-col gap-5" >
              <div className="flex flex-col gap-2">
                <label className="text-2xl font-bold">
                  Email
                </label>
                <input
                  type="email"
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
                  placeholder="Enter your password"
                  className="w-full px-4 py-2 bg-white text-black placeholder-gray-500 border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-600"
                />
              </div>

              <button
                type="submit"
                className="mt-2 w-full bg-[#4a2100] px-4 py-3 font-bold tracking-wider text-[#fff8e7] transition hover:bg-[#6b3000]"
              >
                LOGIN
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 border-2 border-[#3b1a0b] bg-transparent px-4 py-3 font-bold tracking-wide transition hover:bg-[#3b1a0b] hover:text-[#fff8e7]"
              >
                SIGN UP WITH GITHUB
              </button>

              <div className="flex justify-between text-sm font-bold mt-1">
                <a href="#forgot" className="hover:underline">Forgot password?</a>
                <a href="#signup" className="hover:underline">Sign up</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </SunsetBackground>
  );
}
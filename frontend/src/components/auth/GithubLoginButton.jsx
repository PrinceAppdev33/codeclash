'use client';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const  GithubLoginButton = () => {
  return (
    <div>
       <a
            type="button"
            href={`${API_URL}/api/auth/github`}
            className="flex w-full items-center justify-center gap-3 border-2 border-[#3b1a0b] bg-transparent px-4 py-3 font-bold tracking-wide transition hover:bg-[#3b1a0b] hover:text-[#fff8e7]"
        >
            SIGN UP WITH GITHUB
        </a>
    </div>
  )
}



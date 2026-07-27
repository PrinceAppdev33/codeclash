'use client';
import { useAppSelector } from "../../redux/hooks";
import { redirect } from 'next/navigation';

const StartMatchButton = () => {
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);  
    const handleStartMatch = () => {
        if(isAuthenticated) {
            redirect('/match');
        }else {
            redirect('/login');
        }
    }
  return (
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
        onClick={handleStartMatch}
    >
        START MATCH
    </button>
  )
}

export default StartMatchButton

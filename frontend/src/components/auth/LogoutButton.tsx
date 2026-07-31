'use client';

import { useRouter } from 'next/navigation';
import { useAppDispatch } from '../../redux/hooks';
import { logout } from '../../redux/slices/authSlice';

export default function LogoutButton() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    console.log('Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch(logout());
    router.replace('/login');
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="bg-[#a80f00] text-[#fff8e7] border-[4px] border-[#4a2100] px-6 py-3 text-sm md:text-lg font-bold shadow-[0_5px_0_#000] hover:bg-[#c91400] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_2px_0_#000] transition-all cursor-pointer pointer-events-auto tracking-wider uppercase"
      style={{
        clipPath: `polygon(
          0 6px, 6px 6px, 6px 0,
          calc(100% - 6px) 0, calc(100% - 6px) 6px, 100% 6px,
          100% calc(100% - 6px), calc(100% - 6px) calc(100% - 6px), calc(100% - 6px) 100%,
          6px 100%, 6px calc(100% - 6px), 0 calc(100% - 6px)
        )`,
      }}
    >
      LOG OUT
    </button>
  );
}
import Image from 'next/image';


export default function SunsetBaackground({ children }: { children: React.ReactNode }) {
  return (
    <main className={`relative w-screen h-screen overflow-hidden bg-[#d47a1e]`}> 
        <div className="absolute top-0 left-0 w-full h-[76%] z-0 bg-pixel-sky" />
        <div 
        className="absolute top-[24%] left-1/2 -translate-x-1/2 w-[22vw] max-w-[300px] min-w-[160px] aspect-square rounded-full z-10 pointer-events-none shadow-lg"
        style={{ backgroundColor: '#ffea75' }}
        />
        <div className="absolute bottom-[22%] left-0 w-full z-20 pointer-events-none">
            <Image
            src="/images/canyons.png"
            alt=""
            width={1920}
            height={400}
            priority
            className="w-full h-auto max-h-[38vh] object-cover pixel-art"
            aria-hidden="true"
            />
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[23%] bg-[#d47a1e] z-30" />
        <div className="absolute inset-0 z-40 pointer-events-none">
            <Image
            src="/images/cactus.png"
            alt=""
            width={140}
            height={200}
            className="absolute bottom-[9%] left-[3%] h-[20vh] w-auto pixel-art"
            aria-hidden="true"
            />
            <Image
            src="/images/tumbleweed.png"
            alt=""
            width={70}
            height={70}
            className="absolute bottom-[11%] left-[36%] h-[15vh] w-auto pixel-art"
            aria-hidden="true"
            />
        </div>
        <div className="relative z-[60] w-full h-full">
            {children}
        </div>
    </main>
  );
}
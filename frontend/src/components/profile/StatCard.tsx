export default function StatCard({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div className="pixel-corners-wrapper shadow-[8px_8px_0_0_rgba(25,8,0,0.75)]">
      <div className="pixel-corners relative !min-h-0">
        <div className="relative z-10 flex min-h-[150px] flex-col items-center justify-center bg-[#f9ecbf] px-5 py-7 text-center">
          <p className="text-xs font-black uppercase tracking-wider text-[#71401f] sm:text-sm">
            {label}
          </p>

          <div className="my-4 flex items-center gap-2">
            <div className="h-[3px] w-12 bg-[#2a1204]" />
            <div className="h-3 w-3 bg-[#2a1204]" />
            <div className="h-[3px] w-12 bg-[#2a1204]" />
          </div>

          <p className="text-3xl font-black text-[#211004] sm:text-4xl">
            {value ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
}
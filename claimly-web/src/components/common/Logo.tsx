export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 28 28">
      <rect width="28" height="28" rx="7" fill="#2F5D50" />
      <path d="M8 6.5h12v14.5l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z" fill="#F5F7F4" />
      <path d="M10.6 13.4l2.2 2.2 4.6-4.6" stroke="#2F5D50" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <div>
      <div className="flex items-center gap-2.5 px-2.5 pb-1">
        <LogoMark />
        <span className="text-[19px] font-semibold leading-[26px] tracking-[-0.3px]">Claimly</span>
      </div>
      <div className="pl-[50px] pr-2.5 pb-[18px] text-xs leading-4 text-secondary">Kaveri Infotech Pvt. Ltd.</div>
    </div>
  );
}

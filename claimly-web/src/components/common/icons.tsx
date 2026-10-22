type IconProps = { size?: number; className?: string };

const stroke = (size: number, className: string | undefined, children: React.ReactNode) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {children}
  </svg>
);

export const ReceiptIcon = ({ size = 16, className }: IconProps) =>
  stroke(size, className, <><path d="M3 2.5h10v11l-1.6-1-1.7 1-1.7-1-1.7 1-1.7-1-1.6 1z" /><path d="M5.5 6h5M5.5 8.5h5" /></>);
export const PlusCircleIcon = ({ size = 16, className }: IconProps) => stroke(size, className, <><circle cx="8" cy="8" r="5.5" /><path d="M8 5.5v5M5.5 8h5" /></>);
export const PlusIcon = ({ size = 14, className }: IconProps) => stroke(size, className, <path d="M8 3v10M3 8h10" />);
export const CardIcon = ({ size = 16, className }: IconProps) => stroke(size, className, <><path d="M2.5 4.5h11v8h-11z" /><path d="M2.5 7h11M5 10h2" /></>);
export const PolicyIcon = ({ size = 16, className }: IconProps) => stroke(size, className, <><path d="M3 2.5h7.5L13 5v8.5H3z" /><path d="M5.5 7.5h5M5.5 10h5" /></>);
export const HelpIcon = ({ size = 16, className }: IconProps) =>
  stroke(size, className, <><circle cx="8" cy="8" r="5.5" /><path d="M6.6 6.4a1.5 1.5 0 1 1 2 1.4c-.4.2-.6.5-.6.9v.4M8 11.2v.1" /></>);
export const InboxIcon = ({ size = 16, className }: IconProps) => stroke(size, className, <><path d="M2.5 9.5l2-6h7l2 6v4h-11z" /><path d="M2.5 9.5h3l1 1.5h3l1-1.5h3" /></>);
export const ChartIcon = ({ size = 16, className }: IconProps) => stroke(size, className, <path d="M3 13.5V8M6.5 13.5V4.5M10 13.5V7M13.5 13.5V2.5" />);
export const SearchIcon = ({ size = 16, className }: IconProps) => stroke(size, className, <><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5l3 3" /></>);
export const BellIcon = ({ size = 16, className }: IconProps) => stroke(size, className, <><path d="M4 11.5V7a4 4 0 0 1 8 0v4.5l1 1H3z" /><path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" /></>);
export const ClipIcon = ({ size = 16, className }: IconProps) => stroke(size, className, <path d="M10.5 5.5l-4.6 4.6a1.4 1.4 0 0 0 2 2l5-5a2.6 2.6 0 0 0-3.7-3.7l-5 5a3.8 3.8 0 0 0 5.4 5.4l4-4" />);
export const WarnIcon = ({ size = 18, className }: IconProps) => stroke(size, className, <><path d="M8 2.5l6 10.5H2z" /><path d="M8 6.5v3M8 11.2v.1" /></>);
export const CalendarIcon = ({ size = 16, className }: IconProps) => stroke(size, className, <><rect x="2" y="3" width="12" height="11" rx="1.5" /><path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" /></>);
export const CheckIcon = ({ size = 14, className }: IconProps) => stroke(size, className, <path d="M3.5 8.5l3 3 6-6.5" />);
export const UploadIcon = ({ size = 20, className }: IconProps) => stroke(size, className, <><path d="M8 10.5V3M5 6l3-3 3 3" /><path d="M3 10.5v2.5h10v-2.5" /></>);
export const ChevronIcon = ({ size = 14, className }: IconProps) => stroke(size, className, <path d="M5 6.5l3 3 3-3" />);

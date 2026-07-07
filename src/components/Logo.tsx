export function LogoIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 196 220" 
      className={className} 
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(88, 108)">
        {/* 'B' Body */}
        <rect x="-88" y="-108" width="32" height="216" rx="16" fill="currentColor" />
        <ellipse cx="20" cy="-48" rx="78" ry="58" fill="currentColor" />
        <ellipse cx="24" cy="50" rx="84" ry="62" fill="currentColor" />
        
        {/* 'W' Highlight */}
        <path 
          d="M -16,-56 L 8,56 L 32,-8 L 56,56 L 84,-56"
          fill="none" 
          stroke="var(--color-burnt-orange)" 
          strokeWidth="16" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </g>
    </svg>
  );
}

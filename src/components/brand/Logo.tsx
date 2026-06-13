interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-sm gap-2',
    md: 'text-lg gap-2.5',
    lg: 'text-2xl gap-3.5',
  };

  const ringSizes = {
    sm: 'w-3.5 h-3.5 border',
    md: 'w-5 h-5 border',
    lg: 'w-8 h-8 border',
  };

  return (
    <div className={`flex items-center font-display font-medium tracking-[0.2em] text-primary ${sizeClasses[size]} ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Simplified clean orbit convergence */}
        <div className={`rounded-full border-dashed border-secondary/40 animate-orbit ${ringSizes[size]}`} />
        <div className="absolute w-1 h-1 rounded-full bg-accent-primary" />
      </div>
      <span className="font-semibold select-none">ETHER</span>
    </div>
  );
}
export default Logo;


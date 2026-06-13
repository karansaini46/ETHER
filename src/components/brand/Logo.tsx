interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg gap-1.5',
    md: 'text-2xl gap-2',
    lg: 'text-4xl gap-3',
  };

  const ringSizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-[3px]',
  };

  return (
    <div className={`flex items-center font-display font-semibold tracking-[0.25em] text-white ${sizeClasses[size]} ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Orbital animation */}
        <div className={`rounded-full border-dashed border-cyber-blue animate-orbit ${ringSizes[size]}`} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-cyber-blue shadow-neon-blue" />
      </div>
      <span>ETHER</span>
    </div>
  );
}
export default Logo;

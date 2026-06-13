import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  angle: number;
  distance: number;
  speed: number;
}

export function GalaxyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: Particle[] = [];
    const particleCount = 200;
    const colors = ['#00d4ff', '#7c3aed', '#ec4899', '#ffffff'];

    // Initialize particles in a spiral pattern
    for (let i = 0; i < particleCount; i++) {
      const distance = Math.random() * (Math.min(width, height) * 0.4) + 20;
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.0002 + Math.random() * 0.0003) * (1 - distance / (Math.min(width, height) * 0.45));
      const size = Math.random() * 1.5 + 0.5;
      const color = colors[Math.floor(Math.random() * colors.length)] || '#00d4ff';

      particles.push({
        x: 0,
        y: 0,
        size,
        color,
        angle,
        distance,
        speed,
      });
    }

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.fillStyle = 'rgba(2, 2, 4, 0.08)';
      ctx.fillRect(0, 0, width, height);

      // Centered on mouse with lag
      const centerX = width / 2 + (mouseX - width / 2) * 0.05;
      const centerY = height / 2 + (mouseY - height / 2) * 0.05;

      for (const p of particles) {
        p.angle += p.speed;
        p.x = centerX + Math.cos(p.angle) * p.distance;
        p.y = centerY + Math.sin(p.angle) * p.distance;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = p.size * 2;
        ctx.shadowColor = p.color;
        ctx.fill();
      }

      ctx.shadowBlur = 0; // reset
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-40" />;
}
export default GalaxyBackground;

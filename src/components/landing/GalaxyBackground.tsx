import { useEffect, useRef, useState } from 'react';
import { useExplorerStore } from '@/stores/explorer';

interface StarNode {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  isRisk?: boolean;
}

export function GalaxyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<StarNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<StarNode | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const nodesRef = useRef<StarNode[]>([]);

  const isAnalyzing = useExplorerStore((s) => 
    s.analysisStage !== 'idle' && s.analysisStage !== 'ready' && s.analysisStage !== 'error'
  );

  // Initialize nodes in 3D space once
  if (nodesRef.current.length === 0) {
    const mockNodes: StarNode[] = [
      { id: '1', name: 'server/index.ts', x: -100, y: 40, z: 20, size: 4.5, color: '#E3C78A' }, // Selected Accent
      { id: '2', name: 'src/App.tsx', x: 80, y: -60, z: -40, size: 3.5, color: '#ECE9E1' },
      { id: '3', name: 'src/main.tsx', x: 20, y: 30, z: -90, size: 3, color: '#ECE9E1' },
      { id: '4', name: 'server/services/analysis.ts', x: -60, y: -90, z: 80, size: 4, color: '#C6504B', isRisk: true }, // Risk
      { id: '5', name: 'server/routes/navigator.ts', x: -140, y: -30, z: 10, size: 3.5, color: '#ECE9E1' },
      { id: '6', name: 'src/stores/explorer.ts', x: 120, y: 100, z: 30, size: 3, color: '#ECE9E1' },
      { id: '7', name: 'src/components/galaxy/StarField.tsx', x: 140, y: 50, z: -10, size: 3.5, color: '#97958E' },
      { id: '8', name: 'src/components/inspector/FileInspector.tsx', x: -30, y: 120, z: -50, size: 3, color: '#97958E' },
      { id: '9', name: 'server/services/dependency-parser.ts', x: 40, y: -110, z: 50, size: 3.2, color: '#ECE9E1' },
    ];

    // Add extra smaller background stars
    for (let i = 0; i < 90; i++) {
      const radius = 120 + Math.random() * 220;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      mockNodes.push({
        id: `bg-${i}`,
        name: `src/utils/helper_${i}.ts`,
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi),
        size: Math.random() * 1.5 + 0.8,
        color: Math.random() > 0.85 ? '#A8AF86' : Math.random() > 0.7 ? '#97958E' : '#ECE9E1',
      });
    }

    nodesRef.current = mockNodes;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Setup base mouse coordinate tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseRef.current.targetX = (x - width / 2) * 0.15;
      mouseRef.current.targetY = (y - height / 2) * 0.15;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
    };

    const handleResize = () => {
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    // Listeners bound to canvas container to avoid full window listening
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    // Track tab visibility to pause animation loops completely
    let isTabVisible = true;
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        cancelAnimationFrame(animationFrameId);
        render();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Camera angles
    let angleY = 0.001; // Continuous slow orbital drift
    let angleX = 0.0005;

    let projected: Array<{
      node: StarNode;
      x: number;
      y: number;
      z: number;
      factor: number;
    }> = [];

    const render = () => {
      if (!isTabVisible) return;

      ctx.fillStyle = '#090909';
      ctx.fillRect(0, 0, width, height);

      // Technical reference grid on bottom right
      ctx.strokeStyle = 'rgba(236, 233, 225, 0.03)';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let j = 0; j < height; j += 40) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
        ctx.stroke();
      }

      // Smooth pointer response interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Update angles - slow down dramatically if analyzing to save resources
      if (isAnalyzing) {
        angleY += 0.0002;
        angleX += 0.0001;
      } else {
        angleY += 0.0008 + mouseRef.current.x * 0.0001;
        angleX += 0.0002 + mouseRef.current.y * 0.0001;
      }

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      // Project nodes to 2D
      projected = nodesRef.current.map((node) => {
        // Rotate around Y axis
        let x1 = node.x * cosY - node.z * sinY;
        let z1 = node.x * sinY + node.z * cosY;

        // Rotate around X axis
        let y2 = node.y * cosX - z1 * sinX;
        let z2 = node.y * sinX + z1 * cosX;

        // Perspective projection
        const cameraDistance = 450;
        const perspectiveFactor = cameraDistance / (cameraDistance + z2);

        // Center on canvas with scale offset to look cropped/huge
        const posX = width * 0.55 + x1 * perspectiveFactor * 1.3;
        const posY = height * 0.5 + y2 * perspectiveFactor * 1.3;

        return {
          node,
          x: posX,
          y: posY,
          z: z2,
          factor: perspectiveFactor,
        };
      });

      // Sort projected points by depth (painters algorithm)
      projected.sort((a, b) => b.z - a.z);

      // Draw dependency links - completely skip this if analyzing for performance
      if (!isAnalyzing) {
        ctx.strokeStyle = 'rgba(236, 233, 225, 0.05)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < projected.length; i++) {
          const p1 = projected[i];
          if (p1.node.id.startsWith('bg-')) continue;

          // Link with other cluster items
          for (let j = i + 1; j < projected.length; j++) {
            const p2 = projected[j];
            if (p2.node.id.startsWith('bg-')) continue;

            // Connect if Euclidean distance in 3D is close
            const dx = p1.node.x - p2.node.x;
            const dy = p1.node.y - p2.node.y;
            const dz = p1.node.z - p2.node.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < 180) {
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }

      // Draw nodes
      for (const p of projected) {
        const radius = p.node.size * p.factor;
        if (radius <= 0) continue;

        const isHovered = hoveredNode?.id === p.node.id;
        const isSelected = selectedNode?.id === p.node.id;

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);

        if (isSelected) {
          ctx.fillStyle = '#E3C78A'; // Muted beige selected
        } else if (isHovered) {
          ctx.fillStyle = '#C56A3A'; // Accent orange
        } else {
          ctx.fillStyle = p.node.color;
        }

        ctx.fill();

        // Sparse annotation labels for key nodes
        if (!p.node.id.startsWith('bg-') && (p.node.id === '1' || p.node.id === '4' || isHovered || isSelected)) {
          ctx.save();
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillStyle = isSelected ? '#E3C78A' : isHovered ? '#C56A3A' : 'rgba(236, 233, 225, 0.8)';
          
          // Technical indicator pointer line
          ctx.strokeStyle = 'rgba(236, 233, 225, 0.15)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + 15, p.y - 15);
          ctx.lineTo(p.x + 80, p.y - 15);
          ctx.stroke();

          // Label text
          ctx.fillText(p.node.name, p.x + 20, p.y - 20);
          
          // Metadata status tick
          ctx.font = '8px "JetBrains Mono", monospace';
          ctx.fillStyle = 'rgba(151, 149, 142, 0.6)';
          const metaText = p.node.isRisk ? `[RISK_HIGH]` : `[LOC: ${(p.node.size * 100).toFixed(0)}]`;
          ctx.fillText(metaText, p.x + 20, p.y - 8);
          ctx.restore();
        }
      }

      // Technical boundary annotation lines
      ctx.save();
      ctx.strokeStyle = 'rgba(236, 233, 225, 0.08)';
      ctx.setLineDash([2, 4]);
      
      // Top horizontal grid marker
      ctx.beginPath();
      ctx.moveTo(width * 0.1, 40);
      ctx.lineTo(width * 0.9, 40);
      ctx.stroke();
      
      // Bottom horizontal marker
      ctx.beginPath();
      ctx.moveTo(width * 0.1, height - 40);
      ctx.lineTo(width * 0.9, height - 40);
      ctx.stroke();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    // Node click/hover detection
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Find closest node to click
      let closest: typeof projected[0] | null = null;
      let minDist = 18; // Click tolerance radius

      for (const p of projected) {
        if (p.node.id.startsWith('bg-')) continue;
        const dx = clickX - p.x;
        const dy = clickY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          closest = p;
          minDist = dist;
        }
      }

      if (closest) {
        setSelectedNode(closest.node);
        // Briefly release focus after 1.5s
        setTimeout(() => setSelectedNode(null), 1500);
      }
    };

    const handleCanvasMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      let found: typeof projected[0] | null = null;
      let minDist = 12;

      for (const p of projected) {
        if (p.node.id.startsWith('bg-')) continue;
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          found = p;
          minDist = dist;
        }
      }

      setHoveredNode(found ? found.node : null);
    };

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('mousemove', handleCanvasMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [hoveredNode, selectedNode, isAnalyzing]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none">
      <canvas 
        ref={canvasRef} 
        aria-hidden="true" 
        className="absolute inset-0 w-full h-full block cursor-crosshair opacity-80 pointer-events-auto" 
      />
      
      {/* HUD floating instrumentation markers */}
      <div className="absolute bottom-12 right-12 font-mono text-[9px] text-secondary/40 flex flex-col gap-1 text-right pointer-events-none select-none">
        <div>SYS_ORBIT_CAMERA: ACTIVE</div>
        <div>FIELD_DEPTH: 450px</div>
        <div>ROTATION_SPEED: {isAnalyzing ? 'Y_DRFT:0.0002 X_DRFT:0.0001' : 'Y_DRFT:0.0008 X_DRFT:0.0002'}</div>
        <div>SCANNER_STARS: {nodesRef.current.length}</div>
      </div>

      <div className="absolute top-12 right-12 font-mono text-[9px] text-secondary/40 pointer-events-none select-none">
        <div>LAT: 45° 12' 4" N</div>
        <div>LNG: 122° 40' 5" W</div>
      </div>
    </div>
  );
}

export default GalaxyBackground;

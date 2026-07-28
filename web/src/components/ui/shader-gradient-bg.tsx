import React, { useEffect, useRef } from "react";

export const ShaderGradientBG: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Dynamic Orbs spanning the full canvas viewport
    const orbs = [
      { x: width * 0.2, y: height * 0.25, vx: 0.4, vy: 0.3, radius: Math.max(width, height) * 0.5, color: [99, 102, 241] }, // Indigo
      { x: width * 0.85, y: height * 0.35, vx: -0.3, vy: 0.4, radius: Math.max(width, height) * 0.45, color: [168, 85, 247] }, // Purple
      { x: width * 0.5, y: height * 0.75, vx: 0.35, vy: -0.4, radius: Math.max(width, height) * 0.5, color: [14, 165, 233] }, // Cyan
      { x: width * 0.15, y: height * 0.85, vx: 0.4, vy: -0.3, radius: Math.max(width, height) * 0.4, color: [236, 72, 153] }, // Pink
    ];

    let t = 0;

    const render = () => {
      t += 0.004;
      ctx.fillStyle = "#030712"; // Deep space background
      ctx.fillRect(0, 0, width, height);

      // Render radial gradients that smoothly float as the user scrolls
      orbs.forEach((orb, i) => {
        orb.x += Math.sin(t + i * 1.5) * orb.vx * 1.5;
        orb.y += Math.cos(t + i * 1.5) * orb.vy * 1.5;

        const grad = ctx.createRadialGradient(
          orb.x,
          orb.y,
          0,
          orb.x,
          orb.y,
          orb.radius
        );
        const [r, g, b] = orb.color;
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.25)`);
        grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.08)`);
        grad.addColorStop(1, "rgba(3, 7, 18, 0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-90 transition-opacity duration-1000"
    />
  );
};

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

    // Dynamic Orbs spanning the entire viewport
    const orbs = [
      { x: width * 0.25, y: height * 0.2, vx: 0.6, vy: 0.4, radius: Math.max(width, height) * 0.55, color: [99, 102, 241] }, // Indigo
      { x: width * 0.8, y: height * 0.3, vx: -0.5, vy: 0.5, radius: Math.max(width, height) * 0.5, color: [168, 85, 247] },  // Purple
      { x: width * 0.5, y: height * 0.65, vx: 0.4, vy: -0.5, radius: Math.max(width, height) * 0.55, color: [14, 165, 233] },  // Cyan
      { x: width * 0.15, y: height * 0.85, vx: 0.5, vy: -0.4, radius: Math.max(width, height) * 0.45, color: [236, 72, 153] }, // Pink
      { x: width * 0.85, y: height * 0.85, vx: -0.4, vy: -0.3, radius: Math.max(width, height) * 0.45, color: [59, 130, 246] }, // Blue
    ];

    let t = 0;

    const render = () => {
      t += 0.005;
      ctx.fillStyle = "#030712"; // Deep slate space background
      ctx.fillRect(0, 0, width, height);

      // Render vivid radial gradients
      orbs.forEach((orb, i) => {
        orb.x += Math.sin(t + i * 1.5) * orb.vx * 1.8;
        orb.y += Math.cos(t + i * 1.5) * orb.vy * 1.8;

        const grad = ctx.createRadialGradient(
          orb.x,
          orb.y,
          0,
          orb.x,
          orb.y,
          orb.radius
        );
        const [r, g, b] = orb.color;
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.38)`);
        grad.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, 0.14)`);
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
      className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-100 transition-opacity duration-1000"
    />
  );
};

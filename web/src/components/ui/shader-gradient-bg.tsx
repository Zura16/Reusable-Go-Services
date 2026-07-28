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

    // Soft Pastel Ambient Orbs (Lavender, Sage Mint, Rose Peach, Sky Blue, Butter Yellow)
    const orbs = [
      { x: width * 0.2, y: height * 0.25, vx: 0.35, vy: 0.25, radius: Math.max(width, height) * 0.55, color: [185, 175, 225] }, // Pastel Lavender
      { x: width * 0.8, y: height * 0.3, vx: -0.3, vy: 0.35, radius: Math.max(width, height) * 0.5, color: [165, 210, 195] },  // Pastel Sage Mint
      { x: width * 0.5, y: height * 0.7, vx: 0.3, vy: -0.35, radius: Math.max(width, height) * 0.55, color: [225, 185, 195] }, // Pastel Rose Peach
      { x: width * 0.15, y: height * 0.85, vx: 0.35, vy: -0.25, radius: Math.max(width, height) * 0.45, color: [175, 205, 235] }, // Pastel Sky Blue
      { x: width * 0.85, y: height * 0.85, vx: -0.25, vy: -0.25, radius: Math.max(width, height) * 0.45, color: [235, 225, 185] }, // Pastel Butter Yellow
    ];

    let t = 0;

    const render = () => {
      t += 0.003;
      ctx.fillStyle = "#0c0d12"; // Soft dark slate background
      ctx.fillRect(0, 0, width, height);

      // Render soft pastel radial gradients
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
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.22)`);
        grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.06)`);
        grad.addColorStop(1, "rgba(12, 13, 18, 0)");

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

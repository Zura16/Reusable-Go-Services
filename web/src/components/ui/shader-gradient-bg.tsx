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

    // Monochromatic Metallic Black / Charcoal / Silver Gradient Orbs
    const orbs = [
      { x: width * 0.2, y: height * 0.25, vx: 0.4, vy: 0.3, radius: Math.max(width, height) * 0.55, color: [45, 55, 72] },   // Charcoal
      { x: width * 0.8, y: height * 0.3, vx: -0.3, vy: 0.4, radius: Math.max(width, height) * 0.5, color: [71, 85, 105] },   // Metallic Silver
      { x: width * 0.5, y: height * 0.7, vx: 0.35, vy: -0.4, radius: Math.max(width, height) * 0.55, color: [30, 41, 59] },   // Dark Slate
      { x: width * 0.15, y: height * 0.85, vx: 0.4, vy: -0.3, radius: Math.max(width, height) * 0.45, color: [15, 23, 42] }, // Deep Obsidian
      { x: width * 0.85, y: height * 0.85, vx: -0.3, vy: -0.3, radius: Math.max(width, height) * 0.45, color: [100, 116, 139] }, // Light Silver Accent
    ];

    let t = 0;

    const render = () => {
      t += 0.004;
      ctx.fillStyle = "#000000"; // Pure Black
      ctx.fillRect(0, 0, width, height);

      // Render sleek metallic charcoal radial gradients
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
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.35)`);
        grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.12)`);
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");

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

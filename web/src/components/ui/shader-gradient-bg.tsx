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

    // Fluid Mesh Gradient Orbs
    const orbs = [
      { x: width * 0.2, y: height * 0.2, vx: 0.5, vy: 0.3, radius: width * 0.4, color: [99, 102, 241] }, // Indigo
      { x: width * 0.8, y: height * 0.3, vx: -0.4, vy: 0.4, radius: width * 0.35, color: [168, 85, 247] }, // Purple
      { x: width * 0.5, y: height * 0.8, vx: 0.3, vy: -0.5, radius: width * 0.45, color: [14, 165, 233] }, // Cyan
      { x: width * 0.1, y: height * 0.9, vx: 0.4, vy: -0.3, radius: width * 0.3, color: [236, 72, 153] }, // Pink
    ];

    let t = 0;

    const render = () => {
      t += 0.005;
      ctx.fillStyle = "#030712"; // Deep black/slate-950
      ctx.fillRect(0, 0, width, height);

      // Render Orbs with radial gradients
      orbs.forEach((orb, i) => {
        orb.x += Math.sin(t + i) * orb.vx * 2;
        orb.y += Math.cos(t + i) * orb.vy * 2;

        const grad = ctx.createRadialGradient(
          orb.x,
          orb.y,
          0,
          orb.x,
          orb.y,
          orb.radius
        );
        const [r, g, b] = orb.color;
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.28)`);
        grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.1)`);
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
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
    />
  );
};

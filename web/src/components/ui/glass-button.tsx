import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface LiquidGlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: "indigo" | "purple" | "emerald" | "cyan" | "amber" | "white";
  href?: string;
  target?: string;
  rel?: string;
  icon?: React.ReactNode;
}

export const LiquidGlassButton: React.FC<LiquidGlassButtonProps> = ({
  children,
  className,
  glowColor = "indigo",
  href,
  target,
  rel,
  icon,
  onClick,
  ...props
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const glowClasses = {
    indigo: "hover:shadow-indigo-500/50 hover:border-indigo-300/60",
    purple: "hover:shadow-purple-500/50 hover:border-purple-300/60",
    emerald: "hover:shadow-emerald-500/50 hover:border-emerald-300/60",
    cyan: "hover:shadow-cyan-500/50 hover:border-cyan-300/60",
    amber: "hover:shadow-amber-500/50 hover:border-amber-300/60",
    white: "hover:shadow-white/30 hover:border-white/60",
  };

  const glowBackgrounds = {
    indigo: "bg-indigo-500/30",
    purple: "bg-purple-500/30",
    emerald: "bg-emerald-500/30",
    cyan: "bg-cyan-500/30",
    amber: "bg-amber-500/30",
    white: "bg-white/20",
  };

  const content = (
    <>
      {/* Top Gloss Specular Highlight Line */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/90 to-transparent z-20" />

      {/* Intense Cursor Follow Radial Specular Lens */}
      {isHovered && (
        <span
          className="pointer-events-none absolute -inset-px opacity-100 transition-opacity duration-300 z-10"
          style={{
            background: `radial-gradient(180px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0.1) 40%, transparent 80%)`,
          }}
        />
      )}

      {/* Dynamic Ambient Fluid Glow Aura */}
      <span
        className={cn(
          "pointer-events-none absolute inset-0 blur-xl opacity-0 transition-opacity duration-500 z-0",
          glowBackgrounds[glowColor],
          isHovered ? "opacity-60" : "opacity-0"
        )}
      />

      <span className="relative z-20 flex items-center justify-center gap-2 text-white font-bold tracking-wide drop-shadow-md">
        {icon}
        {children}
      </span>
    </>
  );

  const combinedClasses = cn(
    "liquid-glass-btn font-bold py-3.5 px-7 rounded-2xl flex items-center justify-center gap-2 text-sm cursor-pointer transition-all duration-300 select-none",
    glowClasses[glowColor],
    className
  );

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={combinedClasses}
        onClick={onClick as any}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={combinedClasses}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  );
};

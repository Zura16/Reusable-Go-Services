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
    indigo: "hover:shadow-indigo-500/30 hover:border-indigo-400/40",
    purple: "hover:shadow-purple-500/30 hover:border-purple-400/40",
    emerald: "hover:shadow-emerald-500/30 hover:border-emerald-400/40",
    cyan: "hover:shadow-cyan-500/30 hover:border-cyan-400/40",
    amber: "hover:shadow-amber-500/30 hover:border-amber-400/40",
    white: "hover:shadow-white/20 hover:border-white/40",
  };

  const content = (
    <>
      {/* Specular cursor glow */}
      {isHovered && (
        <span
          className="pointer-events-none absolute -inset-px opacity-100 transition-opacity duration-300 z-10"
          style={{
            background: `radial-gradient(150px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.25), transparent 70%)`,
          }}
        />
      )}
      <span className="relative z-20 flex items-center justify-center gap-2">
        {icon}
        {children}
      </span>
    </>
  );

  const combinedClasses = cn(
    "liquid-glass-btn text-white font-semibold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 text-sm tracking-wide cursor-pointer transition-all duration-300",
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

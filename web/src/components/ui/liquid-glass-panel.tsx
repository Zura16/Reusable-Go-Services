import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface LiquidGlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: "indigo" | "purple" | "cyan" | "emerald";
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
}

export const LiquidGlassPanel: React.FC<LiquidGlassPanelProps> = ({
  children,
  className,
  title,
  subtitle,
  icon,
  badge,
  ...props
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative rounded-3xl overflow-hidden glass-card transition-all duration-300 group p-6 md:p-8 bg-transparent",
        className
      )}
      {...props}
    >
      {/* Top Gloss Specular Highlight Line */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/70 to-transparent z-20" />

      {/* Specular Cursor Glare Lens */}
      {isHovered && (
        <div
          className="pointer-events-none absolute -inset-px opacity-100 transition-opacity duration-300 z-10"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.02) 40%, transparent 80%)`,
          }}
        />
      )}

      {/* Panel Header */}
      {(title || icon || badge) && (
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-white/15">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-3 rounded-2xl liquid-glass-box text-white">
                {icon}
              </div>
            )}
            <div>
              {title && <h3 className="text-xl font-extrabold text-white tracking-tight drop-shadow-sm">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-300 font-medium mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {badge && (
            <span className="px-3.5 py-1 text-xs font-semibold rounded-full liquid-glass-box text-slate-200 tracking-wide uppercase">
              {badge}
            </span>
          )}
        </div>
      )}

      {/* Panel Body */}
      <div className="relative z-20">{children}</div>
    </div>
  );
};

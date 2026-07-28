import React from "react";
import { Code2, Zap } from "lucide-react";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";

export const Navbar: React.FC = () => {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto px-6 py-3 rounded-2xl glass-panel flex items-center justify-between shadow-2xl">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-white/20 text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 fill-current text-indigo-400" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-white tracking-tight">ServiceKit</span>
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden sm:inline-block">
              v0.1.0
            </span>
          </div>
        </a>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a
            href="#playground"
            onClick={(e) => scrollToSection(e, "playground")}
            className="hover:text-white transition-colors duration-200 py-1"
          >
            Playground
          </a>
          <a
            href="#auth"
            onClick={(e) => scrollToSection(e, "auth")}
            className="hover:text-white transition-colors duration-200 py-1"
          >
            Auth
          </a>
          <a
            href="#grpc"
            onClick={(e) => scrollToSection(e, "grpc")}
            className="hover:text-white transition-colors duration-200 py-1"
          >
            gRPC
          </a>
          <a
            href="#retries"
            onClick={(e) => scrollToSection(e, "retries")}
            className="hover:text-white transition-colors duration-200 py-1"
          >
            Retries
          </a>
          <a
            href="#telemetry"
            onClick={(e) => scrollToSection(e, "telemetry")}
            className="hover:text-white transition-colors duration-200 py-1"
          >
            Telemetry
          </a>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Zura16/Reusable-Go-Services"
            target="_blank"
            rel="noreferrer"
          >
            <LiquidMetalButton
              label="GitHub Repo"
              width={140}
              icon={<Code2 size={16} className="text-indigo-300" />}
            />
          </a>
        </div>
      </div>
    </nav>
  );
};

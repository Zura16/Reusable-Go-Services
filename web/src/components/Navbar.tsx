import React from "react";
import { ShieldCheck, Code2, Zap, Terminal } from "lucide-react";

export const Navbar: React.FC = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto px-6 py-3.5 rounded-2xl glass-panel flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-white tracking-tight">ServiceKit</span>
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden sm:inline-block">
              v0.1.0
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#playground" className="hover:text-white transition">Playground</a>
          <a href="#auth" className="hover:text-white transition">Auth</a>
          <a href="#grpc" className="hover:text-white transition">gRPC</a>
          <a href="#retries" className="hover:text-white transition">Retries</a>
          <a href="#telemetry" className="hover:text-white transition">Telemetry</a>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Zura16/Reusable-Go-Services"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition shadow-sm"
          >
            <Code2 className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </nav>
  );
};

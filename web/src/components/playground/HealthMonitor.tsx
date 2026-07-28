import React, { useState } from "react";
import { HeartPulse } from "lucide-react";
import PillNav from "@/components/ui/PillNav";

const FOREST_IMG = "https://images.unsplash.com/photo-1511884642898-4c92249e20b6?q=80&w=2400&auto=format&fit=crop";

export const HealthMonitor: React.FC = () => {
  const [isReady, setIsReady] = useState(true);
  const [healthStatus] = useState({ code: 200, status: "OK", text: "OK" });
  const [readyStatus, setReadyStatus] = useState({ code: 200, status: "OK", text: "Ready" });

  const toggleReadiness = (e: React.MouseEvent) => {
    e.preventDefault();
    const nextState = !isReady;
    setIsReady(nextState);
    if (nextState) {
      setReadyStatus({ code: 200, status: "OK", text: "Ready" });
    } else {
      setReadyStatus({ code: 503, status: "Service Unavailable", text: "Unavailable" });
    }
  };

  return (
    <div
      style={{
        backgroundImage: `url(${FOREST_IMG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className="relative rounded-3xl overflow-hidden text-white border border-white/20 shadow-2xl transition-all duration-300 p-6 md:p-8"
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm z-0" />

      {/* Content */}
      <div className="relative z-10 space-y-6">
        {/* Panel Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/10 border border-white/20 text-white">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white tracking-tight">
                Health & Readiness Probes
              </h3>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                K8s Probe Endpoints: /healthz (Always 200) & /readyz (Dynamic Check)
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1 text-xs font-semibold rounded-full bg-white/10 text-white border border-white/20 tracking-wide uppercase">
            K8s Ready
          </span>
        </div>

        {/* Probes Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Healthz Panel */}
          <div className="p-5 rounded-3xl bg-black/50 border border-white/20 text-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-white">GET /healthz</span>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-white/10 text-white border border-white/20">
                HTTP {healthStatus.code} {healthStatus.status}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Liveness Probe: Confirms HTTP process is running. Always returns 200 OK.
            </p>
            <div className="pt-2 font-mono text-[11px] text-white font-bold">
              Body: "{healthStatus.text}"
            </div>
          </div>

          {/* Readyz Panel */}
          <div className="p-5 rounded-3xl bg-black/50 border border-white/20 text-white space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono font-bold text-xs text-white">GET /readyz</span>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-white/10 text-white border border-white/20">
                HTTP {readyStatus.code} {readyStatus.status}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Readiness Probe: Calls custom `readyCheck()` function (e.g. DB/cache connectivity).
            </p>
            <div className="pt-2 font-mono text-[11px] text-white font-bold">
              Body: "{readyStatus.text}"
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <PillNav
            items={[
              { label: `Toggle readyCheck() (${isReady ? "READY" : "UNAVAILABLE"})`, href: "#", onClick: toggleReadiness }
            ]}
            baseColor="#000000"
            pillColor="#ffffff"
            hoveredPillTextColor="#ffffff"
            pillTextColor="#000000"
          />
        </div>
      </div>
    </div>
  );
};

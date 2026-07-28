import React, { useState } from "react";
import { HeartPulse } from "lucide-react";
import PillNav from "@/components/ui/PillNav";
import BorderGlow from "@/components/ui/BorderGlow";
import matrixBg from "@/assets/matrix-bg.png";

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
    <BorderGlow
      edgeSensitivity={35}
      glowColor="140 100 50"
      borderRadius={24}
      glowRadius={40}
      glowIntensity={1.5}
      colors={['#22c55e', '#10b981', '#34d399']}
    >
      <div
        style={{
          backgroundImage: `url(${matrixBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        className="relative rounded-3xl overflow-hidden text-white transition-all duration-300 p-6 md:p-8"
      >
        {/* Semi-transparent dark overlay allowing matrix text details to shine through */}
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] z-0" />

        {/* Content */}
        <div className="relative z-10 space-y-6">
          {/* Panel Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-black/60 border border-white/25 text-emerald-400">
                <HeartPulse className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white tracking-tight drop-shadow-md">
                  Health & Readiness Probes
                </h3>
                <p className="text-xs text-emerald-300 font-mono font-semibold mt-0.5 drop-shadow">
                  K8s Probe Endpoints: /healthz (Always 200) & /readyz (Dynamic Check)
                </p>
              </div>
            </div>
            <span className="px-3.5 py-1 text-xs font-mono font-bold rounded-full bg-black/70 text-emerald-400 border border-emerald-400/50 tracking-wide uppercase drop-shadow">
              K8s Ready
            </span>
          </div>

          {/* Probes Body */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Healthz Panel */}
            <div className="p-5 rounded-3xl bg-black/65 border border-white/30 text-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-emerald-400">GET /healthz</span>
                <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-black/80 text-emerald-300 border border-emerald-400/40 font-mono">
                  HTTP {healthStatus.code} {healthStatus.status}
                </span>
              </div>
              <p className="text-xs text-slate-200 font-medium">
                Liveness Probe: Confirms HTTP process is running. Always returns 200 OK.
              </p>
              <div className="pt-2 font-mono text-[11px] text-white font-bold">
                Body: "{healthStatus.text}"
              </div>
            </div>

            {/* Readyz Panel */}
            <div className="p-5 rounded-3xl bg-black/65 border border-white/30 text-white space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-xs text-emerald-400">GET /readyz</span>
                <span className={`px-3 py-0.5 rounded-full text-[11px] font-extrabold border font-mono ${
                  isReady
                    ? "bg-black/80 text-emerald-300 border-emerald-400/40"
                    : "bg-amber-950/80 text-amber-300 border-amber-500/40"
                }`}>
                  HTTP {readyStatus.code} {readyStatus.status}
                </span>
              </div>
              <p className="text-xs text-slate-200 font-medium">
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
    </BorderGlow>
  );
};

import React, { useState } from "react";
import { HeartPulse, RefreshCcw } from "lucide-react";
import { LiquidGlassPanel } from "@/components/ui/liquid-glass-panel";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";

export const HealthMonitor: React.FC = () => {
  const [isReady, setIsReady] = useState(true);
  const [healthStatus] = useState({ code: 200, status: "OK", text: "OK" });
  const [readyStatus, setReadyStatus] = useState({ code: 200, status: "OK", text: "Ready" });

  const toggleReadiness = () => {
    const nextState = !isReady;
    setIsReady(nextState);
    if (nextState) {
      setReadyStatus({ code: 200, status: "OK", text: "Ready" });
    } else {
      setReadyStatus({ code: 503, status: "Service Unavailable", text: "Unavailable" });
    }
  };

  return (
    <LiquidGlassPanel
      title="Health & Readiness Probes"
      subtitle="K8s Probe Endpoints: /healthz (Always 200) & /readyz (Dynamic Check)"
      icon={<HeartPulse className="w-5 h-5 text-emerald-300" />}
      badge="K8s Ready"
      glowColor="emerald"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Healthz Panel */}
          <div className="p-5 rounded-3xl liquid-glass-box border-emerald-400/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-emerald-300">GET /healthz</span>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/50">
                HTTP {healthStatus.code} {healthStatus.status}
              </span>
            </div>
            <p className="text-xs text-slate-200">
              Liveness Probe: Confirms HTTP process is running. Always returns 200 OK.
            </p>
            <div className="pt-2 font-mono text-[11px] text-emerald-300 font-bold">
              Body: "{healthStatus.text}"
            </div>
          </div>

          {/* Readyz Panel */}
          <div
            className={`p-5 rounded-3xl liquid-glass-box transition-all ${
              isReady
                ? "border-emerald-400/40"
                : "border-amber-400/40"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono font-bold text-xs text-slate-200">GET /readyz</span>
              <span
                className={`px-3 py-0.5 rounded-full text-[11px] font-extrabold border ${
                  isReady
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/50"
                    : "bg-amber-500/20 text-amber-300 border-amber-400/50"
                }`}
              >
                HTTP {readyStatus.code} {readyStatus.status}
              </span>
            </div>
            <p className="text-xs text-slate-200">
              Readiness Probe: Calls custom `readyCheck()` function (e.g. DB/cache connectivity).
            </p>
            <div
              className={`pt-2 font-mono text-[11px] font-bold ${
                isReady ? "text-emerald-300" : "text-amber-300"
              }`}
            >
              Body: "{readyStatus.text}"
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <LiquidMetalButton
            label={`Toggle readyCheck() (${isReady ? "READY" : "UNAVAILABLE"})`}
            width={300}
            onClick={toggleReadiness}
            icon={<RefreshCcw size={16} className="text-emerald-300" />}
          />
        </div>
      </div>
    </LiquidGlassPanel>
  );
};

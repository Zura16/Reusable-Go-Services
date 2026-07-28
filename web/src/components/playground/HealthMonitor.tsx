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
          <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-emerald-400">GET /healthz</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                HTTP {healthStatus.code} {healthStatus.status}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Liveness Probe: Confirms HTTP process is running. Always returns 200 OK.
            </p>
            <div className="pt-2 font-mono text-[11px] text-emerald-200">
              Body: "{healthStatus.text}"
            </div>
          </div>

          {/* Readyz Panel */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isReady
                ? "bg-emerald-950/30 border-emerald-500/30"
                : "bg-amber-950/30 border-amber-500/30"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono font-bold text-xs text-slate-200">GET /readyz</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  isReady
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}
              >
                HTTP {readyStatus.code} {readyStatus.status}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Readiness Probe: Calls custom `readyCheck()` function (e.g. DB/cache connectivity).
            </p>
            <div
              className={`pt-2 font-mono text-[11px] ${
                isReady ? "text-emerald-200" : "text-amber-200"
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

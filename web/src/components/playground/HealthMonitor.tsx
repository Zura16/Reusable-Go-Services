import React, { useState } from "react";
import { HeartPulse } from "lucide-react";
import { LiquidGlassPanel } from "@/components/ui/liquid-glass-panel";
import PillNav from "@/components/ui/PillNav";

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
    <LiquidGlassPanel
      title="Health & Readiness Probes"
      subtitle="K8s Probe Endpoints: /healthz (Always 200) & /readyz (Dynamic Check)"
      icon={<HeartPulse className="w-5 h-5 text-white" />}
      badge="K8s Ready"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Healthz Panel */}
          <div className="p-5 rounded-3xl liquid-glass-box border-white/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-white">GET /healthz</span>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-white/10 text-white border border-white/20">
                HTTP {healthStatus.code} {healthStatus.status}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Liveness Probe: Confirms HTTP process is running. Always returns 200 OK.
            </p>
            <div className="pt-2 font-mono text-[11px] text-white font-bold">
              Body: "{healthStatus.text}"
            </div>
          </div>

          {/* Readyz Panel */}
          <div className="p-5 rounded-3xl liquid-glass-box border-white/20 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono font-bold text-xs text-white">GET /readyz</span>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-white/10 text-white border border-white/20">
                HTTP {readyStatus.code} {readyStatus.status}
              </span>
            </div>
            <p className="text-xs text-slate-300">
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
    </LiquidGlassPanel>
  );
};

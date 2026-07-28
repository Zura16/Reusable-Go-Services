import React, { useState } from "react";
import { HeartPulse } from "lucide-react";
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
    <div
      style={{ backgroundColor: "#DCDCDC" }}
      className="relative rounded-3xl overflow-hidden text-slate-900 border border-slate-300 shadow-2xl transition-all duration-300 p-6 md:p-8"
    >
      {/* Panel Header */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-300">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-slate-200 border border-slate-400 text-slate-900">
            <HeartPulse className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Health & Readiness Probes
            </h3>
            <p className="text-xs text-slate-700 font-medium mt-0.5">
              K8s Probe Endpoints: /healthz (Always 200) & /readyz (Dynamic Check)
            </p>
          </div>
        </div>
        <span className="px-3.5 py-1 text-xs font-semibold rounded-full bg-slate-200 text-slate-900 border border-slate-400 tracking-wide uppercase">
          K8s Ready
        </span>
      </div>

      {/* Probes Body */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Healthz Panel */}
          <div className="p-5 rounded-3xl bg-slate-200 border border-slate-400 text-slate-900 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-slate-900">GET /healthz</span>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-300 text-slate-900 border border-slate-400">
                HTTP {healthStatus.code} {healthStatus.status}
              </span>
            </div>
            <p className="text-xs text-slate-700 font-medium">
              Liveness Probe: Confirms HTTP process is running. Always returns 200 OK.
            </p>
            <div className="pt-2 font-mono text-[11px] text-slate-900 font-bold">
              Body: "{healthStatus.text}"
            </div>
          </div>

          {/* Readyz Panel */}
          <div className="p-5 rounded-3xl bg-slate-200 border border-slate-400 text-slate-900 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono font-bold text-xs text-slate-900">GET /readyz</span>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-300 text-slate-900 border border-slate-400">
                HTTP {readyStatus.code} {readyStatus.status}
              </span>
            </div>
            <p className="text-xs text-slate-700 font-medium">
              Readiness Probe: Calls custom `readyCheck()` function (e.g. DB/cache connectivity).
            </p>
            <div className="pt-2 font-mono text-[11px] text-slate-900 font-bold">
              Body: "{readyStatus.text}"
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <PillNav
            items={[
              { label: `Toggle readyCheck() (${isReady ? "READY" : "UNAVAILABLE"})`, href: "#", onClick: toggleReadiness }
            ]}
            baseColor="#ffffff"
            pillColor="#000000"
            hoveredPillTextColor="#000000"
            pillTextColor="#ffffff"
          />
        </div>
      </div>
    </div>
  );
};

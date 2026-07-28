import React, { useState, useEffect } from "react";
import { Activity, BarChart2, Radio } from "lucide-react";
import { LiquidGlassPanel } from "@/components/ui/liquid-glass-panel";

export const MetricsDashboard: React.FC = () => {
  const [httpCount, setHttpCount] = useState(142);
  const [grpcCount, setGrpcCount] = useState(89);
  const [latencyMs, setLatencyMs] = useState(14.2);
  const [activeSpans, setActiveSpans] = useState(4);

  useEffect(() => {
    const interval = setInterval(() => {
      setHttpCount((c) => c + Math.floor(Math.random() * 4) + 1);
      if (Math.random() > 0.4) setGrpcCount((c) => c + Math.floor(Math.random() * 3) + 1);
      setLatencyMs((Math.random() * 10 + 8).toFixed(1) as any);
      setActiveSpans(Math.floor(Math.random() * 3) + 3);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <LiquidGlassPanel
      title="Prometheus Metrics & OpenTelemetry Spans"
      subtitle="Real-Time HTTP/gRPC Collector Metrics & OTLP Traces"
      icon={<Activity className="w-5 h-5" />}
      badge="Live Telemetry"
      glowColor="indigo"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 text-center">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
              http_requests_total
            </span>
            <span className="text-3xl font-extrabold text-indigo-400 font-mono">{httpCount}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 text-center">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
              grpc_requests_total
            </span>
            <span className="text-3xl font-extrabold text-cyan-400 font-mono">{grpcCount}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 text-center">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
              http_request_duration
            </span>
            <span className="text-3xl font-extrabold text-purple-400 font-mono">{latencyMs} ms</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 text-center">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
              OTel Active Spans
            </span>
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">{activeSpans}</span>
          </div>
        </div>

        {/* Histogram Buckets */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>HTTPRequestDuration Histogram Buckets (.005s to 10s)</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> Live Promhttp Stream
            </span>
          </div>

          <div className="space-y-2">
            {[
              { bucket: "le=0.01", count: Math.floor(httpCount * 0.45), pct: "45%" },
              { bucket: "le=0.05", count: Math.floor(httpCount * 0.78), pct: "78%" },
              { bucket: "le=0.25", count: Math.floor(httpCount * 0.95), pct: "95%" },
              { bucket: "le=1.00", count: httpCount, pct: "100%" },
            ].map((b) => (
              <div key={b.bucket} className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Bucket {b.bucket}</span>
                  <span>{b.count} reqs ({b.pct})</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: b.pct }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LiquidGlassPanel>
  );
};

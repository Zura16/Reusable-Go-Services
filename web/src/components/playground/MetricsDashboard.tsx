import React, { useState, useEffect } from "react";
import { Activity, Radio } from "lucide-react";
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
      icon={<Activity className="w-5 h-5 text-indigo-300" />}
      badge="Live Telemetry"
      glowColor="indigo"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl liquid-glass-box text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1">
              http_requests_total
            </span>
            <span className="text-3xl font-extrabold text-indigo-300 font-mono drop-shadow-md">{httpCount}</span>
          </div>

          <div className="p-4 rounded-2xl liquid-glass-box text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1">
              grpc_requests_total
            </span>
            <span className="text-3xl font-extrabold text-cyan-300 font-mono drop-shadow-md">{grpcCount}</span>
          </div>

          <div className="p-4 rounded-2xl liquid-glass-box text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1">
              http_request_duration
            </span>
            <span className="text-3xl font-extrabold text-purple-300 font-mono drop-shadow-md">{latencyMs} ms</span>
          </div>

          <div className="p-4 rounded-2xl liquid-glass-box text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1">
              OTel Active Spans
            </span>
            <span className="text-3xl font-extrabold text-emerald-300 font-mono drop-shadow-md">{activeSpans}</span>
          </div>
        </div>

        {/* Histogram Buckets Container */}
        <div className="p-6 rounded-3xl liquid-glass-box space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span>HTTPRequestDuration Histogram Buckets (.005s to 10s)</span>
            <span className="text-emerald-300 flex items-center gap-1.5 font-bold">
              <Radio className="w-4 h-4 animate-pulse text-emerald-400" /> Live Promhttp Stream
            </span>
          </div>

          <div className="space-y-3">
            {[
              { bucket: "le=0.01", count: Math.floor(httpCount * 0.45), pct: "45%" },
              { bucket: "le=0.05", count: Math.floor(httpCount * 0.78), pct: "78%" },
              { bucket: "le=0.25", count: Math.floor(httpCount * 0.95), pct: "95%" },
              { bucket: "le=1.00", count: httpCount, pct: "100%" },
            ].map((b) => (
              <div key={b.bucket} className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-300 font-mono font-medium">
                  <span>Bucket {b.bucket}</span>
                  <span>{b.count} reqs ({b.pct})</span>
                </div>
                <div className="w-full h-2.5 rounded-full liquid-glass-box overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 transition-all duration-500 shadow-sm"
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

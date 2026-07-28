import React, { useState, useEffect } from "react";
import { Activity, Radio } from "lucide-react";
import BorderGlow from "@/components/ui/BorderGlow";

const FOREST_IMG = "https://images.unsplash.com/photo-1511884642898-4c92249e20b6?q=80&w=2400&auto=format&fit=crop";

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
    <BorderGlow
      edgeSensitivity={35}
      glowColor="220 80 80"
      borderRadius={24}
      glowRadius={40}
      glowIntensity={1.2}
      colors={['#ffffff', '#cbd5e1', '#94a3b8']}
    >
      <div
        style={{
          backgroundImage: `url(${FOREST_IMG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="relative rounded-3xl overflow-hidden text-white transition-all duration-300 p-6 md:p-8"
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/65 backdrop-blur-sm z-0" />

        {/* Content */}
        <div className="relative z-10 space-y-6 w-full max-w-full overflow-hidden">
          {/* Panel Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-white/10 border border-white/20 text-white">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  Prometheus Metrics & OpenTelemetry Spans
                </h3>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Real-Time HTTP/gRPC Collector Metrics & OTLP Traces
                </p>
              </div>
            </div>
            <span className="px-3.5 py-1 text-xs font-semibold rounded-full bg-white/10 text-white border border-white/20 tracking-wide uppercase">
              Live Telemetry
            </span>
          </div>

          {/* Metrics Body */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            <div className="p-4 rounded-2xl bg-black/50 border border-white/20 text-center overflow-hidden">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1 truncate">
                http_requests_total
              </span>
              <span className="text-2xl md:text-3xl font-extrabold text-white font-mono block truncate">{httpCount}</span>
            </div>

            <div className="p-4 rounded-2xl bg-black/50 border border-white/20 text-center overflow-hidden">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1 truncate">
                grpc_requests_total
              </span>
              <span className="text-2xl md:text-3xl font-extrabold text-white font-mono block truncate">{grpcCount}</span>
            </div>

            <div className="p-4 rounded-2xl bg-black/50 border border-white/20 text-center overflow-hidden">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1 truncate">
                http_request_duration
              </span>
              <span className="text-2xl md:text-3xl font-extrabold text-white font-mono block truncate">{latencyMs} ms</span>
            </div>

            <div className="p-4 rounded-2xl bg-black/50 border border-white/20 text-center overflow-hidden">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1 truncate">
                OTel Active Spans
              </span>
              <span className="text-2xl md:text-3xl font-extrabold text-white font-mono block truncate">{activeSpans}</span>
            </div>
          </div>

          {/* Histogram Buckets Container */}
          <div className="p-6 rounded-3xl bg-black/50 border border-white/20 space-y-4 w-full overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-white">
              <span className="truncate">HTTPRequestDuration Histogram Buckets (.005s to 10s)</span>
              <span className="text-white flex items-center gap-1.5 font-bold shrink-0">
                <Radio className="w-4 h-4 text-white animate-pulse" /> Live Promhttp Stream
              </span>
            </div>

            <div className="space-y-3 w-full">
              {[
                { bucket: "le=0.01", count: Math.floor(httpCount * 0.45), pct: "45%" },
                { bucket: "le=0.05", count: Math.floor(httpCount * 0.78), pct: "78%" },
                { bucket: "le=0.25", count: Math.floor(httpCount * 0.95), pct: "95%" },
                { bucket: "le=1.00", count: httpCount, pct: "100%" },
              ].map((b) => (
                <div key={b.bucket} className="space-y-1 w-full">
                  <div className="flex justify-between text-[11px] text-white font-mono font-semibold">
                    <span>Bucket {b.bucket}</span>
                    <span>{b.count} reqs ({b.pct})</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-500"
                      style={{ width: b.pct }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BorderGlow>
  );
};

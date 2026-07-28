import React, { useState } from "react";
import { RefreshCw, ShieldAlert, Check } from "lucide-react";
import PillNav from "@/components/ui/PillNav";
import BorderGlow from "@/components/ui/BorderGlow";
import matrixBg from "@/assets/matrix-bg.png";

export const RetrySimulator: React.FC = () => {
  const [maxRetries, setMaxRetries] = useState(3);
  const [baseDelayMs, setBaseDelayMs] = useState(100);
  const [jitterPercent, setJitterPercent] = useState(20);
  const [httpMethod, setHttpMethod] = useState<"GET" | "POST">("GET");
  const [retryUnsafe, setRetryUnsafe] = useState(false);
  const [simulate429, setSimulate429] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [retryLogs, setRetryLogs] = useState<
    { attempt: number; delayMs: number; status: string; isRetryable: boolean }[]
  >([]);

  const runSimulation = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsRunning(true);
    setRetryLogs([]);
    const logs: { attempt: number; delayMs: number; status: string; isRetryable: boolean }[] = [];

    const isIdempotent = ["GET", "HEAD", "PUT", "DELETE", "OPTIONS"].includes(httpMethod);
    const allowRetry = isIdempotent || retryUnsafe;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      let delayMs = 0;
      let status = "503 Service Unavailable";
      let isRetryable = allowRetry && attempt < maxRetries;

      if (simulate429 && attempt === 0) {
        status = "429 Too Many Requests (Retry-After: 1s)";
        delayMs = 1000;
      } else if (attempt > 0) {
        const exponential = baseDelayMs * Math.pow(2, attempt - 1);
        const jitterRange = exponential * (jitterPercent / 100);
        const randomJitter = (Math.random() * 2 - 1) * jitterRange;
        delayMs = Math.round(exponential + randomJitter);
      }

      if (attempt === (simulate429 ? 1 : 2)) {
        status = "200 OK (Success)";
        isRetryable = false;
      }

      logs.push({ attempt, delayMs, status, isRetryable });
      setRetryLogs([...logs]);

      if (status.startsWith("200")) break;
      if (!allowRetry) break;

      if (delayMs > 0) {
        await new Promise((res) => setTimeout(res, Math.min(delayMs, 400)));
      }
    }

    setIsRunning(false);
  };

  return (
    <BorderGlow
      edgeSensitivity={35}
      glowColor="140 100 50"
      borderRadius={24}
      glowRadius={40}
      glowIntensity={1.4}
      colors={['#22c55e', '#10b981', '#34d399']}
    >
      <div
        style={{
          backgroundImage: `url(${matrixBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="relative rounded-3xl overflow-hidden text-white transition-all duration-300 p-6 md:p-8"
      >
        {/* Dark High-Contrast Translucent Backdrop Overlay */}
        <div className="absolute inset-0 bg-black/82 backdrop-blur-md z-0" />

        {/* Content */}
        <div className="relative z-10 space-y-6">
          {/* Panel Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-emerald-500/25">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-black/70 border border-emerald-500/30 text-emerald-400">
                <RefreshCw className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  HTTP Client Retry & Jitter Simulator
                </h3>
                <p className="text-xs text-emerald-400 font-mono font-medium mt-0.5">
                  Exponential Backoff, Idempotency Guard, and 429 Retry-After Engine
                </p>
              </div>
            </div>
            <span className="px-3.5 py-1 text-xs font-mono font-bold rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 tracking-wide uppercase">
              Resilience Core
            </span>
          </div>

          {/* Body */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-black/75 border border-emerald-500/30">
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Max Retries ({maxRetries})
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={maxRetries}
                onChange={(e) => setMaxRetries(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-2xl bg-black/75 border border-emerald-500/30">
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Base Delay: {baseDelayMs} ms
              </label>
              <input
                type="range"
                min="50"
                max="500"
                step="50"
                value={baseDelayMs}
                onChange={(e) => setBaseDelayMs(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-2xl bg-black/75 border border-emerald-500/30">
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Random Jitter: ±{jitterPercent}%
              </label>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={jitterPercent}
                onChange={(e) => setJitterPercent(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                HTTP Method Safety
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setHttpMethod("GET")}
                  className={`flex-1 py-3 px-3 rounded-2xl text-xs font-bold uppercase tracking-wider border transition ${
                    httpMethod === "GET"
                      ? "bg-emerald-500 text-black border-emerald-400 font-extrabold shadow-lg shadow-emerald-500/20"
                      : "bg-black/70 text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/40"
                  }`}
                >
                  GET (Idempotent)
                </button>
                <button
                  type="button"
                  onClick={() => setHttpMethod("POST")}
                  className={`flex-1 py-3 px-3 rounded-2xl text-xs font-bold uppercase tracking-wider border transition ${
                    httpMethod === "POST"
                      ? "bg-emerald-500 text-black border-emerald-400 font-extrabold shadow-lg shadow-emerald-500/20"
                      : "bg-black/70 text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/40"
                  }`}
                >
                  POST (Unsafe)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Policy Toggles
              </label>
              <div className="space-y-2">
                {httpMethod === "POST" && (
                  <label className="flex items-center gap-3 p-3 rounded-2xl bg-black/75 border border-emerald-500/30 text-xs text-white font-semibold cursor-pointer hover:bg-emerald-950/40 transition">
                    <input
                      type="checkbox"
                      checked={retryUnsafe}
                      onChange={(e) => setRetryUnsafe(e.target.checked)}
                      className="rounded text-emerald-400 focus:ring-emerald-400"
                    />
                    Enable RetryUnsafe=true (force retry POST)
                  </label>
                )}
                <label className="flex items-center gap-3 p-3 rounded-2xl bg-black/75 border border-emerald-500/30 text-xs text-white font-semibold cursor-pointer hover:bg-emerald-950/40 transition">
                  <input
                    type="checkbox"
                    checked={simulate429}
                    onChange={(e) => setSimulate429(e.target.checked)}
                    className="rounded text-emerald-400 focus:ring-emerald-400"
                  />
                  Simulate 429 Too Many Requests (Retry-After Header)
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <PillNav
              items={[
                { label: isRunning ? "Retrying..." : "Execute Request with Retrier", href: "#", onClick: runSimulation }
              ]}
              baseColor="#000000"
              pillColor="#ffffff"
              hoveredPillTextColor="#ffffff"
              pillTextColor="#000000"
            />
          </div>

          {retryLogs.length > 0 && (
            <div className="space-y-2 font-mono text-xs animate-fadeIn">
              <p className="text-emerald-400 font-bold">// Execution Timeline:</p>
              {retryLogs.map((log) => (
                <div
                  key={log.attempt}
                  className="p-3.5 rounded-2xl bg-black/85 border border-emerald-500/35 text-white flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center font-bold text-[11px] text-emerald-300">
                      #{log.attempt}
                    </span>
                    <span className="font-bold">{log.status}</span>
                  </div>
                  <div className="flex items-center gap-3 text-white font-semibold">
                    {log.delayMs > 0 && <span className="text-emerald-300">Backoff Delay: +{log.delayMs}ms</span>}
                    {log.isRetryable ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold">
                        Retrying...
                      </span>
                    ) : log.status.startsWith("200") ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" /> Resolved
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-amber-400" /> Aborted (Unsafe/Limit)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BorderGlow>
  );
};

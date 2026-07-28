import React, { useState } from "react";
import { RefreshCw, ShieldAlert, Check } from "lucide-react";
import PillNav from "@/components/ui/PillNav";

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
    <div className="relative rounded-3xl overflow-hidden bg-white text-slate-900 border border-slate-200 shadow-2xl transition-all duration-300 p-6 md:p-8">
      {/* Panel Header */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-slate-100 border border-slate-300 text-slate-900">
            <RefreshCw className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              HTTP Client Retry & Jitter Simulator
            </h3>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Exponential Backoff, Idempotency Guard, and 429 Retry-After Engine
            </p>
          </div>
        </div>
        <span className="px-3.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 border border-slate-300 tracking-wide uppercase">
          Resilience Core
        </span>
      </div>

      {/* Body */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Max Retries ({maxRetries})
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={maxRetries}
              onChange={(e) => setMaxRetries(Number(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Base Delay: {baseDelayMs} ms
            </label>
            <input
              type="range"
              min="50"
              max="500"
              step="50"
              value={baseDelayMs}
              onChange={(e) => setBaseDelayMs(Number(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Random Jitter: ±{jitterPercent}%
            </label>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={jitterPercent}
              onChange={(e) => setJitterPercent(Number(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              HTTP Method Safety
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setHttpMethod("GET")}
                className={`flex-1 py-3 px-3 rounded-2xl text-xs font-bold uppercase tracking-wider border border-slate-300 transition ${
                  httpMethod === "GET"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                }`}
              >
                GET (Idempotent)
              </button>
              <button
                type="button"
                onClick={() => setHttpMethod("POST")}
                className={`flex-1 py-3 px-3 rounded-2xl text-xs font-bold uppercase tracking-wider border border-slate-300 transition ${
                  httpMethod === "POST"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                }`}
              >
                POST (Unsafe)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Policy Toggles
            </label>
            <div className="space-y-2">
              {httpMethod === "POST" && (
                <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-100 border border-slate-300 text-xs text-slate-900 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={retryUnsafe}
                    onChange={(e) => setRetryUnsafe(e.target.checked)}
                    className="rounded text-slate-900 focus:ring-slate-900"
                  />
                  Enable RetryUnsafe=true (force retry POST)
                </label>
              )}
              <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-100 border border-slate-300 text-xs text-slate-900 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulate429}
                  onChange={(e) => setSimulate429(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900"
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
            <p className="text-slate-600 font-bold">// Execution Timeline:</p>
            {retryLogs.map((log) => (
              <div
                key={log.attempt}
                className="p-3.5 rounded-2xl bg-slate-100 border border-slate-300 text-slate-900 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-[11px] text-slate-900">
                    #{log.attempt}
                  </span>
                  <span className="font-bold">{log.status}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-900 font-semibold">
                  {log.delayMs > 0 && <span>Backoff Delay: +{log.delayMs}ms</span>}
                  {log.isRetryable ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-900 border border-slate-300 font-bold">
                      Retrying...
                    </span>
                  ) : log.status.startsWith("200") ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-900 border border-slate-300 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Resolved
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-900 border border-slate-300 font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Aborted (Unsafe/Limit)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

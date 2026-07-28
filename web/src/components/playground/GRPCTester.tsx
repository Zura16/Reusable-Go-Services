import React, { useState } from "react";
import { Server, UserCheck, AlertCircle, Clock, Zap } from "lucide-react";
import { LiquidGlassPanel } from "@/components/ui/liquid-glass-panel";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";

export const GRPCTester: React.FC = () => {
  const [userId, setUserId] = useState("user1");
  const [simulatedToken, setSimulatedToken] = useState("valid-token");
  const [simulateTimeout, setSimulateTimeout] = useState(false);
  const [lastResult, setLastResult] = useState<{
    code: string;
    codeNum: number;
    profile?: { user_id: string; display_name: string; email: string };
    error?: string;
    latencyMs: number;
  } | null>(null);

  const handleGetProfile = () => {
    const start = performance.now();

    if (simulatedToken !== "valid-token") {
      setLastResult({
        code: "Unauthenticated",
        codeNum: 16,
        error: "gRPC interceptor error: invalid or missing authorization token",
        latencyMs: Math.round(performance.now() - start),
      });
      return;
    }

    if (simulateTimeout) {
      setTimeout(() => {
        setLastResult({
          code: "DeadlineExceeded",
          codeNum: 4,
          error: "context deadline exceeded prior to RPC handler execution",
          latencyMs: 150,
        });
      }, 150);
      return;
    }

    if (!userId.trim()) {
      setLastResult({
        code: "InvalidArgument",
        codeNum: 3,
        error: "user_id cannot be empty",
        latencyMs: Math.round(performance.now() - start),
      });
      return;
    }

    const profiles: Record<string, { user_id: string; display_name: string; email: string }> = {
      user1: { user_id: "user1", display_name: "Alice Vance", email: "alice@example.com" },
      user2: { user_id: "user2", display_name: "Bob Builder", email: "bob@example.com" },
      admin: { user_id: "admin", display_name: "Root Administrator", email: "admin@servicekit.dev" },
    };

    const found = profiles[userId.trim()];
    if (!found) {
      setLastResult({
        code: "NotFound",
        codeNum: 5,
        error: `profile with user_id '${userId}' not found in database`,
        latencyMs: Math.round(performance.now() - start + 4),
      });
      return;
    }

    setLastResult({
      code: "OK",
      codeNum: 0,
      profile: found,
      latencyMs: Math.round(performance.now() - start + 2),
    });
  };

  return (
    <LiquidGlassPanel
      title="gRPC ProfileService Inspector"
      subtitle="Bufconn In-Process RPC Calls & Status Code Mapping"
      icon={<Server className="w-5 h-5 text-white" />}
      badge="Protobuf v1"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              RPC Request: GetProfile(User_ID)
            </label>
            <div className="relative">
              <UserCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user_id (e.g. user1, user2)"
                className="w-full pl-10 pr-4 py-3 rounded-2xl liquid-glass-box text-white text-sm focus:outline-none focus:border-white transition font-mono"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                onClick={() => setUserId("user1")}
                className="text-[11px] px-3 py-1.5 rounded-xl liquid-glass-btn text-white font-semibold"
              >
                user1
              </button>
              <button
                type="button"
                onClick={() => setUserId("user2")}
                className="text-[11px] px-3 py-1.5 rounded-xl liquid-glass-btn text-white font-semibold"
              >
                user2
              </button>
              <button
                type="button"
                onClick={() => setUserId("unknown_999")}
                className="text-[11px] px-3 py-1.5 rounded-xl liquid-glass-btn text-white font-semibold"
              >
                unknown_id
              </button>
              <button
                type="button"
                onClick={() => setUserId("")}
                className="text-[11px] px-3 py-1.5 rounded-xl liquid-glass-btn text-white font-semibold"
              >
                empty
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Interceptor Context Flags
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-2xl liquid-glass-box cursor-pointer hover:border-white/40 transition">
                <input
                  type="checkbox"
                  checked={simulatedToken === "valid-token"}
                  onChange={(e) => setSimulatedToken(e.target.checked ? "valid-token" : "invalid")}
                  className="rounded text-white focus:ring-white"
                />
                <span className="text-xs text-white font-medium">Include Valid gRPC Authorization Metadata</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-2xl liquid-glass-box cursor-pointer hover:border-white/40 transition">
                <input
                  type="checkbox"
                  checked={simulateTimeout}
                  onChange={(e) => setSimulateTimeout(e.target.checked)}
                  className="rounded text-white focus:ring-white"
                />
                <span className="text-xs text-white font-medium">Simulate Context Timeout (1µs Deadline)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <LiquidMetalButton
            label="Invoke RPC ProfileService.GetProfile()"
            width={280}
            onClick={handleGetProfile}
            icon={<Zap size={16} className="text-white" />}
          />
        </div>

        {lastResult && (
          <div className="p-5 rounded-3xl liquid-glass-box border border-white/20 text-white font-mono text-xs space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold border border-white/20 text-white bg-white/10">
                  codes.{lastResult.code} ({lastResult.codeNum})
                </span>
              </div>
              <span className="text-white flex items-center gap-1 text-[11px] font-semibold">
                <Clock className="w-3.5 h-3.5 text-white" /> {lastResult.latencyMs} ms
              </span>
            </div>

            {lastResult.profile ? (
              <div className="p-4 rounded-2xl liquid-glass-box space-y-1 text-white">
                <p className="text-white font-bold">// gRPC GetProfileResponse protobuf message:</p>
                <p><span className="text-slate-400">user_id:</span> "{lastResult.profile.user_id}"</p>
                <p><span className="text-slate-400">display_name:</span> "{lastResult.profile.display_name}"</p>
                <p><span className="text-slate-400">email:</span> "{lastResult.profile.email}"</p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl liquid-glass-box border-white/20 text-white flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <p><strong>gRPC Error:</strong> {lastResult.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </LiquidGlassPanel>
  );
};

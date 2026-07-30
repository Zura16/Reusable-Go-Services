import React, { useState } from "react";
import { Server, UserCheck, AlertCircle, Clock } from "lucide-react";
import PillNav from "@/components/ui/PillNav";
import BorderGlow from "@/components/ui/BorderGlow";
import matrixBg from "@/assets/matrix-bg.jpg";

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

  const handleGetProfile = (e: React.MouseEvent) => {
    e.preventDefault();
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
    <BorderGlow
      edgeSensitivity={35}
      glowColor="255 255 255"
      borderRadius={24}
      glowRadius={40}
      glowIntensity={1.5}
      colors={['#ffffff', '#e2e8f0', '#cbd5e1']}
    >
      <div
        style={{
          backgroundImage: `url(${matrixBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        className="relative rounded-3xl overflow-hidden text-white transition-all duration-300 p-6 md:p-8"
      >
        {/* Darker translucent overlay for maximum text readability */}
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-0" />

        {/* Content */}
        <div className="relative z-10 space-y-6">
          {/* Panel Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-black/70 border border-white/30 text-white">
                <Server className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white tracking-tight drop-shadow-md">
                  gRPC ProfileService Inspector
                </h3>
                <p className="text-xs text-white/90 font-mono font-semibold mt-0.5 drop-shadow">
                  Bufconn In-Process RPC Calls & Status Code Mapping
                </p>
              </div>
            </div>
            <span className="px-3.5 py-1 text-xs font-mono font-bold rounded-full bg-black/80 text-white border border-white/50 tracking-wide uppercase drop-shadow">
              Protobuf v1
            </span>
          </div>

          {/* Body */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2 drop-shadow">
                RPC Request: GetProfile(User_ID)
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-white" />
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter user_id (e.g. user1, user2)"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-black/80 border border-white/30 text-white text-sm focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition font-mono font-semibold shadow-inner"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setUserId("user1")}
                  className="text-[11px] px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 border border-white/30 text-white font-bold font-mono transition"
                >
                  user1
                </button>
                <button
                  type="button"
                  onClick={() => setUserId("user2")}
                  className="text-[11px] px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 border border-white/30 text-white font-bold font-mono transition"
                >
                  user2
                </button>
                <button
                  type="button"
                  onClick={() => setUserId("unknown_999")}
                  className="text-[11px] px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 border border-white/30 text-white font-bold font-mono transition"
                >
                  unknown_id
                </button>
                <button
                  type="button"
                  onClick={() => setUserId("")}
                  className="text-[11px] px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 border border-white/30 text-white font-bold font-mono transition"
                >
                  empty
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2 drop-shadow">
                Interceptor Context Flags
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-2xl bg-black/70 border border-white/20 cursor-pointer hover:bg-black/90 transition">
                  <input
                    type="checkbox"
                    checked={simulatedToken === "valid-token"}
                    onChange={(e) => setSimulatedToken(e.target.checked ? "valid-token" : "invalid")}
                    className="rounded accent-white text-white focus:ring-white"
                  />
                  <span className="text-xs text-white font-semibold">Include Valid gRPC Authorization Metadata</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-2xl bg-black/70 border border-white/20 cursor-pointer hover:bg-black/90 transition">
                  <input
                    type="checkbox"
                    checked={simulateTimeout}
                    onChange={(e) => setSimulateTimeout(e.target.checked)}
                    className="rounded accent-white text-white focus:ring-white"
                  />
                  <span className="text-xs text-white font-semibold">Simulate Context Timeout (1µs Deadline)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <PillNav
              items={[
                { label: "Invoke RPC ProfileService.GetProfile()", href: "#", onClick: handleGetProfile }
              ]}
              baseColor="#000000"
              pillColor="#ffffff"
              hoveredPillTextColor="#ffffff"
              pillTextColor="#000000"
            />
          </div>

          {lastResult && (
            <div className="p-5 rounded-3xl bg-black/85 border border-white/30 text-white font-mono text-xs space-y-3 animate-fadeIn shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold border border-white/40 text-white bg-black/90">
                    codes.{lastResult.code} ({lastResult.codeNum})
                  </span>
                </div>
                <span className="text-white flex items-center gap-1 text-[11px] font-bold">
                  <Clock className="w-3.5 h-3.5 text-white" /> {lastResult.latencyMs} ms
                </span>
              </div>

              {lastResult.profile ? (
                <div className="p-4 rounded-2xl bg-black/80 border border-white/20 space-y-1 text-white font-semibold">
                  <p className="text-white font-bold">// gRPC GetProfileResponse protobuf message:</p>
                  <p><span className="text-white/90 font-bold">user_id:</span> "{lastResult.profile.user_id}"</p>
                  <p><span className="text-white/90 font-bold">display_name:</span> "{lastResult.profile.display_name}"</p>
                  <p><span className="text-white/90 font-bold">email:</span> "{lastResult.profile.email}"</p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-black/80 border border-white/20 text-white flex items-start gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p><strong>gRPC Error:</strong> {lastResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </BorderGlow>
  );
};

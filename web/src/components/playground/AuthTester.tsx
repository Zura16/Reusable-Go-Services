import React, { useState } from "react";
import { Key, Lock, CheckCircle2, AlertTriangle } from "lucide-react";
import PillNav from "@/components/ui/PillNav";
import BorderGlow from "@/components/ui/BorderGlow";
import matrixBg from "@/assets/matrix-bg.png";

export const AuthTester: React.FC = () => {
  const [token, setToken] = useState("secret-auth-token");
  const [roleRequirement, setRoleRequirement] = useState<"none" | "user" | "admin">("user");
  const [lastResult, setLastResult] = useState<{
    status: number;
    statusText: string;
    subject?: string;
    roles?: string[];
    error?: string;
    redactedHeader: string;
  } | null>(null);

  const handleTestAuth = (e: React.MouseEvent) => {
    e.preventDefault();
    const validTokens: Record<string, { subject: string; roles: string[] }> = {
      "secret-auth-token": { subject: "alice@example.com", roles: ["user", "admin"] },
      "dev-bearer-token": { subject: "bob@dev.local", roles: ["user"] },
    };

    const redactedHeader = token ? `Bearer ${token.substring(0, 3)}***REDACTED***` : "Missing";

    if (!token) {
      setLastResult({
        status: 401,
        statusText: "Unauthorized",
        error: "Missing authorization header",
        redactedHeader,
      });
      return;
    }

    const identity = validTokens[token];
    if (!identity) {
      setLastResult({
        status: 401,
        statusText: "Unauthorized",
        error: "Invalid bearer token",
        redactedHeader,
      });
      return;
    }

    if (roleRequirement !== "none" && !identity.roles.includes(roleRequirement)) {
      setLastResult({
        status: 403,
        statusText: "Forbidden",
        subject: identity.subject,
        roles: identity.roles,
        error: `Required role '${roleRequirement}' is missing`,
        redactedHeader,
      });
      return;
    }

    setLastResult({
      status: 200,
      statusText: "OK",
      subject: identity.subject,
      roles: identity.roles,
      redactedHeader,
    });
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
                <Lock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  Auth & Authorization Validator
                </h3>
                <p className="text-xs text-emerald-400 font-mono font-medium mt-0.5">
                  Test Constant-Time Bearer Token Validation & Role Enforcement
                </p>
              </div>
            </div>
            <span className="px-3.5 py-1 text-xs font-mono font-bold rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 tracking-wide uppercase">
              Crypto Safe
            </span>
          </div>

          {/* Body */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Bearer Token
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-emerald-400" />
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="e.g. secret-auth-token"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-black/75 border border-emerald-500/35 text-white text-sm focus:outline-none focus:border-emerald-400 transition-all font-mono font-semibold"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setToken("secret-auth-token")}
                  className="text-[11px] px-3 py-1.5 rounded-xl bg-black/70 hover:bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold font-mono transition"
                >
                  Preset: Admin Token
                </button>
                <button
                  type="button"
                  onClick={() => setToken("dev-bearer-token")}
                  className="text-[11px] px-3 py-1.5 rounded-xl bg-black/70 hover:bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold font-mono transition"
                >
                  Preset: User Token
                </button>
                <button
                  type="button"
                  onClick={() => setToken("invalid-token-123")}
                  className="text-[11px] px-3 py-1.5 rounded-xl bg-black/70 hover:bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold font-mono transition"
                >
                  Preset: Invalid Token
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Required Role Filter
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["none", "user", "admin"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoleRequirement(r)}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold uppercase tracking-wider border transition ${
                      roleRequirement === r
                        ? "bg-emerald-500 text-black border-emerald-400 font-extrabold shadow-lg shadow-emerald-500/20"
                        : "bg-black/70 text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/40"
                    }`}
                  >
                    {r === "none" ? "None" : r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <PillNav
              items={[
                { label: "Test Request Authentication & Role", href: "#", onClick: handleTestAuth }
              ]}
              baseColor="#000000"
              pillColor="#ffffff"
              hoveredPillTextColor="#ffffff"
              pillTextColor="#000000"
            />
          </div>

          {lastResult && (
            <div className="p-5 rounded-3xl bg-black/85 border border-emerald-500/35 text-white transition-all animate-fadeIn shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {lastResult.status === 200 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                  <span className="font-bold text-sm text-white">
                    HTTP {lastResult.status} — {lastResult.statusText}
                  </span>
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-bold">
                  Log Header: {lastResult.redactedHeader}
                </span>
              </div>

              {lastResult.subject && (
                <div className="text-xs space-y-1 font-mono mt-2 pt-2 border-t border-emerald-500/20 text-white">
                  <p><span className="text-emerald-400 font-bold">Authenticated Identity:</span> {lastResult.subject}</p>
                  <p><span className="text-emerald-400 font-bold">Granted Roles:</span> {lastResult.roles?.join(", ")}</p>
                </div>
              )}

              {lastResult.error && (
                <p className="text-xs text-amber-300 font-mono mt-2 font-bold">
                  <strong>Error:</strong> {lastResult.error}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </BorderGlow>
  );
};

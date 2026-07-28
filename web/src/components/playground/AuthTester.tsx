import React, { useState } from "react";
import { Key, ShieldCheck, ShieldAlert, Lock, CheckCircle2, AlertTriangle } from "lucide-react";
import { LiquidGlassPanel } from "@/components/ui/liquid-glass-panel";

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

  const handleTestAuth = () => {
    // Simulate ServiceKit Auth Middleware & StaticValidator execution
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
    <LiquidGlassPanel
      title="Auth & Authorization Validator"
      subtitle="Test Constant-Time Bearer Token Validation & Role Enforcement"
      icon={<Lock className="w-5 h-5" />}
      badge="Crypto/Subtle Safe"
      glowColor="purple"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
              Bearer Token
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="e.g. secret-auth-token"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/15 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-mono"
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setToken("secret-auth-token")}
                className="text-[11px] px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
              >
                Preset: Admin Token
              </button>
              <button
                onClick={() => setToken("dev-bearer-token")}
                className="text-[11px] px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
              >
                Preset: User Token
              </button>
              <button
                onClick={() => setToken("invalid-token-123")}
                className="text-[11px] px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[11px] text-red-400 border border-red-500/20 transition"
              >
                Preset: Invalid Token
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
              Required Role Filter
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["none", "user", "admin"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleRequirement(r)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all ${
                    roleRequirement === r
                      ? "bg-purple-500/30 border-purple-400/50 text-purple-200 shadow-lg shadow-purple-500/20"
                      : "bg-slate-900/40 border-white/10 text-slate-400 hover:bg-white/5"
                  }`}
                >
                  {r === "none" ? "None" : r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleTestAuth}
          className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4" />
          Test Request Authentication & Role
        </button>

        {lastResult && (
          <div
            className={`p-5 rounded-2xl border transition-all animate-fadeIn ${
              lastResult.status === 200
                ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
                : lastResult.status === 403
                ? "bg-amber-950/40 border-amber-500/30 text-amber-200"
                : "bg-red-950/40 border-red-500/30 text-red-200"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {lastResult.status === 200 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                )}
                <span className="font-bold text-sm">
                  HTTP {lastResult.status} — {lastResult.statusText}
                </span>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-black/40 border border-white/10">
                Log Header: {lastResult.redactedHeader}
              </span>
            </div>

            {lastResult.subject && (
              <div className="text-xs space-y-1 font-mono mt-2 pt-2 border-t border-white/10">
                <p><span className="text-slate-400">Authenticated Identity:</span> {lastResult.subject}</p>
                <p><span className="text-slate-400">Granted Roles:</span> {lastResult.roles?.join(", ")}</p>
              </div>
            )}

            {lastResult.error && (
              <p className="text-xs text-red-300 font-mono mt-2">
                <strong>Error:</strong> {lastResult.error}
              </p>
            )}
          </div>
        )}
      </div>
    </LiquidGlassPanel>
  );
};

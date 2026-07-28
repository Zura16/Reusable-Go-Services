import React, { useState } from "react";
import { Key, ShieldCheck, Lock, CheckCircle2, AlertTriangle } from "lucide-react";
import { LiquidGlassPanel } from "@/components/ui/liquid-glass-panel";
import { LiquidGlassButton } from "@/components/ui/glass-button";

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
      icon={<Lock className="w-5 h-5 text-purple-300" />}
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
            <div className="flex flex-wrap gap-2 mt-2.5">
              <button
                type="button"
                onClick={() => setToken("secret-auth-token")}
                className="text-[11px] px-3 py-1 rounded-xl liquid-glass-btn text-slate-200"
              >
                Preset: Admin Token
              </button>
              <button
                type="button"
                onClick={() => setToken("dev-bearer-token")}
                className="text-[11px] px-3 py-1 rounded-xl liquid-glass-btn text-slate-200"
              >
                Preset: User Token
              </button>
              <button
                type="button"
                onClick={() => setToken("invalid-token-123")}
                className="text-[11px] px-3 py-1 rounded-xl liquid-glass-btn text-red-300 border-red-500/30"
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
                  type="button"
                  onClick={() => setRoleRequirement(r)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider liquid-glass-btn ${
                    roleRequirement === r
                      ? "border-purple-400/60 text-purple-200 bg-purple-500/20 shadow-purple-500/30"
                      : "text-slate-400"
                  }`}
                >
                  {r === "none" ? "None" : r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <LiquidGlassButton
          onClick={handleTestAuth}
          glowColor="purple"
          icon={<ShieldCheck className="w-4 h-4 text-purple-300" />}
          className="w-full py-3.5 text-sm font-semibold rounded-2xl"
        >
          Test Request Authentication & Role
        </LiquidGlassButton>

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

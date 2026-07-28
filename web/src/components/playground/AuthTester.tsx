import React, { useState } from "react";
import { Key, Lock, CheckCircle2, AlertTriangle } from "lucide-react";
import PillNav from "@/components/ui/PillNav";

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
    <div
      style={{ backgroundColor: "#F5F4F6" }}
      className="relative rounded-3xl overflow-hidden text-slate-900 border border-slate-200/80 shadow-2xl transition-all duration-300 p-6 md:p-8"
    >
      {/* Panel Header */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-300/80">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-white border border-slate-300 text-slate-900">
            <Lock className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Auth & Authorization Validator
            </h3>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Test Constant-Time Bearer Token Validation & Role Enforcement
            </p>
          </div>
        </div>
        <span className="px-3.5 py-1 text-xs font-semibold rounded-full bg-white text-slate-800 border border-slate-300 tracking-wide uppercase">
          Crypto Safe
        </span>
      </div>

      {/* Body */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Bearer Token
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="e.g. secret-auth-token"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-slate-600 transition-all font-mono font-semibold"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                onClick={() => setToken("secret-auth-token")}
                className="text-[11px] px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-900 font-bold"
              >
                Preset: Admin Token
              </button>
              <button
                type="button"
                onClick={() => setToken("dev-bearer-token")}
                className="text-[11px] px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-900 font-bold"
              >
                Preset: User Token
              </button>
              <button
                type="button"
                onClick={() => setToken("invalid-token-123")}
                className="text-[11px] px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-900 font-bold"
              >
                Preset: Invalid Token
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Required Role Filter
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["none", "user", "admin"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleRequirement(r)}
                  className={`py-3 px-3 rounded-2xl text-xs font-bold uppercase tracking-wider border border-slate-300 transition ${
                    roleRequirement === r
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-900 hover:bg-slate-100"
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
          <div className="p-5 rounded-3xl bg-white border border-slate-300 text-slate-900 transition-all animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {lastResult.status === 200 ? (
                  <CheckCircle2 className="w-5 h-5 text-slate-900" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-slate-900" />
                )}
                <span className="font-bold text-sm text-slate-900">
                  HTTP {lastResult.status} — {lastResult.statusText}
                </span>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-100 text-slate-900 border border-slate-300 font-bold">
                Log Header: {lastResult.redactedHeader}
              </span>
            </div>

            {lastResult.subject && (
              <div className="text-xs space-y-1 font-mono mt-2 pt-2 border-t border-slate-300 text-slate-900">
                <p><span className="text-slate-600 font-bold">Authenticated Identity:</span> {lastResult.subject}</p>
                <p><span className="text-slate-600 font-bold">Granted Roles:</span> {lastResult.roles?.join(", ")}</p>
              </div>
            )}

            {lastResult.error && (
              <p className="text-xs text-slate-900 font-mono mt-2 font-bold">
                <strong>Error:</strong> {lastResult.error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

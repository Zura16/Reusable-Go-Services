import React from "react";
import { Navbar } from "@/components/Navbar";
import SmoothScrollHero from "@/components/ui/smooth-scroll-hero";
import { ShaderGradientBG } from "@/components/ui/shader-gradient-bg";
import { AuthTester } from "@/components/playground/AuthTester";
import { GRPCTester } from "@/components/playground/GRPCTester";
import { RetrySimulator } from "@/components/playground/RetrySimulator";
import { MetricsDashboard } from "@/components/playground/MetricsDashboard";
import { HealthMonitor } from "@/components/playground/HealthMonitor";
import { ShieldCheck, Server, RefreshCw, Activity, Layers, Terminal, CheckCircle2 } from "lucide-react";

export function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative selection:bg-indigo-500/30">
      {/* 3D Animated Shader Gradient Canvas Background */}
      <ShaderGradientBG />

      {/* Floating Navbar */}
      <Navbar />

      {/* Parallax Hero Section */}
      <section className="relative z-10">
        <SmoothScrollHero
          scrollHeight={1400}
          desktopImage="https://images.unsplash.com/photo-1511884642898-4c92249e20b6?q=80&w=2400&auto=format&fit=crop"
          mobileImage="https://images.unsplash.com/photo-1511207538754-e8555f2bc187?q=80&w=1200&auto=format&fit=crop"
          initialClipPercentage={20}
          finalClipPercentage={80}
        />
      </section>

      {/* Main Interactive Playground Section */}
      <main id="playground" className="relative z-20 max-w-7xl mx-auto px-4 md:px-8 py-20 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-purple-300 bg-purple-500/10 border border-purple-500/30">
            Interactive Control Center
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            Test ServiceKit Capabilities Live
          </h2>
          <p className="text-slate-400 text-base md:text-lg font-light leading-relaxed">
            Interact with ServiceKit's backend primitives: constant-time token auth, gRPC reflection, exponential backoff retries, and Prometheus telemetry.
          </p>
        </div>

        {/* Grid of Control Panels */}
        <div className="space-y-12">
          {/* Auth & gRPC Side-by-Side */}
          <div id="auth" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AuthTester />
            <div id="grpc">
              <GRPCTester />
            </div>
          </div>

          {/* HTTP Client Retry Simulator */}
          <div id="retries">
            <RetrySimulator />
          </div>

          {/* Metrics & Health Monitors */}
          <div id="telemetry" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <MetricsDashboard />
            <HealthMonitor />
          </div>
        </div>

        {/* Architecture & Package Highlights */}
        <div className="pt-12 border-t border-white/10 space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-white">ServiceKit Core Packages</h3>
            <p className="text-slate-400 text-sm">6 Decoupled Go Packages for Microservice Acceleration</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "config",
                desc: "Typed configuration loading from env vars with defaults, validation, and [REDACTED] stringer protection.",
                icon: <Terminal className="w-5 h-5 text-indigo-400" />,
              },
              {
                title: "observability",
                desc: "Zap JSON structured logging, Prometheus counters/histograms, and OpenTelemetry trace providers.",
                icon: <Activity className="w-5 h-5 text-cyan-400" />,
              },
              {
                title: "auth",
                desc: "Static & Mock TokenValidator implementations using crypto/subtle to prevent timing attacks.",
                icon: <ShieldCheck className="w-5 h-5 text-purple-400" />,
              },
              {
                title: "httpserver",
                desc: "Production HTTP server with /healthz, /readyz, /metrics, recovery, request ID, and body limit middleware.",
                icon: <Layers className="w-5 h-5 text-emerald-400" />,
              },
              {
                title: "httpclient",
                desc: "Context-aware HTTP client with connection pooling, exponential backoff, jitter, and idempotency guards.",
                icon: <RefreshCw className="w-5 h-5 text-pink-400" />,
              },
              {
                title: "grpcserver",
                desc: "gRPC server with unary interceptor chain (Recovery, Logging, Metrics, Auth) and ProfileService demo.",
                icon: <Server className="w-5 h-5 text-blue-400" />,
              },
            ].map((pkg) => (
              <div key={pkg.title} className="p-6 rounded-2xl glass-card border border-white/10 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
                    {pkg.icon}
                  </div>
                  <h4 className="font-mono font-bold text-lg text-white">servicekit/{pkg.title}</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{pkg.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-white/10 py-10 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 ServiceKit — Reusable Go Service Foundation</p>
          <div className="flex items-center gap-6 text-slate-400">
            <a href="https://github.com/Zura16/Reusable-Go-Services" className="hover:text-white transition">GitHub Repo</a>
            <a href="#playground" className="hover:text-white transition">Playground</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

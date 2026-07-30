import React from "react";
import { Navbar } from "@/components/Navbar";
import SmoothScrollHero from "@/components/ui/smooth-scroll-hero";
import { AuthTester } from "@/components/playground/AuthTester";
import { GRPCTester } from "@/components/playground/GRPCTester";
import { RetrySimulator } from "@/components/playground/RetrySimulator";
import { MetricsDashboard } from "@/components/playground/MetricsDashboard";
import { HealthMonitor } from "@/components/playground/HealthMonitor";
import TiltedCard from "@/components/ui/TiltedCard";
import GhostCursor from "@/components/ui/GhostCursor";
import { ShieldCheck, Server, RefreshCw, Activity, Layers, Terminal } from "lucide-react";

export function App() {
  return (
    <div className="min-h-screen bg-black text-slate-100 relative selection:bg-white/20">
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
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-slate-200 bg-white/10 border border-white/20">
            Interactive Control Center
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            Test ServiceKit Capabilities Live
          </h2>
          <p className="text-slate-300 text-base md:text-lg font-light leading-relaxed">
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

        {/* Featured 3D Tilted Cards Showcase (Lighter Background Overlays) */}
        <div className="pt-12 border-t border-white/15 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-items-center">
            <TiltedCard
              imageSrc="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop"
              altText="ServiceKit Go Microservice Architecture"
              captionText="ServiceKit Architecture — Go 1.22+"
              containerHeight="320px"
              containerWidth="100%"
              imageHeight="320px"
              imageWidth="100%"
              rotateAmplitude={14}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip={true}
              displayOverlayContent={true}
              overlayContent={
                <div className="p-6 h-full flex flex-col justify-between bg-black/35 backdrop-blur-sm rounded-2xl border border-white/20">
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/15 text-white w-max font-bold">
                    Go 1.22+ Native
                  </span>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-1">Production Microservice Kit</h4>
                    <p className="text-xs text-slate-200">Zero third-party bloat with standard library primitives</p>
                  </div>
                </div>
              }
            />

            <TiltedCard
              imageSrc="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop"
              altText="High Performance gRPC & Telemetry"
              captionText="gRPC & Prometheus Telemetry Engine"
              containerHeight="320px"
              containerWidth="100%"
              imageHeight="320px"
              imageWidth="100%"
              rotateAmplitude={14}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip={true}
              displayOverlayContent={true}
              overlayContent={
                <div className="p-6 h-full flex flex-col justify-between bg-black/35 backdrop-blur-sm rounded-2xl border border-white/20">
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/10 text-white w-max font-bold">
                    gRPC & OTel Wire
                  </span>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-1">Observability & Resilience</h4>
                    <p className="text-xs text-slate-200">Zap JSON logging, Prometheus metrics, and retries</p>
                  </div>
                </div>
              }
            />
          </div>
        </div>

        {/* Architecture & Package Highlights with GhostCursor integration */}
        <div className="pt-12 border-t border-white/15 space-y-8 relative">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-white">ServiceKit Core Packages</h3>
            <p className="text-slate-300 text-sm">6 Decoupled Go Packages for Microservice Acceleration</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "config",
                desc: "Typed configuration loading from env vars with defaults, validation, and [REDACTED] stringer protection.",
                icon: <Terminal className="w-5 h-5 text-white" />,
              },
              {
                title: "observability",
                desc: "Zap JSON structured logging, Prometheus counters/histograms, and OpenTelemetry trace providers.",
                icon: <Activity className="w-5 h-5 text-white" />,
              },
              {
                title: "auth",
                desc: "Static & Mock TokenValidator implementations using crypto/subtle to prevent timing attacks.",
                icon: <ShieldCheck className="w-5 h-5 text-white" />,
              },
              {
                title: "httpserver",
                desc: "Production HTTP server with /healthz, /readyz, /metrics, recovery, request ID, and body limit middleware.",
                icon: <Layers className="w-5 h-5 text-white" />,
              },
              {
                title: "httpclient",
                desc: "Context-aware HTTP client with connection pooling, exponential backoff, jitter, and idempotency guards.",
                icon: <RefreshCw className="w-5 h-5 text-white" />,
              },
              {
                title: "grpcserver",
                desc: "gRPC server with unary interceptor chain (Recovery, Logging, Metrics, Auth) and ProfileService demo.",
                icon: <Server className="w-5 h-5 text-white" />,
              },
            ].map((pkg) => (
              <div
                key={pkg.title}
                className="relative p-6 rounded-3xl glass-card border border-white/15 space-y-3 overflow-hidden group min-h-[160px]"
              >
                {/* GhostCursor Effect inside each box */}
                <GhostCursor
                  color="#B497CF"
                  brightness={1.2}
                  edgeIntensity={0}
                  trailLength={45}
                  inertia={0.5}
                  grainIntensity={0.05}
                  bloomStrength={0.15}
                  bloomRadius={1.0}
                  bloomThreshold={0.025}
                  fadeDelayMs={800}
                  fadeDurationMs={1200}
                  zIndex={5}
                />
                <div className="relative z-10 space-y-3 pointer-events-none">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl liquid-glass-box text-white">
                      {pkg.icon}
                    </div>
                    <h4 className="font-mono font-bold text-lg text-white">servicekit/{pkg.title}</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{pkg.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-white/15 py-10 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 ServiceKit — Reusable Go Service Foundation</p>
          <div className="flex items-center gap-6 text-slate-300">
            <a href="https://github.com/Zura16/Reusable-Go-Services" className="hover:text-white transition">GitHub Repo</a>
            <a href="#playground" className="hover:text-white transition">Playground</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { VexaroMark } from "@/components/ui/vexaro-mark";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function AuthPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  async function handleGoogleSignIn() {
    await signInWithGoogle();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <Loader2 size={20} className="animate-spin" style={{ color: "#00d4c8" }} />
      </div>
    );
  }

  return (
    <>
      <style>{`
        :root {
          --bg: #00000;
          --fg: #f0f0ee;
          --muted: #6b6b6b;
          --muted-2: #3d3d3d;
          --line-color: #1e1e1e;
          --grid-color: rgba(255,255,255,0.025);
          --accent-color: #00d4c8;
          --font-display: 'DM Serif Display', Georgia, serif;
          --font-body: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .auth-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          background: transparent;
          color: var(--fg);
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.875rem;
          padding: 0.75rem 1.5rem;
          border: 1px solid var(--line-color);
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          letter-spacing: 0.01em;
        }
        .auth-btn:hover:not(:disabled) {
          border-color: var(--muted-2);
          background: #111;
        }
        .auth-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap"
      />
        <Navbar />
      <div
        className="relative min-h-screen flex"
        style={{ background: "var(--bg)", color: "var(--fg)" }}
      >
        {/* Fine grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }} />

        {/* Accent bleed top left */}
        <div className="absolute top-0 left-0 w-80 h-80 pointer-events-none" style={{
          background: "radial-gradient(ellipse at top left, rgba(0,212,200,0.04) 0%, transparent 70%)",
        }} />

        {/* Left panel — branding */}
        <div
          className="hidden lg:flex flex-col justify-between w-1/2 p-16"
          style={{ borderRight: "1px solid var(--line-color)" }}
        >
          <div style={{ animation: "fadeUp 0.6s ease 0.05s both" }}>
            <VexaroMark size={40} />
          </div>

          <div style={{ animation: "fadeUp 0.7s ease 0.15s both" }}>
            <p className="font-mono text-xs tracking-widest uppercase mb-6" style={{ color: "var(--accent-color)" }}>
              Public Beta
            </p>
            <h1
              className="font-black leading-tight mb-6"
              style={{
                fontSize: "clamp(2.5rem, 4vw, 3.8rem)",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.04em",
              }}
            >
              The internet,
              <br />
              <span style={{ color: "var(--accent-color)" }}>structured.</span>
            </h1>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
              Define what data you want. Quorel fetches it, structures it, versions it, and serves it as a live API. No pipelines. No maintenance.
            </p>
          </div>

          <div style={{ animation: "fadeUp 0.7s ease 0.3s both" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-px" style={{ background: "var(--line-color)" }} />
              <span className="font-mono text-xs" style={{ color: "var(--muted-2)" }}>vexaro.vercel.app</span>
            </div>
          </div>
        </div>

        {/* Right panel — auth */}
        <div className="flex flex-col justify-center w-full lg:w-1/2 px-8 md:px-16 lg:px-24">
          {/* Mobile logo */}
          <div className="lg:hidden mb-12" style={{ animation: "fadeUp 0.6s ease both" }}>
            <VexaroMark size={36} />
          </div>

          <div style={{ animation: "fadeUp 0.7s ease 0.1s both", maxWidth: "360px" }}>
            <p className="font-mono text-xs tracking-widest uppercase mb-8" style={{ color: "var(--muted-2)" }}>
              Sign in
            </p>

            <h2
              className="font-black leading-tight mb-3"
              style={{
                fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.03em",
              }}
            >
              Welcome back.
            </h2>

            <p className="text-sm mb-10" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
              Sign in to your Quorel account to manage your Datasets.
            </p>

            <button
              className="auth-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" style={{ color: "var(--accent-color)" }} />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
              {!loading && <ArrowRight size={14} className="ml-auto" style={{ color: "var(--muted-2)" }} />}
            </button>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px" style={{ background: "var(--line-color)" }} />
              <span className="font-mono text-xs" style={{ color: "var(--muted-2)" }}>OR</span>
              <div className="flex-1 h-px" style={{ background: "var(--line-color)" }} />
            </div>

            <p className="text-xs text-center mt-10 leading-relaxed" style={{ color: "var(--muted-2)", fontFamily: "var(--font-body)" }}>
              By continuing, you agree to Quorel's{" "}
              <a href="#" style={{ color: "var(--muted)", textDecoration: "underline", textDecorationColor: "var(--muted-2)" }}>
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" style={{ color: "var(--muted)", textDecoration: "underline", textDecorationColor: "var(--muted-2)" }}>
                Privacy Policy
              </a>.
            </p>
          </div>
        </div>
      </div>
       <Footer />
    </>
    
  );
}
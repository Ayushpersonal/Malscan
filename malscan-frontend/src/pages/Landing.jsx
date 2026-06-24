import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AntigravityShader from '../components/analysis/AntigravityShader';

export const Landing = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleNavClick = (path) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      navigate(`/login?redirect=${encodeURIComponent(path)}`);
    }
  };

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md overflow-x-hidden min-h-screen relative flex flex-col justify-between select-none">
      {/* Global Background WebGL Shader */}
      <div className="fixed inset-0 w-full h-full opacity-30 pointer-events-none z-0">
        <AntigravityShader />
      </div>

      {/* Top Header Navigation */}
      <header className="flex justify-between items-center h-16 px-margin-desktop w-full fixed top-0 z-50 bg-surface-dim/85 backdrop-blur-md border-b border-outline-variant">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-primary-fixed-dim rounded flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-fixed text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
          </div>
          <span className="font-title-md text-title-md font-bold text-primary tracking-tight">MalScan</span>
        </div>

        <nav className="hidden md:flex gap-8">
          <button onClick={() => handleNavClick('/dashboard')} className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-xs font-semibold uppercase tracking-wider bg-transparent border-none cursor-pointer">Dashboard</button>
          <button onClick={() => handleNavClick('/scan')} className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-xs font-semibold uppercase tracking-wider bg-transparent border-none cursor-pointer">Scan File</button>
          <button onClick={() => handleNavClick('/history')} className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-xs font-semibold uppercase tracking-wider bg-transparent border-none cursor-pointer">Scan History</button>
          <button onClick={() => handleNavClick('/profile')} className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-xs font-semibold uppercase tracking-wider bg-transparent border-none cursor-pointer">Profile</button>
        </nav>

        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors">notifications</span>
          <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors">shield</span>
          {isAuthenticated ? (
            <button 
              onClick={() => navigate('/dashboard')}
              className="bg-primary-container text-on-primary-container px-4 py-1.5 rounded font-label-code text-label-code font-bold hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,219,233,0.2)]"
            >
              CONSOLE
            </button>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className="bg-primary-container text-on-primary-container px-4 py-1.5 rounded font-label-code text-label-code font-bold hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,219,233,0.2)]"
            >
              GET STARTED
            </button>
          )}
        </div>
      </header>

      {/* Main scrollable body */}
      <main className="relative z-10 flex-1 pt-16">
        {/* Hero Section */}
        <section className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center text-center px-margin-mobile py-16">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-teal-accent/30 text-teal-accent font-label-code text-label-code uppercase tracking-widest animate-pulse-cyan">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-accent"></span>
              </span>
              Live Threat Intelligence Active
            </div>
            <h1 className="font-display-lg text-[40px] md:text-[56px] leading-[48px] md:leading-[64px] font-bold text-primary max-w-3xl mx-auto tracking-tight">
              Detect Malware <span className="text-primary-fixed-dim">Before It Strikes</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              AI-powered static malware analysis for the next generation of security. Identify sophisticated threats with clinical precision in milliseconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <button 
                onClick={() => handleNavClick('/scan')}
                className="w-full sm:w-auto bg-primary-fixed-dim text-on-primary-fixed px-8 py-4 rounded font-title-md text-title-md flex items-center justify-center gap-2 glow-cyan hover:scale-[1.02] active:scale-[0.98] transition-all font-bold"
              >
                <span className="material-symbols-outlined">upload_file</span>
                Scan File
              </button>
              <button 
                onClick={() => handleNavClick('/dashboard')}
                className="w-full sm:w-auto bg-transparent border border-outline text-on-surface hover:text-primary px-8 py-4 rounded font-title-md text-title-md flex items-center justify-center gap-2 hover:bg-surface-container-high transition-all"
              >
                <span className="material-symbols-outlined">dashboard</span>
                View Dashboard
              </button>
            </div>
          </div>

          {/* Dashboard Preview / Bento Grid */}
          <div className="mt-20 w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-xl border-l-4 border-l-status-malware text-left">
              <div className="flex justify-between items-start mb-4">
                <span className="font-label-code text-label-code text-on-surface-variant uppercase">Threat Level</span>
                <span className="text-status-malware font-bold text-title-md">CRITICAL</span>
              </div>
              <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-status-malware w-[92%]"></div>
              </div>
              <p className="mt-4 font-body-md text-body-md text-on-surface-variant">Suspicious entropy detected in section .text</p>
            </div>
            
            <div className="glass-card p-6 rounded-xl border-l-4 border-l-status-benign text-left">
              <div className="flex justify-between items-start mb-4">
                <span className="font-label-code text-label-code text-on-surface-variant uppercase">Analysis Queue</span>
                <span className="text-status-benign font-bold text-title-md">0.004s</span>
              </div>
              <div className="flex gap-1 items-end h-12">
                <div className="h-8 w-1.5 bg-status-benign/30 rounded"></div>
                <div className="h-10 w-1.5 bg-status-benign/50 rounded"></div>
                <div className="h-6 w-1.5 bg-status-benign rounded"></div>
                <div className="h-12 w-1.5 bg-status-benign rounded animate-pulse"></div>
                <div className="h-8 w-1.5 bg-status-benign/60 rounded"></div>
              </div>
              <p className="mt-4 font-body-md text-body-md text-on-surface-variant">Real-time processing active</p>
            </div>

            <div className="glass-card p-6 rounded-xl border-l-4 border-l-primary-fixed-dim text-left">
              <div className="flex justify-between items-start mb-4">
                <span className="font-label-code text-label-code text-on-surface-variant uppercase">AI Confidence</span>
                <span className="text-primary-fixed-dim font-bold text-title-md">99.8%</span>
              </div>
              <div className="flex items-center gap-4 h-12">
                <span className="material-symbols-outlined text-4xl text-primary-fixed-dim">psychology</span>
                <div className="text-left font-mono">
                  <div className="text-on-surface font-bold text-xs">Neural Model v2.4</div>
                  <div className="text-on-surface-variant text-[10px]">Updated 2m ago</div>
                </div>
              </div>
              <p className="mt-4 font-body-md text-body-md text-on-surface-variant">Decisions logged on registry blockchain</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-margin-mobile bg-surface-container-lowest/40 border-y border-outline-variant/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-2">
              <h2 className="font-headline-lg text-headline-lg text-primary">Defensive Intelligence Architecture</h2>
              <p className="text-on-surface-variant max-w-xl mx-auto">Engineered for security teams that cannot afford a single false negative.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* AI Detection */}
              <div className="glass-card p-8 rounded-2xl group hover:border-teal-accent/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 text-teal-accent">
                  <span className="material-symbols-outlined text-3xl">psychology</span>
                </div>
                <h3 className="font-title-md text-title-md text-primary mb-3">AI Static Classifier</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Our custom trained XGBoost classifier logs metamorphic malware patterns that bypass traditional signature-based security layers by analyzing internal parameters.
                </p>
              </div>

              {/* Static File Analysis */}
              <div className="glass-card p-8 rounded-2xl group hover:border-teal-accent/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 text-teal-accent">
                  <span className="material-symbols-outlined text-3xl">code_blocks</span>
                </div>
                <h3 className="font-title-md text-title-md text-primary mb-3">Static Structural Analysis</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Deep inspection of Windows Portable Executable (PE) binaries without execution. Safely map obfuscation metrics, packed entropy sections, and dynamic runtime indicators.
                </p>
              </div>

              {/* Threat Confidence Score */}
              <div className="glass-card p-8 rounded-2xl group hover:border-teal-accent/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 text-teal-accent">
                  <span className="material-symbols-outlined text-3xl">monitoring</span>
                </div>
                <h3 className="font-title-md text-title-md text-primary mb-3">Threat Confidence Matrix</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Receive a granular risk confidence metric calculated from heuristic checks, binary signature matches, API pressure indices, and historical threat database lookups.
                </p>
              </div>

              {/* Secure & Private */}
              <div className="glass-card p-8 rounded-2xl group hover:border-teal-accent/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 text-teal-accent">
                  <span className="material-symbols-outlined text-3xl">lock</span>
                </div>
                <h3 className="font-title-md text-title-md text-primary mb-3">Secure & Cryptographically Verified</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Enterprise-grade data security. Uploaded session indicators and malware signature records are scrubbed and verified against cryptographical database chains.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 px-margin-mobile">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="font-headline-lg text-headline-lg text-primary mb-16">Three Steps to Total Visibility</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-outline-variant to-transparent z-0"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-surface-elevated border border-primary-fixed-dim flex items-center justify-center text-primary-fixed-dim mb-6 text-xl font-bold font-mono">1</div>
                <h4 className="font-title-md text-title-md text-primary mb-2">Ingest Binary</h4>
                <p className="text-on-surface-variant text-sm max-w-xs leading-relaxed">Submit your target binary file through our drag-and-drop dashboard portal.</p>
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-surface-elevated border border-primary-fixed-dim flex items-center justify-center text-primary-fixed-dim mb-6 text-xl font-bold font-mono">2</div>
                <h4 className="font-title-md text-title-md text-primary mb-2">Extract Metrics</h4>
                <p className="text-on-surface-variant text-sm max-w-xs leading-relaxed">The parser extracts 33 diagnostic parameters including section sizes, page counts, and scheduler policies.</p>
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-surface-elevated border border-primary-fixed-dim flex items-center justify-center text-primary-fixed-dim mb-6 text-xl font-bold font-mono">3</div>
                <h4 className="font-title-md text-title-md text-primary mb-2">AI Verdict</h4>
                <p className="text-on-surface-variant text-sm max-w-xs leading-relaxed">Get an instant verdict log mapping section risk levels, confidence scores, and rule-based advisories.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner Section */}
        <section className="py-20 px-margin-mobile">
          <div className="max-w-5xl mx-auto glass-card rounded-3xl p-12 text-center border-t border-teal-accent/20">
            <h2 className="font-headline-lg text-headline-lg text-primary mb-6">Ready to fortify your perimeter?</h2>
            <p className="text-on-surface-variant mb-10 max-w-2xl mx-auto">Join security operators using MalScan for automated threat hunting and file integrity verification.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => handleNavClick('/scan')}
                className="bg-primary-fixed-dim hover:bg-primary-container text-on-primary-fixed px-10 py-4 rounded font-title-md text-title-md font-bold transition-all shadow-[0_0_15px_rgba(0,219,233,0.3)] hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Free Scan
              </button>
              <button 
                onClick={() => handleNavClick('/dashboard')}
                className="text-primary px-10 py-4 rounded font-title-md text-title-md border border-outline hover:bg-surface-container-high transition-colors"
              >
                View Dashboard
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="w-full py-12 bg-surface-container-lowest border-t border-outline-variant relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center px-margin-desktop gap-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-outline-variant/20 rounded flex items-center justify-center">
              <span className="material-symbols-outlined text-outline text-[16px]">shield</span>
            </div>
            <span className="font-label-code text-primary text-xs font-semibold">MalScan Defensive Intelligence</span>
          </div>
          <div className="flex gap-8">
            <a className="font-label-code text-label-code text-xs text-on-surface-variant hover:text-primary transition-colors" href="#privacy">Privacy Policy</a>
            <a className="font-label-code text-label-code text-xs text-on-surface-variant hover:text-primary transition-colors" href="#terms">Terms of Service</a>
            <a className="font-label-code text-label-code text-xs text-on-surface-variant hover:text-primary transition-colors" href="#security">Security Disclosure</a>
          </div>
          <div className="font-label-code text-label-code text-xs text-on-surface-variant/60">
            © 2026 MalScan Defensive Intelligence. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all registration fields.');
      return;
    }

    if (password.length < 6) {
      setError('Access password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Access passwords do not match. Verify entered strings.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await register(name, email, password);
      // Auto redirect back to main dashboard
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Check network or email address.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Atmospheric Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(0,219,233,0.05),_transparent_70%)]"></div>
        <div className="scanline"></div>
      </div>

      {/* MAIN WRAPPER */}
      <div className="relative z-10 w-full max-w-md px-margin-mobile md:px-0">
        {/* LOGO ANCHOR */}
        <div className="flex flex-col items-center mb-8">
          <img 
            alt="MalScan Logo" 
            className="w-16 h-16 mb-4 object-contain" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtQKg3v_hL39YfehUUUx9Ism9AP91_qrCmxNOkvip89KkAFXczzxaN48wGUgiWjO8Wz9lp2FNpep_VfKcL_110m6Y1XcTVSDk116XZ4Ed94jVZLdOOx6GLTs892YNKL74dV6iF5ZATVD5esHqO8bnBEAQonuWzoYmRcA8iSf7fzCzc0Qoedvv-_o8TSbsIbm6iO7rshANLYFmb-aAhDsIJ9NkcQBe9dGDDtorIueVzsL2Nw3H_rds1zRwMBRz66A6yIbBmX0l5NLE"
          />
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">MalScan</h1>
          <p className="font-label-code text-label-code text-on-surface-variant uppercase tracking-widest">Defensive Intelligence</p>
        </div>

        {/* REGISTER SECTION */}
        <div className="page-container w-full">
          <div className="auth-card p-8 rounded-lg relative overflow-hidden">
            <div className="mb-8">
              <h2 className="font-title-md text-title-md text-primary mb-1">New Enrollment</h2>
              <p className="font-body-md text-on-surface-variant">Register a new intelligence node on the network.</p>
            </div>

            {error && (
              <div className="mb-6 bg-error-container/10 border border-error/30 text-error p-3 rounded font-mono text-[13px] flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] mt-0.5">error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block font-label-code text-[11px] text-on-surface-variant mb-2" htmlFor="reg-name">OPERATOR_NAME</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">badge</span>
                  <input 
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded px-10 py-3 text-body-md font-body-md input-glow focus:outline-none transition-all duration-200 text-on-surface" 
                    id="reg-name" 
                    placeholder="Kajal Sharma" 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-code text-[11px] text-on-surface-variant mb-2" htmlFor="reg-email">EMAIL_COMMUNICATION</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">alternate_email</span>
                  <input 
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded px-10 py-3 text-body-md font-body-md input-glow focus:outline-none transition-all duration-200 text-on-surface" 
                    id="reg-email" 
                    placeholder="analyst@malscan.io" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-code text-[11px] text-on-surface-variant mb-2" htmlFor="reg-password">ESTABLISH_KEY</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">lock</span>
                  <input 
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded px-10 py-3 text-body-md font-body-md input-glow focus:outline-none transition-all duration-200 text-on-surface" 
                    id="reg-password" 
                    placeholder="••••••••" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-code text-[11px] text-on-surface-variant mb-2" htmlFor="reg-confirm-password">CONFIRM_ESTABLISHED_KEY</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">lock</span>
                  <input 
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded px-10 py-3 text-body-md font-body-md input-glow focus:outline-none transition-all duration-200 text-on-surface" 
                    id="reg-confirm-password" 
                    placeholder="••••••••" 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className="flex items-start space-x-3 text-label-code font-label-code text-[11px]">
                <input 
                  className="mt-0.5 w-4 h-4 rounded border-outline-variant bg-surface-container text-primary-fixed-dim focus:ring-primary-fixed-dim" 
                  id="terms" 
                  type="checkbox"
                  required
                />
                <label className="text-on-surface-variant leading-tight" htmlFor="terms">
                  I agree to the <a className="text-primary-fixed-dim hover:underline" href="#security">Security Protocols</a> and <a className="text-primary-fixed-dim hover:underline" href="#compliance">Compliance Disclosure</a>.
                </label>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full bg-primary-fixed-dim hover:bg-primary-container text-on-primary-fixed font-title-md py-4 rounded-lg transition-all duration-300 transform active:scale-[0.98] btn-glitch shadow-[0_0_15px_rgba(0,219,233,0.2)] flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-on-primary-fixed/20 border-t-on-primary-fixed rounded-full animate-spin"></span>
                    <span>ENROLLING NODE...</span>
                  </>
                ) : (
                  'CONFIRM_ENROLLMENT'
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-outline-variant text-center">
              <p className="font-body-md text-on-surface-variant">
                Already Authorized? 
                <Link to="/login" className="text-primary-fixed-dim font-medium hover:underline ml-1">Return to Login</Link>
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER METADATA */}
        <div className="mt-12 text-center">
          <div className="flex justify-center items-center space-x-6 mb-4 text-label-code font-label-code text-on-surface-variant">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-status-benign animate-pulse"></span>
              SYSTEM_ACTIVE
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">shield</span>
              E2E_ENCRYPTED
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">public</span>
              v2.4.0_SECURE
            </div>
          </div>
          <p className="font-label-code text-[11px] text-outline uppercase tracking-widest opacity-50">
            © 2026 MalScan Defensive Intelligence. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
};

export default Register;

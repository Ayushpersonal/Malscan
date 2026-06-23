import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProtectedWrapper from '../components/ProtectedWrapper';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all credentials fields.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      // Seamless redirect back to main dashboard homepage
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      <ProtectedWrapper title="Security Authentication Node">
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-header">
            <span className="auth-icon">🔒</span>
            <h2>SYSTEM SIGN-IN</h2>
            <p>Access the secure hybrid classification analytics portal</p>
          </div>

          {error && (
            <div className="error-banner">
              <span className="error-icon">❌</span>
              <p className="error-message">{error}</p>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <input
              type="email"
              id="login-email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@malscan.local"
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Access Password</label>
            <input
              type="password"
              id="login-password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            className="action-btn auth-submit-btn"
            disabled={submitting}
          >
            {submitting ? 'Authenticating credentials...' : 'Establish Secure Connection'}
          </button>

          <p className="auth-redirect-text">
            New operator node? <Link to="/register" className="auth-link">Register credentials</Link>
          </p>
        </form>
      </ProtectedWrapper>
    </div>
  );
};

export default Login;

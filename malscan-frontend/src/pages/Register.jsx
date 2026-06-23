import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProtectedWrapper from '../components/ProtectedWrapper';

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
    <div className="auth-page-container">
      <ProtectedWrapper title="New Operator Registration Node">
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-header">
            <span className="auth-icon">⚙️</span>
            <h2>REGISTER CREDENTIALS</h2>
            <p>Initialize a new multi-tenant session key on the network</p>
          </div>

          {error && (
            <div className="error-banner">
              <span className="error-icon">❌</span>
              <p className="error-message">{error}</p>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="register-name">Operator Name</label>
            <input
              type="text"
              id="register-name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kajal Sharma"
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">Email Address</label>
            <input
              type="email"
              id="register-email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@malscan.local"
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-password">Create Access Password</label>
            <input
              type="password"
              id="register-password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-confirm-password">Confirm Access Password</label>
            <input
              type="password"
              id="register-confirm-password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {submitting ? 'Registering operator node...' : 'Create Credentials & Log In'}
          </button>

          <p className="auth-redirect-text">
            Already registered? <Link to="/login" className="auth-link">Authenticate here</Link>
          </p>
        </form>
      </ProtectedWrapper>
    </div>
  );
};

export default Register;

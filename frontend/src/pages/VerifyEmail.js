import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import './Auth.css';

function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const token = params.get('token');
  const initialEmail = location.state?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [devLink, setDevLink] = useState(location.state?.devVerificationUrl || '');
  const [status, setStatus] = useState(location.state?.message || 'Check your inbox and verify your email address.');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(Boolean(token));

  const title = useMemo(() => (token ? 'Verifying email' : 'Verify your email'), [token]);

  useEffect(() => {
    let cancelled = false;

    async function verifyToken() {
      if (!token) return;
      setSubmitting(true);
      setError('');

      try {
        const res = await api.post('/api/users/verify-email', { token });
        if (cancelled) return;
        localStorage.setItem('token', res.data.token);
        setStatus(res.data.message || 'Email verified. Opening your dashboard...');
        setTimeout(() => navigate('/dashboard'), 900);
      } catch (err) {
        if (cancelled) return;
        setError(err?.response?.data?.message || 'Verification link is invalid or expired.');
      } finally {
        if (!cancelled) setSubmitting(false);
      }
    }

    verifyToken();
    return () => {
      cancelled = true;
    };
  }, [navigate, token]);

  const resendVerification = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');
    setDevLink('');

    if (!email.trim()) {
      setError('Enter your email so we can send a new verification link.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/api/users/resend-verification', { email: email.trim() });
      setStatus(res.data.message || 'Verification email sent.');
      setDevLink(res.data.devVerificationUrl || '');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not resend verification.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="authSplit verifySplit">
      <section className="authPane">
        <div className="authBrand">
          <img src="/assets/omega-tracker-logo.png" alt="" aria-hidden="true" />
          <strong>Omega.</strong>
        </div>

        <form className="magloAuthForm verifyForm" onSubmit={resendVerification}>
          <div>
            <h1>{title}</h1>
            <p>Email verification keeps random addresses out of your workspace.</p>
          </div>

          {status ? <div className="authMessage" role="status">{status}</div> : null}
          {error ? <div className="authError" role="alert">{error}</div> : null}

          {!token ? (
            <>
              <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="example@gmail.com" required /></label>
              <button className="authSubmit" type="submit" disabled={submitting}>{submitting ? 'Sending...' : 'Resend verification'}</button>
            </>
          ) : (
            <button className="authSubmit" type="button" disabled>{submitting ? 'Verifying...' : 'Verified'}</button>
          )}

          {devLink ? (
            <a className="devVerifyLink" href={devLink}>Open local verification link</a>
          ) : null}

          <p className="authLink">Already verified? <Link to="/">Sign in</Link></p>
        </form>
      </section>

      <section className="authArt" aria-hidden="true">
        <div className="handShape" />
        <div className="clockFace">
          {[...Array(12)].map((_, index) => <span key={index}>{index === 0 ? 12 : index}</span>)}
          <i />
          <b />
        </div>
        <div className="artGround" />
      </section>
    </div>
  );
}

export default VerifyEmail;

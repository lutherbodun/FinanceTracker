import React, { useMemo, useState } from 'react';
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    // Email verification is disabled for now. Keep message state for the later resend flow.
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const canSubmit = useMemo(() => email.trim() && password && !submitting, [email, password, submitting]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setMessage('');
        setSubmitting(true);

        try {
            const res = await api.post('/api/users/login', { email: email.trim(), password });
            localStorage.setItem('token', res.data.token);
            if (remember) localStorage.setItem('rememberEmail', email.trim());
            navigate('/dashboard');
        } catch (err) {
            // Email verification is disabled for now. Re-enable needsVerification handling later.
            // if (err?.response?.data?.needsVerification) {
            //     setError('Please verify your email before signing in.');
            // } else {
            //     setError(err?.response?.data?.message || 'Invalid email or password.');
            // }
            setError(err?.response?.data?.message || 'Invalid email or password.');
        } finally {
            setSubmitting(false);
        }
    };

    // Email verification is disabled for now. Re-enable this helper when the feature returns.
    // const resendVerification = async () => {
    //     setError('');
    //     setMessage('');
    //
    //     if (!email.trim()) {
    //         setError('Enter your email first, then resend verification.');
    //         return;
    //     }
    //
    //     try {
    //         const res = await api.post('/api/users/resend-verification', { email: email.trim() });
    //         setMessage(res.data.devVerificationUrl || res.data.message || 'Verification email sent.');
    //     } catch (err) {
    //         setError(err?.response?.data?.message || 'Could not resend verification.');
    //     }
    // };

    return (
        <div className="authSplit">
            <section className="authPane">
                <Brand />
                <form className="magloAuthForm" onSubmit={handleSubmit}>
                    <div>
                        <h1>Welcome back</h1>
                        <p>Enter your details to open your workspace.</p>
                    </div>
                    {error ? <div className="authError" role="alert">{error}</div> : null}
                    {message ? <div className="authMessage" role="status">{message}</div> : null}
                    <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" required /></label>
                    <label>
                        Password
                        <span className="passwordShell">
                            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="********" required />
                            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                            </button>
                        </span>
                    </label>
                    <div className="authOptions">
                        <label className="checkLine"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />Remember for 30 Days</label>
                        <button type="button" onClick={() => setError('Password reset is not wired yet.')}>Forgot password</button>
                    </div>
                    <button className="authSubmit" type="submit" disabled={!canSubmit}>{submitting ? 'Signing in...' : 'Sign in'}</button>
                    <p className="authLink">Don't have an account? <Link to="/register">Sign up for free</Link></p>
                </form>
            </section>
            <ArtPane />
        </div>
    );
}

function Brand() {
    return (
        <div className="authBrand">
            <img src="/assets/omega-tracker-logo.png" alt="" aria-hidden="true" />
            <strong>Omega.</strong>
        </div>
    );
}

function ArtPane() {
    return (
        <section className="authArt" aria-hidden="true">
            <div className="authVisual">
                <img src="/assets/omega-tracker-logo.png" alt="" />
                <div>
                    <span>Total balance</span>
                    <strong>$0.00</strong>
                </div>
                <div className="visualLine">
                    <i />
                    <i />
                    <i />
                    <i />
                </div>
                <small>Track income, expenses, invoices, and wallets in one place.</small>
            </div>
        </section>
    );
}

export default Login;

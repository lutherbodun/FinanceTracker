import React, { useMemo, useState } from 'react';
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const passwordsMatch = password && confirmPassword && password === confirmPassword;
    const passwordMismatch = confirmPassword && password !== confirmPassword;
    const canSubmit = useMemo(
        () => name.trim() && email.trim() && password.length >= 6 && passwordsMatch && !submitting,
        [name, email, password, passwordsMatch, submitting]
    );

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setSubmitting(true);

        try {
            const res = await api.post('/api/users/register', { name: name.trim(), email: email.trim(), password });
            localStorage.setItem('token', res.data.token);
            // Email verification is disabled for now. Re-enable this redirect when the feature returns.
            // navigate('/verify-email', {
            //     state: {
            //         email: email.trim(),
            //         devVerificationUrl: res.data.devVerificationUrl,
            //         message: res.data.message,
            //     },
            // });
            navigate('/dashboard');
        } catch (err) {
            setError(err?.response?.data?.message || 'Could not create that account.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="authSplit">
            <section className="authPane">
                <div className="authBrand">
                    <img src="/assets/omega-tracker-logo.png" alt="" aria-hidden="true" />
                    <strong>Omega.</strong>
                </div>
                <form className="magloAuthForm" onSubmit={handleSubmit}>
                    <div>
                        <h1>Create new account</h1>
                        <p>Create your workspace and start tracking your money.</p>
                    </div>
                    {error ? <div className="authError" role="alert">{error}</div> : null}
                    <label>Full Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Mahfuzul Nabil" required /></label>
                    <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="example@gmail.com" required /></label>
                    <label>
                        Password
                        <span className="passwordShell">
                            <input type={showPassword ? 'text' : 'password'} minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="********" required />
                            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                            </button>
                        </span>
                    </label>
                    <label>
                        Confirm Password
                        <span className={passwordMismatch ? 'passwordShell mismatch' : 'passwordShell'}>
                            <input type={showConfirmPassword ? 'text' : 'password'} minLength={6} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="********" required />
                            <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>
                                <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                            </button>
                        </span>
                        {confirmPassword ? (
                            <small className={passwordsMatch ? 'passwordHint match' : 'passwordHint mismatch'}>
                                {passwordsMatch ? 'Passwords match.' : 'Passwords do not match.'}
                            </small>
                        ) : null}
                    </label>
                    <button className="authSubmit" type="submit" disabled={!canSubmit}>{submitting ? 'Creating...' : 'Create Account'}</button>
                    <p className="authLink">Already have an account? <Link to="/">Sign in</Link></p>
                </form>
            </section>
            <section className="authArt" aria-hidden="true">
                <div className="authVisual">
                    <img src="/assets/omega-tracker-logo.png" alt="" />
                    <div>
                        <span>New workspace</span>
                        <strong>Omega.</strong>
                    </div>
                    <div className="visualLine">
                        <i />
                        <i />
                        <i />
                        <i />
                    </div>
                    <small>Build a clean view of income, spending, invoices, and savings.</small>
                </div>
            </section>
        </div>
    );
}

export default Register;

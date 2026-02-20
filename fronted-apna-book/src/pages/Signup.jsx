import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import './Signup.css';
import api from '../lib/api.js';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext.jsx';

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState(0);

  useEffect(() => {
    if (otpCooldownSeconds <= 0) return undefined;
    const timer = setInterval(() => {
      setOtpCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldownSeconds]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setSuccess('');
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const getPasswordStrength = (value) => {
    let score = 0;

    if (value.length >= 8) score += 1;
    if (value.length >= 12) score += 1;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;

    if (!value) {
      return { label: 'Add a password', percent: 0, tone: 'weak' };
    }
    if (score <= 2) {
      return { label: 'Weak', percent: 35, tone: 'weak' };
    }
    if (score === 3) {
      return { label: 'Fair', percent: 60, tone: 'fair' };
    }
    if (score === 4) {
      return { label: 'Good', percent: 80, tone: 'good' };
    }
    return { label: 'Strong', percent: 100, tone: 'strong' };
  };

  const validate = (mode = 'submit') => {
    const nextErrors = {};

    if (mode === 'otpRequest') {
      if (!formState.name.trim()) {
        nextErrors.name = 'Full name is required.';
      }

      if (!formState.email.trim()) {
        nextErrors.email = 'Email is required.';
      } else if (!/\S+@\S+\.\S+/.test(formState.email)) {
        nextErrors.email = 'Enter a valid email address.';
      }

      if (!formState.password.trim()) {
        nextErrors.password = 'Password is required.';
      } else if (formState.password.length < 6) {
        nextErrors.password = 'Password must be at least 6 characters.';
      }

      if (!formState.confirmPassword.trim()) {
        nextErrors.confirmPassword = 'Confirm your password.';
      } else if (formState.confirmPassword !== formState.password) {
        nextErrors.confirmPassword = 'Passwords do not match.';
      }

      setErrors(nextErrors);
      return Object.keys(nextErrors).length === 0;
    }

    if (!formState.name.trim()) {
      nextErrors.name = 'Full name is required.';
    }

    if (!formState.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formState.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!formState.password.trim()) {
      nextErrors.password = 'Password is required.';
    } else if (formState.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    if (!formState.confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Confirm your password.';
    } else if (formState.confirmPassword !== formState.password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!formState.otp.trim()) {
      nextErrors.otp = 'OTP is required.';
    } else if (!/^\d{6}$/.test(formState.otp.trim())) {
      nextErrors.otp = 'OTP must be 6 digits.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRequestOtp = async () => {
    const isValid = validate('otpRequest');
    if (!isValid || otpCooldownSeconds > 0) return;

    try {
      await api.post('/api/auth/request-otp', {
        fullName: formState.name.trim(),
        email: formState.email.trim(),
        password: formState.password
      });
      setOtpCooldownSeconds(5 * 60);
      setSuccess('OTP sent to your email. It is valid for 5 minutes.');
      setErrors((prev) => ({ ...prev, otp: '' }));
    } catch (error) {
      const retryAfterSeconds = Number(error?.data?.retryAfterSeconds || 0);
      if (retryAfterSeconds > 0) {
        setOtpCooldownSeconds(retryAfterSeconds);
      }
      setErrors((prev) => ({ ...prev, email: error.message }));
    }
  };

  const formatSeconds = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const isValid = validate('submit');
    if (isValid) {
      try {
        const result = await api.post('/api/auth/verify-otp', {
          email: formState.email.trim(),
          otp: formState.otp.trim()
        });
        login({ user: result.user, token: result.token });
        setSuccess('Account created and email verified successfully.');
        const destination = result.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
        navigate(destination, { replace: true });
      } catch (error) {
        setErrors((prev) => ({ ...prev, form: error.message }));
      }
    }
  };

  const strength = getPasswordStrength(formState.password);

  return (
    <div className="auth-page">
      <Navbar />
      <main className="auth-container">
        <section className="auth-card">
          <div className="auth-header">
            <img className="auth-logo" src={logo} alt="Pustakly logo" />
            <h1>Create your account</h1>
            <p>Join the Pustakly community and build your reading list.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {success && <div className="success-banner">{success}</div>}
            {errors.form && <div className="error-banner">{errors.form}</div>}
            <div className={`input-group ${errors.name ? 'invalid' : ''}`}>
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Asha Patel"
                value={formState.name}
                onChange={handleChange}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <span id="name-error" className="error-text">
                  {errors.name}
                </span>
              )}
            </div>

            <div className={`input-group ${errors.email ? 'invalid' : ''}`}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formState.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <span id="email-error" className="error-text">
                  {errors.email}
                </span>
              )}
            </div>

            <div className={`input-group ${errors.password ? 'invalid' : ''}`}>
              <label htmlFor="password">Password</label>
              <div className="input-with-button">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={formState.password}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="strength-meter">
                <div
                  className={`strength-bar ${strength.tone}`}
                  style={{ width: `${strength.percent}%` }}
                ></div>
              </div>
              <span className="strength-label">Strength: {strength.label}</span>
              {errors.password && (
                <span id="password-error" className="error-text">
                  {errors.password}
                </span>
              )}
            </div>

            <div className={`input-group ${errors.confirmPassword ? 'invalid' : ''}`}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-with-button">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={formState.confirmPassword}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.confirmPassword && (
                <span id="confirm-password-error" className="error-text">
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            <div className={`input-group ${errors.otp ? 'invalid' : ''}`}>
              <label htmlFor="otp">Email OTP</label>
              <div className="otp-row">
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={formState.otp}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.otp)}
                  aria-describedby={errors.otp ? 'otp-error' : undefined}
                />
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleRequestOtp}
                  disabled={otpCooldownSeconds > 0}
                >
                  {otpCooldownSeconds > 0
                    ? `Request again in ${formatSeconds(otpCooldownSeconds)}`
                    : 'Request OTP'}
                </button>
              </div>
              {errors.otp && (
                <span id="otp-error" className="error-text">
                  {errors.otp}
                </span>
              )}
            </div>

            <label className="checkbox">
              <input type="checkbox" />
              I agree to the Terms and Privacy Policy
            </label>

            <button className="primary-btn" type="submit">
              Create account
            </button>
          </form>

          <div className="auth-footer">
            <span>Already have an account?</span>
            <Link to="/login">Log in</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

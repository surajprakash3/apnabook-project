import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import './Login.css';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../lib/api.js';
import logo from '../assets/logo.png';

export default function Login() {
  const [formState, setFormState] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const savedEmail = localStorage.getItem('apnabook_remember_email');
    if (savedEmail) {
      setFormState((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setSuccess('');
  };

  const handleRememberChange = (event) => {
    setRememberMe(event.target.checked);
  };

  const validate = () => {
    const nextErrors = {};

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

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const isValid = validate();

    if (isValid) {
      try {
        const email = formState.email.trim();
        const password = formState.password;
        const result = await api.post('/api/auth/login', { email, password });

        setSuccess('Login successful. Welcome back!');
        login({ user: result.user, token: result.token });
        if (rememberMe) {
          localStorage.setItem('apnabook_remember_email', formState.email.trim());
        } else {
          localStorage.removeItem('apnabook_remember_email');
        }

        const fallback = result.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
        const destination = location.state?.from?.pathname || fallback;
        navigate(destination, { replace: true });
      } catch (error) {
        setErrors((prev) => ({ ...prev, form: error.message }));
        setSuccess('');
      }
    }
  };

  return (
    <div className="auth-page">
      <Navbar />
      <main className="auth-container">
        <section className="auth-card">
          <div className="auth-header">
            <img className="auth-logo" src={logo} alt="Pustakly logo" />
            <h1>Welcome back</h1>
            <p>Log in to track orders and keep your library synced.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {success && <div className="success-banner">{success}</div>}
            {errors.form && <div className="error-banner">{errors.form}</div>}
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
                  placeholder="Enter your password"
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
              {errors.password && (
                <span id="password-error" className="error-text">
                  {errors.password}
                </span>
              )}
            </div>

            <div className="form-row">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={handleRememberChange}
                />
                Remember me
              </label>
              <button type="button" className="link-btn">
                Forgot password?
              </button>
            </div>

            <button className="primary-btn" type="submit">
              Log in
            </button>
          </form>

          <div className="auth-footer">
            <Link to="/" className="ghost-btn">
              Back to Home
            </Link>
          </div>

          <div className="auth-footer">
            <span>New here?</span>
            <Link to="/signup">Create an account</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

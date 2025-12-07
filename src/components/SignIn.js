import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Mail, Lock, Sun, Moon, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import quranApi from '../services/quranApi';

const SignIn = ({ setCurrentPath, onGuestMode }) => {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  React.useEffect(() => {
    setCurrentPath('/signin');
  }, [setCurrentPath]);

  const validateEmail = (emailValue) => {
    if (!emailValue.trim()) {
      return 'Email is required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (passwordValue) => {
    if (!passwordValue) {
      return 'Password is required';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');

    // Validate inputs
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    if (emailErr) {
      setEmailError(emailErr);
      return;
    }

    if (passwordErr) {
      setPasswordError(passwordErr);
      return;
    }

    setLoading(true);

    try {
      const result = await signIn(email.trim(), password);
      if (result.needsOnboarding) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) {
      setEmailError('');
    }
    if (error) {
      setError('');
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (passwordError) {
      setPasswordError('');
    }
    if (error) {
      setError('');
    }
  };

  const handleGuestMode = () => {
    if (onGuestMode) {
      onGuestMode();
      navigate('/dashboard');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google.');
    }
  };

  return (
    <div className="auth-page">
      <header className="auth-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
        </button>
        <div className="auth-logo">
          <span className="arabic-logo">تحفيظ</span>
          <span className="english-logo">Tahfidh</span>
        </div>
        <button className="theme-toggle" onClick={toggleTheme}>
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <div className="auth-container">
        <div className="auth-card">
          <div className="bismillah-section">
            <div className="bismillah arabic uthmani">﷽</div>
          </div>
          
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to continue your memorization journey</p>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <Mail size={20} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                  className={emailError ? 'input-error' : ''}
                />
              </div>
              {emailError && <span className="field-error">{emailError}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock size={20} className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className={passwordError ? 'input-error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {passwordError && <span className="field-error">{passwordError}</span>}
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button 
            type="button" 
            className="btn btn-google" 
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/signup" className="auth-link">Sign up</Link>
            </p>
          </div>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button 
            type="button" 
            className="btn btn-secondary auth-guest-btn" 
            onClick={handleGuestMode}
            disabled={loading}
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;


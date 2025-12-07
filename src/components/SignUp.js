import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Mail, Lock, User, Sun, Moon, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const SignUp = ({ setCurrentPath, onGuestMode }) => {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  React.useEffect(() => {
    setCurrentPath('/signup');
  }, [setCurrentPath]);

  const validateName = (nameValue) => {
    if (!nameValue.trim()) {
      return 'Name is required';
    }
    if (nameValue.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    return '';
  };

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
    if (passwordValue.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  const validateConfirmPassword = (confirmPasswordValue, passwordValue) => {
    if (!confirmPasswordValue) {
      return 'Please confirm your password';
    }
    if (confirmPasswordValue !== passwordValue) {
      return 'Passwords do not match';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Validate all inputs
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmPasswordErr = validateConfirmPassword(confirmPassword, password);

    if (nameErr) {
      setNameError(nameErr);
      return;
    }

    if (emailErr) {
      setEmailError(emailErr);
      return;
    }

    if (passwordErr) {
      setPasswordError(passwordErr);
      return;
    }

    if (confirmPasswordErr) {
      setConfirmPasswordError(confirmPasswordErr);
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(email.trim(), password, name.trim());
      if (result.needsOnboarding) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (nameError) {
      setNameError('');
    }
    if (error) {
      setError('');
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
    if (confirmPasswordError && confirmPassword) {
      // Re-validate confirm password if it's already filled
      const confirmErr = validateConfirmPassword(confirmPassword, e.target.value);
      setConfirmPasswordError(confirmErr);
    }
    if (error) {
      setError('');
    }
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (confirmPasswordError) {
      setConfirmPasswordError('');
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

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Failed to sign up with Google.');
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
          
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Start your memorization journey today</p>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <div className="input-wrapper">
                <User size={20} className="input-icon" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="Enter your name"
                  required
                  disabled={loading}
                  className={nameError ? 'input-error' : ''}
                />
              </div>
              {nameError && <span className="field-error">{nameError}</span>}
            </div>

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
                  placeholder="Create a password (min. 6 characters)"
                  required
                  disabled={loading}
                  minLength={6}
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

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <Lock size={20} className="input-icon" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder="Confirm your password"
                  required
                  disabled={loading}
                  minLength={6}
                  className={confirmPasswordError ? 'input-error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {confirmPasswordError && <span className="field-error">{confirmPasswordError}</span>}
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button 
            type="button" 
            className="btn btn-google" 
            onClick={handleGoogleSignUp}
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
              Already have an account?{' '}
              <Link to="/signin" className="auth-link">Sign in</Link>
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

export default SignUp;


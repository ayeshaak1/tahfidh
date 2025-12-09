import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Mail, Lock, User, Sun, Moon, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const Auth = ({ setCurrentPath, onGuestMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, signInWithGoogle, signOut } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  
  // Determine initial mode from URL
  const [activeMode, setActiveMode] = useState(location.pathname === '/signup' ? 'signup' : 'signin');
  
  // Sign In state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signInError, setSignInError] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Sign Up state
  const [name, setName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signUpError, setSignUpError] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [signUpEmailError, setSignUpEmailError] = useState('');
  const [signUpPasswordError, setSignUpPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  useEffect(() => {
    const path = location.pathname;
    if (path === '/signup') {
      setCurrentPath('/signup');
      setActiveMode('signup');
    } else {
      setCurrentPath('/signin');
      setActiveMode('signin');
    }
  }, [location.pathname, setCurrentPath]);

  // Validation functions
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

  const validateName = (nameValue) => {
    if (!nameValue.trim()) {
      return 'Name is required';
    }
    if (nameValue.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    return '';
  };

  const validateSignUpPassword = (passwordValue) => {
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

  // Attempt sign in with optional single retry on 429 (rate limit)
  const attemptSignIn = async (allowRetry = true) => {
    try {
      const result = await signIn(email.trim(), password);
      if (result.needsOnboarding) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.message || 'Failed to sign in. Please check your credentials.';
      // If rate-limited, clear auth and retry once automatically
      if (allowRetry && msg.toLowerCase().includes('too many')) {
        try {
          await signOut();
        } catch (logoutErr) {
          console.warn('Failed to clear auth after 429:', logoutErr);
        }
        return attemptSignIn(false);
      }
      throw err;
    }
  };

  // Sign In handlers
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setSignInError('');
    setEmailError('');
    setPasswordError('');

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

    setSignInLoading(true);

    try {
      await attemptSignIn(true);
    } catch (err) {
      setSignInError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setSignInLoading(false);
    }
  };

  // Sign Up handlers
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setSignUpError('');
    setNameError('');
    setSignUpEmailError('');
    setSignUpPasswordError('');
    setConfirmPasswordError('');

    const nameErr = validateName(name);
    const emailErr = validateEmail(signUpEmail);
    const passwordErr = validateSignUpPassword(signUpPassword);
    const confirmPasswordErr = validateConfirmPassword(confirmPassword, signUpPassword);

    if (nameErr) {
      setNameError(nameErr);
      return;
    }
    if (emailErr) {
      setSignUpEmailError(emailErr);
      return;
    }
    if (passwordErr) {
      setSignUpPasswordError(passwordErr);
      return;
    }
    if (confirmPasswordErr) {
      setConfirmPasswordError(confirmPasswordErr);
      return;
    }

    setSignUpLoading(true);

    try {
      // DO NOT transfer guest data automatically - user must export and import manually
      const result = await signUp(signUpEmail.trim(), signUpPassword, name.trim());
      
      if (result.needsOnboarding) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setSignUpError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setSignUpLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      if (activeMode === 'signin') {
        setSignInError(err.message || 'Failed to sign in with Google.');
      } else {
        setSignUpError(err.message || 'Failed to sign up with Google.');
      }
    }
  };

  const handleGuestMode = () => {
    if (onGuestMode) {
      onGuestMode();
      navigate('/dashboard');
    }
  };

  const switchMode = (mode) => {
    setActiveMode(mode);
    // Clear errors when switching
    setSignInError('');
    setSignUpError('');
    // Update URL without navigation
    navigate(mode === 'signup' ? '/signup' : '/signin', { replace: true });
  };

  const loading = signInLoading || signUpLoading;

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
        <div className="auth-card-split">
          {/* Sign In Side */}
          <div className={`auth-side auth-side-signin ${activeMode === 'signin' ? 'active' : ''}`}>
            {activeMode === 'signin' ? (
              <div className="auth-side-content">
                <div className="bismillah-section">
                  <div className="bismillah arabic uthmani">﷽</div>
                </div>
                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">Sign in to continue your memorization journey</p>

                {signInError && (
                  <div className="auth-error">
                    {signInError}
                  </div>
                )}

                <form onSubmit={handleSignInSubmit} className="auth-form" noValidate>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <div className="input-wrapper">
                      <Mail size={20} className="input-icon" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailError) setEmailError('');
                          if (signInError) setSignInError('');
                        }}
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
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (passwordError) setPasswordError('');
                          if (signInError) setSignInError('');
                        }}
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
                  onClick={handleGoogleAuth}
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
            ) : (
              <div className="auth-side-cta" onClick={() => switchMode('signin')}>
                <h2 className="auth-cta-title">Welcome Back</h2>
                <p className="auth-cta-text">Sign in to access your memorization progress and continue your journey</p>
                <button 
                  type="button" 
                  className="btn btn-cta"
                  onClick={(e) => {
                    e.stopPropagation();
                    switchMode('signin');
                  }}
                  disabled={loading}
                >
                  Sign In
                </button>
              </div>
            )}
          </div>

          {/* Sign Up Side */}
          <div className={`auth-side auth-side-signup ${activeMode === 'signup' ? 'active' : ''}`}>
            {activeMode === 'signup' ? (
              <div className="auth-side-content">
                <div className="bismillah-section">
                  <div className="bismillah arabic uthmani">﷽</div>
                </div>
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Start your memorization journey today</p>

                {signUpError && (
                  <div className="auth-error">
                    {signUpError}
                  </div>
                )}

                <form onSubmit={handleSignUpSubmit} className="auth-form" noValidate>
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <div className="input-wrapper">
                      <User size={20} className="input-icon" />
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (nameError) setNameError('');
                          if (signUpError) setSignUpError('');
                        }}
                        placeholder="Enter your name"
                        required
                        disabled={loading}
                        className={nameError ? 'input-error' : ''}
                      />
                    </div>
                    {nameError && <span className="field-error">{nameError}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="signUpEmail">Email</label>
                    <div className="input-wrapper">
                      <Mail size={20} className="input-icon" />
                      <input
                        id="signUpEmail"
                        type="email"
                        value={signUpEmail}
                        onChange={(e) => {
                          setSignUpEmail(e.target.value);
                          if (signUpEmailError) setSignUpEmailError('');
                          if (signUpError) setSignUpError('');
                        }}
                        placeholder="Enter your email"
                        required
                        disabled={loading}
                        className={signUpEmailError ? 'input-error' : ''}
                      />
                    </div>
                    {signUpEmailError && <span className="field-error">{signUpEmailError}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="signUpPassword">Password</label>
                    <div className="input-wrapper">
                      <Lock size={20} className="input-icon" />
                      <input
                        id="signUpPassword"
                        type={showSignUpPassword ? 'text' : 'password'}
                        value={signUpPassword}
                        onChange={(e) => {
                          setSignUpPassword(e.target.value);
                          if (signUpPasswordError) setSignUpPasswordError('');
                          if (confirmPasswordError && confirmPassword) {
                            const confirmErr = validateConfirmPassword(confirmPassword, e.target.value);
                            setConfirmPasswordError(confirmErr);
                          }
                          if (signUpError) setSignUpError('');
                        }}
                        placeholder="Create a password (min. 6 characters)"
                        required
                        disabled={loading}
                        minLength={6}
                        className={signUpPasswordError ? 'input-error' : ''}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        disabled={loading}
                        tabIndex={-1}
                      >
                        {showSignUpPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {signUpPasswordError && <span className="field-error">{signUpPasswordError}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <div className="input-wrapper">
                      <Lock size={20} className="input-icon" />
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (confirmPasswordError) setConfirmPasswordError('');
                          if (signUpError) setSignUpError('');
                        }}
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
                  onClick={handleGoogleAuth}
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
            ) : (
              <div className="auth-side-cta" onClick={() => switchMode('signup')}>
                <h2 className="auth-cta-title">Create Account</h2>
                <p className="auth-cta-text">Join us to begin tracking your Quran memorization progress</p>
                <button 
                  type="button" 
                  className="btn btn-cta"
                  onClick={(e) => {
                    e.stopPropagation();
                    switchMode('signup');
                  }}
                  disabled={loading}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;


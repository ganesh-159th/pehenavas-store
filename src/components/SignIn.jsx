import React, { useState, useEffect } from 'react';
import { useUser } from '../hooks/useUser';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useFadeIn } from '../hooks/useFadeIn';
import { showAlert } from '../utils/alert';
function tryFirebaseSignIn(email, password) {
  import('../firebase').then(({ auth }) => {
    if (!auth) return;
    import('firebase/auth').then(({ signInWithEmailAndPassword }) => {
      signInWithEmailAndPassword(auth, email, password).catch(() => {});
    }).catch(() => {});
  }).catch(() => {});
}

const RoyalLotus = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s-8-4.5-8-11.8A6 6 0 0 1 10 4.3" />
    <path d="M12 22s8-4.5 8-11.8A6 6 0 0 0 14 4.3" />
    <path d="M12 22V12" />
    <path d="M12 12a3 3 0 0 1-3-3 3 3 0 0 1 6 0 3 3 0 0 1-3 3z" />
    <path d="M12 2c-.8 0-1.5.7-1.5 1.5S11.2 5 12 5s1.5-.7 1.5-1.5S12.8 2 12 2z" />
  </svg>
);

const SignIn = () => {
  const { login } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const isVisible = useFadeIn();

  useEffect(() => {
    if (location.state?.message) {
      showAlert(location.state.message, 'warning');
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.message]);

  const validate = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else {
      const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
      if (!strongRegex.test(password)) {
        newErrors.password = 'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    if (!validate()) {
      showAlert('Please fix the form errors before signing in.', 'warning');
      return;
    }

    tryFirebaseSignIn(email, password);

    const userName = email.split('@')[0];
    login({ name: userName.charAt(0).toUpperCase() + userName.slice(1) });
    showAlert('Signed in successfully! Welcome back.', 'success');
    const from = location.state?.from || '/';
    navigate(from, { replace: true });
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetError('');

    if (!resetEmail) {
      setResetError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setResetError('Please enter a valid email address.');
      return;
    }

    setResetLoading(true);
    try {
      const { auth } = await import('../firebase');
      if (!auth) throw new Error('Firebase not initialized');
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
      showAlert('Password reset email sent! Check your inbox.', 'success');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setResetError('No account found with this email.');
      } else if (err.code === 'auth/too-many-requests') {
        setResetError('Too many attempts. Please try again later.');
      } else {
        setResetError('Failed to send reset email. Please try again.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf6f0] to-amber-50 flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className={`w-full max-w-md transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        {/* Logo and Branding Section */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
            <div className="bg-rose-950 p-3 rounded-full border-2 border-amber-500 group-hover:scale-110 transition-transform">
              <RoyalLotus className="w-8 h-8 text-amber-400" />
            </div>
            <div className="flex flex-col text-left">
              <h1 className="text-2xl font-bold tracking-widest font-serif text-rose-950 leading-none">
                PEHENAVAS
              </h1>
              <span className="text-xs text-amber-600 tracking-[0.2em] font-sans uppercase opacity-90">The Royal Heritage</span>
            </div>
          </Link>
          <p className="text-gray-600 mt-6 text-sm">Sign in to access your account</p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-amber-100">
          {/* Decorative top border */}
          <div className="h-1 bg-gradient-to-r from-rose-950 via-amber-500 to-rose-950"></div>
          
          <div className="p-8">
            
            <h2 className="text-xl font-bold text-rose-950 mb-6">
              {forgotPassword ? 'Reset Password' : 'Welcome Back'}
            </h2>

            {forgotPassword ? (
              <>
                {resetSent ? (
                  <div className="text-center space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 text-sm font-medium">
                        Reset link sent to <strong>{resetEmail}</strong>
                      </p>
                      <p className="text-green-700 text-xs mt-1">
                        Check your inbox and follow the instructions to reset your password.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotPassword(false);
                        setResetSent(false);
                        setResetEmail('');
                        setResetError('');
                      }}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-950 to-rose-900 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <form className="space-y-5" onSubmit={handleForgotPassword}>
                    <p className="text-sm text-gray-600">
                      Enter your email address and we'll send you a link to reset your password.
                    </p>
                    <div>
                      <label htmlFor="reset-email" className="block text-sm font-semibold text-gray-700 mb-2">
                        Email address
                      </label>
                      <input
                        id="reset-email"
                        name="reset-email"
                        type="email"
                        autoComplete="email"
                        className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none ${resetError ? 'border-rose-500 bg-rose-50' : 'border-gray-200'}`}
                        value={resetEmail}
                        onChange={(e) => {
                          setResetEmail(e.target.value);
                          if (resetError) setResetError('');
                        }}
                        placeholder="you@example.com"
                      />
                      {resetError && (
                        <div className="flex items-start gap-2 mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-md shadow-sm">
                          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                          <p className="text-rose-800 text-xs font-medium leading-tight">{resetError}</p>
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-950 to-rose-900 text-white font-semibold rounded-lg hover:shadow-lg hover:from-rose-900 hover:to-rose-800 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {resetLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotPassword(false);
                        setResetSent(false);
                        setResetEmail('');
                        setResetError('');
                      }}
                      className="w-full py-2.5 px-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </>
            ) : (
            <form className="space-y-5" onSubmit={handleSignIn}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none ${errors.email ? 'border-rose-500 bg-rose-50' : 'border-gray-200'}`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  placeholder="you@example.com"
                />
              {errors.email && (
                <div className="flex items-start gap-2 mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-md shadow-sm">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <p className="text-rose-800 text-xs font-medium leading-tight">{errors.email}</p>
                </div>
              )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className={`w-full px-4 py-2.5 pr-12 border-2 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none ${errors.password ? 'border-rose-500 bg-rose-50' : 'border-gray-200'}`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: null });
                    }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-500 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              {errors.password && (
                <div className="flex items-start gap-2 mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-md shadow-sm">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <p className="text-rose-800 text-xs font-medium leading-tight">{errors.password}</p>
                </div>
              )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setForgotPassword(true);
                    setResetEmail(email);
                    setResetSent(false);
                    setResetError('');
                  }}
                  className="text-sm text-amber-600 hover:text-rose-950 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-950 to-rose-900 text-white font-semibold rounded-lg hover:shadow-lg hover:from-rose-900 hover:to-rose-800 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                Sign In
              </button>
            </form>
            )}

            {!forgotPassword && (
              <>
            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                navigate('/');
              }}
              className="w-full mt-6 py-2.5 px-4 border-2 border-amber-400 text-rose-950 font-semibold rounded-lg hover:bg-amber-50 transition-all"
            >
              Continue as Guest
            </button>
              </>
            )}
          </div>

          {/* Footer text */}
          <div className="px-8 py-4 bg-gradient-to-r from-rose-50 to-amber-50 border-t border-amber-100">
            <p className="text-center text-xs text-gray-600">
              New to Pehenavas?{' '}
              <Link to="/signup" className="font-semibold text-amber-600 hover:text-rose-950 transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;

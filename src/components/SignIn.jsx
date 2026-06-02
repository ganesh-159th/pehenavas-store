import React, { useState, useEffect } from 'react';
import { useUser } from '../hooks/useUser';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Loader2, Mail, ArrowLeft, X } from 'lucide-react';
import { useFadeIn } from '../hooks/useFadeIn';
import { showAlert } from '../utils/alert';

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
  const { login, resetPassword } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showAlert('Please fix the form errors before signing in.', 'warning');
      return;
    }
    try {
      await login(email, password);
      showAlert('Signed in successfully! Welcome back.', 'success');
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential'
        ? 'Invalid email or password.'
        : err.code === 'auth/too-many-requests'
          ? 'Too many attempts. Please try again later.'
          : err.message || 'Sign in failed. Please try again.';
      setErrors({ form: msg });
      showAlert(msg, 'danger');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      showAlert('Please enter your email address.', 'warning');
      return;
    }
    setResetting(true);
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
      showAlert('Password reset email sent! Check your inbox.', 'success');
    } catch (err) {
      const msg = err.code === 'auth/user-not-found'
        ? 'No account found with this email.'
        : err.code === 'auth/too-many-requests'
          ? 'Too many requests. Please try again later.'
          : err.code === 'auth/invalid-email'
            ? 'Please enter a valid email address.'
            : err.message || 'Failed to send reset email.';
      showAlert(msg, 'danger');
    } finally {
      setResetting(false);
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
            
            <h2 className="text-xl font-bold text-rose-950 mb-6">Welcome Back</h2>
            
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
                  onClick={() => setShowResetModal(true)}
                  className="text-sm font-bold text-amber-600 hover:text-amber-500 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {errors.form && (
                <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-300 rounded-lg shadow-sm">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <p className="text-rose-800 text-sm font-medium leading-tight">{errors.form}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-950 to-rose-900 text-white font-semibold rounded-lg hover:shadow-lg hover:from-rose-900 hover:to-rose-800 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                Sign In
              </button>
            </form>

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

      {/* Forgot Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-amber-100">
            <div className="h-1 bg-gradient-to-r from-rose-950 via-amber-500 to-rose-950"></div>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-rose-950">Reset Password</h2>
                <button
                  type="button"
                  onClick={() => { setShowResetModal(false); setResetSent(false); setResetEmail(''); }}
                  className="text-gray-400 hover:text-rose-950 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!resetSent ? (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <p className="text-sm text-gray-600">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  <div>
                    <label htmlFor="reset-email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email address
                    </label>
                    <input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resetting}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-950 to-rose-900 text-white font-semibold rounded-lg hover:shadow-lg hover:from-rose-900 hover:to-rose-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {resetting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Send Reset Link
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Mail className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-gray-700 text-sm">
                    Check your inbox at <strong>{resetEmail}</strong> for the password reset link.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setShowResetModal(false); setResetSent(false); setResetEmail(''); }}
                    className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-500 font-semibold text-sm transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignIn;

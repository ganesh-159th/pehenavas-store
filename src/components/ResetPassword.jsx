import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
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

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isVisible = useFadeIn();

  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [initError, setInitError] = useState('');

  useEffect(() => {
    if (!oobCode || mode !== 'resetPassword') {
      const timer = setTimeout(() => {
        setInitError('Invalid or expired reset link. Please request a new one.');
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    let cancelled = false;
    import('../firebase').then(({ auth }) => {
      if (!auth || cancelled) return;
      import('firebase/auth').then(({ verifyPasswordResetCode }) => {
        verifyPasswordResetCode(auth, oobCode)
          .then((userEmail) => {
            if (cancelled) return;
            setEmail(userEmail);
            setVerified(true);
            setLoading(false);
          })
          .catch(() => {
            if (cancelled) return;
            setInitError('This reset link has expired or is invalid. Please request a new one.');
            setLoading(false);
          });
      }).catch(() => {
        if (!cancelled) {
          setInitError('Failed to verify reset link.');
          setLoading(false);
        }
      });
    }).catch(() => {
      if (!cancelled) {
        setInitError('Firebase not initialized.');
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [oobCode, mode]);

  const validate = () => {
    const newErrors = {};
    if (!newPassword) {
      newErrors.newPassword = 'New password is required.';
    } else {
      const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
      if (!strongRegex.test(newPassword)) {
        newErrors.newPassword = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.';
      }
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { auth } = await import('../firebase');
      const { confirmPasswordReset } = await import('firebase/auth');
      await confirmPasswordReset(auth, oobCode, newPassword);
      setResetComplete(true);
      showAlert('Password reset successful! You can now sign in.', 'success');
    } catch {
      setErrors({ newPassword: 'Failed to reset password. The link may have expired.' });
    } finally {
      setSubmitting(false);
    }
  };

  const passwordStrength = (pw) => {
    if (!pw) return { width: 0, color: '', label: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[!@#$%^&*]/.test(pw)) score++;
    if (pw.length >= 12) score++;

    const levels = [
      { width: 0, color: '', label: '' },
      { width: 20, color: 'bg-red-500', label: 'Very Weak' },
      { width: 40, color: 'bg-orange-500', label: 'Weak' },
      { width: 60, color: 'bg-yellow-500', label: 'Fair' },
      { width: 80, color: 'bg-lime-500', label: 'Strong' },
      { width: 100, color: 'bg-green-500', label: 'Very Strong' },
    ];
    return levels[score] || levels[0];
  };

  const strength = passwordStrength(newPassword);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf6f0] to-amber-50 flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className={`w-full max-w-md transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
            <div className="bg-rose-950 p-3 rounded-full border-2 border-amber-500 group-hover:scale-110 transition-transform">
              <RoyalLotus className="w-8 h-8 text-amber-400" />
            </div>
            <div className="flex flex-col text-left">
              <h1 className="text-2xl font-bold tracking-widest font-serif text-rose-950 leading-none">PEHENAVAS</h1>
              <span className="text-xs text-amber-600 tracking-[0.2em] font-sans uppercase opacity-90">The Royal Heritage</span>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-amber-100">
          <div className="h-1 bg-gradient-to-r from-rose-950 via-amber-500 to-rose-950"></div>

          <div className="p-8">

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 text-sm">Verifying your reset link...</p>
              </div>
            )}

            {/* Init Error */}
            {!loading && initError && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-rose-950">Link Invalid</h2>
                <p className="text-gray-600 text-sm">{initError}</p>
                <Link
                  to="/signin"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-rose-950 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            )}

            {/* Reset Complete */}
            {!loading && resetComplete && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-rose-950">Password Reset!</h2>
                <p className="text-gray-600 text-sm">
                  Your password has been updated successfully.
                </p>
                <button
                  onClick={() => navigate('/signin')}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-950 to-rose-900 text-white font-semibold rounded-lg hover:shadow-lg hover:from-rose-900 hover:to-rose-800 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                >
                  Sign In Now
                </button>
              </div>
            )}

            {/* Reset Form */}
            {!loading && verified && !resetComplete && (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-rose-950 mb-1">Create New Password</h2>
                  <p className="text-gray-500 text-sm">
                    Setting new password for <strong className="text-gray-700">{email}</strong>
                  </p>
                </div>

                <form className="space-y-5" onSubmit={handleReset}>
                  <div>
                    <label htmlFor="new-password" className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        className={`w-full px-4 py-2.5 pr-12 border-2 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none ${errors.newPassword ? 'border-rose-500 bg-rose-50' : 'border-gray-200'}`}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (errors.newPassword) setErrors({ ...errors, newPassword: null });
                        }}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-500 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {newPassword && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${strength.color}`}
                            style={{ width: `${strength.width}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{strength.label}</p>
                      </div>
                    )}
                    {errors.newPassword && (
                      <div className="flex items-start gap-2 mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-md shadow-sm">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                        <p className="text-rose-800 text-xs font-medium leading-tight">{errors.newPassword}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                    <div className="relative">
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        className={`w-full px-4 py-2.5 pr-12 border-2 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all outline-none ${errors.confirmPassword ? 'border-rose-500 bg-rose-50' : 'border-gray-200'}`}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                        }}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-500 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {confirmPassword && newPassword === confirmPassword && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Passwords match
                      </p>
                    )}
                    {errors.confirmPassword && (
                      <div className="flex items-start gap-2 mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-md shadow-sm">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                        <p className="text-rose-800 text-xs font-medium leading-tight">{errors.confirmPassword}</p>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-950 to-rose-900 text-white font-semibold rounded-lg hover:shadow-lg hover:from-rose-900 hover:to-rose-800 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {submitting ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Footer */}
          {!loading && !resetComplete && (
            <div className="px-8 py-4 bg-gradient-to-r from-rose-50 to-amber-50 border-t border-amber-100">
              <p className="text-center text-xs text-gray-600">
                <Link to="/signin" className="font-semibold text-amber-600 hover:text-rose-950 transition-colors inline-flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  Back to Sign In
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

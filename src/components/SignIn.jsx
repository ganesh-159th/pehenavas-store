import React, { useState } from 'react';
import { useUser } from '../hooks/useUser';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useFadeIn } from '../hooks/useFadeIn';

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
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const isVisible = useFadeIn();

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

    if (!agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms and conditions to sign in.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    if (validate()) {
      const userName = email.split('@')[0];
      login({ name: userName.charAt(0).toUpperCase() + userName.slice(1) });
      navigate('/');
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
            {location.state?.message && (
              <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-amber-800 text-sm font-medium">{location.state.message}</p>
              </div>
            )}
            
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

              <div className="flex flex-col">
                <div className="flex items-center">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (errors.agreeTerms) setErrors({ ...errors, agreeTerms: null });
                    }}
                    className="w-4 h-4 border-gray-300 rounded cursor-pointer accent-amber-500"
                  />
                  <label htmlFor="terms" className="ml-2 text-sm text-gray-600 cursor-pointer">
                    I agree to the <Link to="/terms" className="text-amber-600 hover:underline" target="_blank">Terms and Conditions</Link>
                  </label>
                </div>
                {errors.agreeTerms && (
                  <div className="flex items-start gap-2 mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-md shadow-sm">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <p className="text-rose-800 text-xs font-medium leading-tight">{errors.agreeTerms}</p>
                  </div>
                )}
              </div>

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
    </div>
  );
};

export default SignIn;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Store, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { useUser } from '../hooks/useUser';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const { login } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf6f0] flex flex-col justify-center items-center relative overflow-hidden font-sans selection:bg-amber-200 text-gray-900">

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-rose-900/10 blur-[100px]"></div>
      </div>

      <div className={`relative z-10 w-full max-w-md px-4 sm:px-0 transition-all duration-700 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        <div className="bg-white p-8 sm:p-10 shadow-xl rounded-2xl border border-rose-100">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex justify-center items-center w-16 h-16 bg-rose-950 rounded-2xl shadow-lg mb-5 text-amber-400 border-2 border-amber-400/20">
              <Store className="w-8 h-8" strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-bold text-rose-950 font-serif">
              Admin Portal
            </h2>
            <p className="mt-2 text-rose-900/60 font-medium text-sm">
              Sign in to manage Pehenavas Store
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium flex items-center justify-center border border-red-100">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-bold text-rose-950">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-amber-500 transition-colors">
                  <Mail className="h-5 w-5" strokeWidth={2} />
                </div>
                <input
                  type="email"
                  id="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 sm:text-sm border-2 border-gray-200 rounded-xl bg-white hover:border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all duration-200 font-medium text-gray-900 placeholder-gray-400 shadow-sm"
                  placeholder="Enter your admin email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-sm font-bold text-rose-950">Password</label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-amber-500 transition-colors">
                  <Lock className="h-5 w-5" strokeWidth={2} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 sm:text-sm border-2 border-gray-200 rounded-xl bg-white hover:border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all duration-200 font-medium text-gray-900 placeholder-gray-400 shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-rose-950 focus:outline-none transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" strokeWidth={2} />
                  ) : (
                    <Eye className="h-5 w-5" strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-end pt-1">
              <div className="text-sm">
                <a href="#" className="font-bold text-amber-600 hover:text-amber-500 transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 mt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-rose-950 bg-amber-500 hover:bg-amber-400 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 disabled:opacity-70 disabled:hover:transform-none disabled:hover:shadow-md overflow-hidden uppercase tracking-wider"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-rose-950" />
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4 ml-2 text-rose-950 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Bottom Text */}
        <div className="mt-8 text-center">
          <p className="text-xs font-bold text-rose-900/40 uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Pehenavas Admin.
          </p>
        </div>
      </div>
    </div>
  );
}

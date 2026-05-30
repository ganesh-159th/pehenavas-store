import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Smartphone, ShieldCheck, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { showAlert } from '../utils/alert';
import { useUser } from '../hooks/useUser';

const MfaSetup = () => {
  const { user, loading } = useUser();
  const navigate = useNavigate();
  const [step, setStep] = useState('start');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/signin', { state: { message: 'Please sign in to enable MFA.' } });
    }
  }, [user, loading, navigate]);

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Enter a valid phone number with country code (e.g., +919876543210)');
      return;
    }
    setError('');
    setSending(true);
    try {
      const { sendMfaEnrollmentCode } = await import('../services/auth');
      const result = await sendMfaEnrollmentCode(phoneNumber);
      setVerificationId(result.verificationId);
      setStep('verify');
      showAlert('OTP sent to your phone!', 'success');
    } catch (err) {
      setError(err.message || 'Failed to send code. Make sure Phone Auth + MFA is enabled in Firebase Console.');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length < 6) {
      setError('Enter the 6-digit code sent to your phone');
      return;
    }
    setError('');
    setVerifying(true);
    try {
      const { verifyMfaEnrollmentCode } = await import('../services/auth');
      await verifyMfaEnrollmentCode(verificationId, verificationCode);
      setStep('done');
      showAlert('Two-factor authentication enabled!', 'success');
    } catch (err) {
      setError(err.message || 'Invalid code. Try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf6f0] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-950" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf6f0] to-amber-50 flex items-center justify-center px-4 py-12">
      <div id="mfa-recaptcha"></div>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-amber-100">
          <div className="h-1 bg-gradient-to-r from-rose-950 via-amber-500 to-rose-950"></div>
          <div className="p-8">
            <button onClick={() => navigate(-1)} className="text-rose-700 hover:text-rose-900 flex items-center text-sm mb-6">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="bg-amber-100 p-2 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-rose-950 font-serif">Two-Factor Auth</h2>
                <p className="text-sm text-gray-500">Protect your account with MFA</p>
              </div>
            </div>

            {step === 'start' && (
              <div className="space-y-5">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  <p className="font-medium">Enable two-factor authentication to add an extra layer of security.</p>
                  <p className="mt-1">You'll need to enter a code from your phone each time you sign in.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => { setPhoneNumber(e.target.value); setError(''); }}
                    placeholder="+919876543210"
                    className="w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 outline-none border-gray-200"
                  />
                  <p className="text-xs text-gray-500 mt-1">Include country code (India: +91XXXXXXXXXX)</p>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <p className="text-rose-800 text-xs">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleSendCode}
                  disabled={sending}
                  className="w-full py-2.5 bg-gradient-to-r from-rose-950 to-rose-900 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5" />}
                  {sending ? 'Sending code...' : 'Send Verification Code'}
                </button>
              </div>
            )}

            {step === 'verify' && (
              <div className="space-y-5">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                  <p className="font-medium">Enter the code sent to {phoneNumber}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Verification Code</label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => { setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-2.5 text-center text-2xl tracking-[0.5em] border-2 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 outline-none border-gray-200"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <p className="text-rose-800 text-xs">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleVerifyCode}
                  disabled={verifying || verificationCode.length < 6}
                  className="w-full py-2.5 bg-gradient-to-r from-rose-950 to-rose-900 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  {verifying ? 'Verifying...' : 'Enable Two-Factor Auth'}
                </button>

                <button onClick={() => setStep('start')} className="w-full text-sm text-gray-500 hover:text-rose-950 transition-colors">
                  Change phone number
                </button>
              </div>
            )}

            {step === 'done' && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-rose-950 font-serif">MFA Enabled!</h3>
                <p className="text-gray-600 text-sm">Your account is now protected with two-factor authentication.</p>
                <button
                  onClick={() => navigate('/account')}
                  className="w-full py-2.5 bg-gradient-to-r from-rose-950 to-rose-900 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Go to Account
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/terms" className="text-xs text-gray-500 hover:text-amber-600">Privacy & Security Policy</Link>
        </div>
      </div>
    </div>
  );
};

export default MfaSetup;

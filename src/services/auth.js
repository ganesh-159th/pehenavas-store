import {
  multiFactor,
  PhoneMultiFactorGenerator,
  PhoneAuthProvider,
  getMultiFactorResolver,
  RecaptchaVerifier,
} from 'firebase/auth';
import { auth } from './firebase';

let recaptchaVerifier = null;
let lastResolver = null;
let lastVerificationId = null;

export function getRecaptcha() {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, 'mfa-recaptcha', {
      size: 'invisible',
    });
  }
  return recaptchaVerifier;
}

export function clearRecaptcha() {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
}

export async function sendMfaEnrollmentCode(phoneNumber) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');

  const mfaUser = multiFactor(user);
  const session = await mfaUser.getSession();

  const provider = new PhoneAuthProvider(auth);
  const verifier = getRecaptcha();
  const verificationId = await provider.verifyPhoneNumber(
    { phoneNumber, session },
    verifier
  );

  return { verificationId, session };
}

export async function verifyMfaEnrollmentCode(verificationId, verificationCode) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');

  const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
  const assertion = PhoneMultiFactorGenerator.assertion(credential);

  const mfaUser = multiFactor(user);
  await mfaUser.enroll(assertion, 'Phone');

  clearRecaptcha();
  return true;
}

export function handleMfaError(error) {
  if (error.code === 'auth/multi-factor-auth-required') {
    const resolver = getMultiFactorResolver(auth, error);
    lastResolver = resolver;
    return resolver;
  }
  return null;
}

export function getLastResolver() {
  return lastResolver;
}

export function clearLastResolver() {
  lastResolver = null;
  lastVerificationId = null;
}

export async function sendMfaChallengeCode(resolver) {
  const hint = resolver.hints[0];
  if (!hint || hint.factorId !== 'phone') {
    throw new Error('No phone MFA enrolled');
  }

  const provider = new PhoneAuthProvider(auth);
  const verifier = getRecaptcha();
  const verificationId = await provider.verifyPhoneNumber(
    { multiFactorHint: hint, session: resolver.session },
    verifier
  );

  lastVerificationId = verificationId;
  return { verificationId, phoneNumber: hint.phoneNumber };
}

export async function verifyMfaChallengeCode(verificationCode) {
  if (!lastResolver || !lastVerificationId) {
    throw new Error('No MFA challenge in progress');
  }

  const credential = PhoneAuthProvider.credential(lastVerificationId, verificationCode);
  const assertion = PhoneMultiFactorGenerator.assertion(credential);

  const result = await lastResolver.resolveSignIn(assertion);
  clearRecaptcha();
  clearLastResolver();
  return result;
}

export async function getFirebaseToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export async function getFirebaseTokenResult() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdTokenResult();
}

export async function checkAdminClaim() {
  try {
    const result = await getFirebaseTokenResult();
    return result?.claims?.admin === true;
  } catch {
    return false;
  }
}

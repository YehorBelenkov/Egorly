import { useState, useEffect } from 'react';
import { app } from '../../lib/firebaseConfig';
import {
  getAuth,
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential, sendEmailVerification
} from 'firebase/auth';
import { useRouter } from 'next/router';
import { createUserDb } from '../api/createUserDb';
import { convertGuestToUser } from '../../lib/guestUser';
import bcrypt from 'bcryptjs';
import "../login/index.css";

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const auth = getAuth(app);
  auth.languageCode = 'en';

  // Format phone number as user types
  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    
    // Always start with +1
    if (cleaned.length <= 1) return '+1 ';
    
    // Skip the country code '1' and format the rest: +1 XXX XXX XXXX
    const digits = cleaned.substring(1); // Skip the '1' from country code
    let formatted = '+1 ';
    
    if (digits.length <= 3) {
      formatted += digits;
    } else if (digits.length <= 6) {
      formatted += digits.slice(0, 3) + ' ' + digits.slice(3);
    } else {
      formatted += digits.slice(0, 3) + ' ' + digits.slice(3, 6) + ' ' + digits.slice(6, 10);
    }
    
    return formatted;
  };

  // Handle phone input change
  const handlePhoneChange = (e) => {
    const input = e.target.value;
    
    // If user deletes everything, reset to empty
    if (input.length === 0 || input === '+' || input === '+1' || input === '+1 ') {
      setPhone('');
      return;
    }
    
    // If user starts typing and field is empty, add +1 prefix
    if (phone === '' && input.length > 0) {
      const formatted = formatPhoneNumber('+1' + input);
      setPhone(formatted);
      return;
    }
    
    // Only allow if it starts with +1
    if (!input.startsWith('+1')) {
      return;
    }
    
    // Format the number
    const formatted = formatPhoneNumber(input);
    setPhone(formatted);
  };

  // Map common Firebase Auth errors to friendly messages
  const mapAuthError = (err) => {
    const code = err?.code || '';
    const msg = err?.message || String(err || 'An error occurred');
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-email':
        return 'The email address is invalid.';
      case 'auth/weak-password':
        return 'The password is too weak. Please choose a stronger password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      default:
        return msg;
    }
  };

  // Initialize reCAPTCHA once
  useEffect(() => {
  if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
    // Initialize reCAPTCHA once
    window.recaptchaVerifier = new RecaptchaVerifier(
      'recaptcha-container',
      { size: 'invisible' }, // invisible in production
      auth
    );
    window.recaptchaVerifier.render();
  }
}, []);

  // ----------------------
  // Email/Password Signup
  // ----------------------
  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await createUserDb(user, hashedPassword);
      await sendEmailVerification(user);
      
      // Migrate guest data if exists
      const guestId = localStorage.getItem('guestUserId');
      if (guestId) {
        await convertGuestToUser(guestId, user.uid);
      }

      router.push('/');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // ----------------------
  // Send OTP to Phone
  // ----------------------
  const handleSendOtp = async () => {
  setLoading(true);
  setError('');

  try {
    // Remove all non-digit characters and spaces
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as +1XXXXXXXXXX
    const formattedPhone = '+' + cleaned;
    
    // Validate minimum length (country code + 10 digits = 11 total digits)
    if (cleaned.length < 11) {
      throw new Error('Please enter a complete 10-digit phone number');
    }

    // Use the already rendered recaptchaVerifier
    const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
    setConfirmationResult(result);
  } catch (err) {
    setError(mapAuthError(err) || 'Failed to send OTP');
  } finally {
    setLoading(false);
  }
};

  // ----------------------
  // Verify OTP & Complete Registration
  // ----------------------
  const handleVerifyOtp = async () => {
    if (!confirmationResult) return;
    setLoading(true);
    setError('');

    try {
      const phoneCredential = PhoneAuthProvider.credential(
        confirmationResult.verificationId,
        otp
      );

      let userId;
      if (email && password) {
        // Email + phone registration
        const hashedPassword = bcrypt.hashSync(password, 10);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await linkWithCredential(userCredential.user, phoneCredential);
        await createUserDb(userCredential.user, hashedPassword);
        userId = userCredential.user.uid;
      } else {
        // Phone-only registration
        const userCredential = await confirmationResult.confirm(otp);
        await createUserDb(userCredential.user, '');
        userId = userCredential.user.uid;
      }
      
      // Migrate guest data if exists
      const guestId = localStorage.getItem('guestUserId');
      if (guestId) {
        await convertGuestToUser(guestId, userId);
      }

      router.push('/');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
      if (window.recaptchaVerifier && window.recaptchaVerifier.clear) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    }
  };

  return (
    <>
    <div className='login-bg'>
      {/* Animated Background Circles */}
      <div className="area">
        <ul className="circles">
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
        </ul>
      </div>

      {/* reCAPTCHA container */}
      <div id="recaptcha-container"></div>
    </div>
    <form className='login_container' onSubmit={handleEmailRegister}>
        <div className='company-branding'>
          <p className='brand-text'>
            <span className='animated-brand'>Egorly</span>
          </p>
        </div>
        <div className='txt_container'>
          <h2 className='hG'>Get Started</h2>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          {/* Email Registration */}
          <label className='fill_input_con'>
            Email:
            <input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>
          <label className='fill_input_con'>
            Password:
            <input
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>
          <button className='login_btn font' type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>

          {/* Separator */}
          <div className='login_con_log gap font'>
            <hr/>
            <p className='up'>or</p>
            <hr/>
          </div>

          {/* Phone Registration */}
          <label className='fill_input_con'>
            Phone Number
            <input
              type="tel"
              placeholder="+1 555 123 4567"
              value={phone}
              onChange={handlePhoneChange}
            />
          </label>
          <button
            type="button"
            className='login_btn font'
            onClick={handleSendOtp}
            disabled={loading || !phone}
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>

          {confirmationResult && (
            <>
              <label className='fill_input_con'>
                Enter OTP:
                <input
                  type="text"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                />
              </label>
              <button
                type="button"
                className='login_btn font'
                onClick={handleVerifyOtp}
                disabled={loading || !otp}
              >
                {loading ? 'Verifying...' : 'Verify OTP & Register'}
              </button>
            </>
          )}
        </div>
        <p className='font'>Have an account? <a href='/login'>Log in→</a></p>
      </form>
    </>
  );
};

export default Register;
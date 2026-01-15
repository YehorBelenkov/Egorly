import { useState, useEffect } from 'react';
import { auth } from '../../lib/firebaseConfig';
import {
  signInWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { useRouter } from 'next/router';
import { convertGuestToUser } from '../../lib/guestUser';
import "./index.css";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

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
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/user-not-found':
        return 'No account found with that email.';
      case 'auth/invalid-email':
        return 'The email address is invalid.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/invalid-verification-code':
        return 'Invalid verification code (OTP). Please check and try again.';
      case 'auth/missing-verification-id':
        return 'Missing verification ID. Please request a new code.';
      default:
        // If Firebase provides a message, try to keep it concise
        return msg;
    }
  };

  // ----------------------
  // Initialize reCAPTCHA only once
  // ----------------------
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        'recaptcha-container',
        { size: 'invisible' },
        auth
      );
      window.recaptchaVerifier.render().catch(err => {
        console.warn('reCAPTCHA already rendered');
      });
    }
  }, []);

  // ----------------------
  // Email Login
  // ----------------------
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Migrate guest data if exists
      const guestId = localStorage.getItem('guestUserId');
      if (guestId) {
        await convertGuestToUser(guestId, userCredential.user.uid);
      }
      
      // Redirect to home page after successful login
      router.push('/');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // ----------------------
  // Phone Login - Send OTP
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

      // Use existing reCAPTCHA if it exists
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          'recaptcha-container',
          { size: 'invisible' },
          auth
        );
        await window.recaptchaVerifier.render();
      }

      const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(result);
    } catch (err) {
      setError(mapAuthError(err) || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------
  // Phone Login - Verify OTP
  // ----------------------
  const handleVerifyOtp = async () => {
    if (!confirmationResult) return;
    setLoading(true);
    setError('');
    try {
      const userCredential = await confirmationResult.confirm(otp);
      
      // Migrate guest data if exists
      const guestId = localStorage.getItem('guestUserId');
      if (guestId) {
        await convertGuestToUser(guestId, userCredential.user.uid);
      }
      
      // Redirect to home page after successful phone login
      router.push('/');
    } catch (err) {
      setError(mapAuthError(err) || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (<>
 
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
      <form className='login_container' onSubmit={handleEmailLogin}>
        <div className='company-branding'>
          <p className='brand-text'>
            <span className='animated-brand'>Egorly</span>
          </p>
        </div>
        <div className='txt_container'>
          <h2 className='hG'>Welcome Back</h2>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          {/* Email Login */}
          <label className='fill_input_con'>
            Email:
            <input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className='fill_input_con'>
            Password:
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <p style={{ marginTop: '0.25rem' }} className='font'>
            <a className='font' href="/reset-password">Forgot password?</a>
          </p>
          <button className='login_btn font' type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>

          {/* Separator */}
          <div className='login_con_log gap font'>
            <hr/>
            <p className='up'>or</p>
            <hr/>
          </div>

          {/* Phone Login */}
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
                  onChange={(e) => setOtp(e.target.value)}
                />
              </label>
              <button
                type="button"
                className='login_btn font'
                onClick={handleVerifyOtp}
                disabled={loading || !otp}
              >
                {loading ? 'Verifying...' : 'Verify OTP & Login'}
              </button>
            </>
          )}
          <p className='font'>New to Egorly? <a href='/register'>Get Started→</a></p>
        </div>
      </form>
       </>
  );
};

export default Login;
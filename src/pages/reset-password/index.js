import { useState } from 'react';
import { auth } from '../../lib/firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useRouter } from 'next/router';
import '../login/index.css';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent. Check your inbox.');
    } catch (err) {
      // Basic friendly mapping
      const code = err?.code || '';
      if (code === 'auth/user-not-found') setError('No account found with that email.');
      else if (code === 'auth/invalid-email') setError('The email address is invalid.');
      else setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='login-bg'>
      <form className='login_container' onSubmit={handleReset}>
        <div className='login_con_log'>
          <img className="logo_l" src="/images/Egorly.jpg" alt="Egorly Logo" />
          <h1 className='hG'>Reset Password</h1>
        </div>
        <div className='txt_container'>
          <h2 className='hG'>Reset your password</h2>
          <p className='font color'>Enter the email address associated with your account and we'll send a link to reset your password.</p>

          {message && <p style={{ color: 'green' }}>{message}</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}

          <label className='fill_input_con'>
            Email:
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>

          <button className='login_btn font' type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset email'}
          </button>

          <p className='font'>Remembered? <a href='/login'>Back to login→</a></p>
        </div>
      </form>
    </div>
  );
}

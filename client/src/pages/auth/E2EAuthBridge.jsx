import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import Loader from '../../components/common/Loader';

/**
 * Dev-only route for Playwright: /e2e-auth?customToken=...
 * Signs in via Firebase custom token (minted by Admin SDK in test setup).
 */
export default function E2EAuthBridge() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const customToken = params.get('customToken');
    if (!customToken) {
      setError('Missing customToken query parameter');
      return;
    }
    signInWithCustomToken(auth, customToken)
      .then(() => navigate('/admin/dashboard', { replace: true }))
      .catch((err) => setError(err.message || 'Sign-in failed'));
  }, [params, navigate]);

  if (error) {
    return (
      <div style={{ padding: 24, color: '#b91c1c' }}>
        E2E auth failed: {error}
      </div>
    );
  }
  return <Loader fullScreen />;
}

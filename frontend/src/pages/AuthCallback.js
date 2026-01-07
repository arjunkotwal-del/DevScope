import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      navigate('/auth?error=' + error);
      return;
    }

    if (token) {
      localStorage.setItem('devscope_token', token);
      window.location.href = '/dashboard';
    } else {
      navigate('/auth');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p className="text-white mt-4 text-lg">Completing authentication...</p>
      </div>
    </div>
  );
}

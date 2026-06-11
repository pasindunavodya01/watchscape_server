import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate(); // added for redirect

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent!');
      navigate("/"); // redirect to Landing page after alert
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 px-4">
      <form onSubmit={handleReset} className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
          <p className="text-gray-500">We'll send you an email to reset your password.</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>
        </div>

        <button className="w-full mt-6 bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 transition-colors">
          Send Reset Email
        </button>
        
        <p className="mt-4 text-xs text-gray-500 text-center px-4">
          Note: Please check your spam/junk folders if you don't see the email.
        </p>
        
        <div className="mt-6 text-center text-sm">
          <Link
            to="/login"
            className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
          >
            Return to Login
          </Link>
        </div>
      </form>
    </div>
  );
}
